const express = require('express');
const router = express.Router();
const Stitching = require('../models/Stitching');
const Customer = require('../models/Customer');
const Worker = require('../models/Worker');
const User = require('../models/User');
const { verifyToken, isUser } = require('../middleware/auth');
const whatsappService = require('../utils/whatsappService');

router.use(verifyToken, isUser);

// Get all stitchings
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, workerId } = req.query;
    const query = { userId: req.user._id };
    
    if (status) query.status = status;
    if (workerId) query.workerId = workerId;
    if (search) {
      query.receiptNumber = { $regex: search, $options: 'i' };
    }
    
    const stitchings = await Stitching.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('customerId', 'name phone')
      .populate('workerId', 'name phone');
    
    const total = await Stitching.countDocuments(query);
    
    res.json({
      stitchings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search by receipt number
router.get('/search', async (req, res) => {
  try {
    const { receipt, phone } = req.query;
    const query = { userId: req.user._id };
    
    if (receipt) {
      query.receiptNumber = { $regex: receipt, $options: 'i' };
    }
    
    let stitchings = await Stitching.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('customerId', 'name phone')
      .populate('workerId', 'name');
    
    if (phone) {
      stitchings = stitchings.filter(s => 
        s.customerId?.phone?.includes(phone)
      );
    }
    
    res.json({ stitchings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single stitching
router.get('/:id', async (req, res) => {
  try {
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })
      .populate('customerId')
      .populate('workerId', 'name phone');
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }
    
    res.json({ stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create stitching order
router.post('/', async (req, res) => {
  try {
    const { 
      customerId, 
      measurements, 
      quantity, 
      price, 
      paidAmount,
      description, 
      dueDate,
      receiptNumber,
      thawbType,
      fabricColor 
    } = req.body;
    
    const customer = await Customer.findOne({ 
      _id: customerId, 
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    let finalReceiptNumber = receiptNumber;
    if (!finalReceiptNumber) {
      const user = await User.findById(req.user._id);
      finalReceiptNumber = user.generateReceiptNumber();
      await user.save();
    }
    
    const stitching = new Stitching({
      userId: req.user._id,
      customerId,
      receiptNumber: finalReceiptNumber,
      thawbType: thawbType || 'saudi',
      fabricColor: fabricColor || null,
      measurements: measurements || customer.measurements,
      quantity: quantity || 1,
      price,
      paidAmount: paidAmount || 0,
      description: description || '',
      dueDate: dueDate || null
    });
    
    await stitching.save();
    
    customer.totalSpent += price;
    customer.totalOrders += 1;
    customer.loyaltyPoints += Math.floor(price / 100);
    if (measurements) {
      customer.measurements = { ...customer.measurements.toObject(), ...measurements };
    }
    await customer.save();
    
    await stitching.populate('customerId', 'name phone');
    
    // Send WhatsApp notification for new order
    const user = await User.findById(req.user._id);
    if (user?.whatsappSettings?.enabled && user?.whatsappSettings?.autoMessageOnOrder) {
      whatsappService.sendOrderNotification(user, customer, stitching)
        .then(result => {
          if (result.success) console.log('WhatsApp order notification sent');
          else console.log('WhatsApp notification failed:', result.error);
        })
        .catch(err => console.error('WhatsApp error:', err));
    }
    
    res.status(201).json({ 
      message: 'Stitching order created successfully',
      stitching 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Receipt number already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stitching
router.put('/:id', async (req, res) => {
  try {
    const { 
      measurements, 
      quantity, 
      price, 
      paidAmount,
      description, 
      dueDate,
      status,
      thawbType,
      fabricColor 
    } = req.body;
    
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }
    
    if (measurements) stitching.measurements = measurements;
    if (quantity) stitching.quantity = quantity;
    if (price !== undefined) stitching.price = price;
    if (paidAmount !== undefined) stitching.paidAmount = paidAmount;
    if (description !== undefined) stitching.description = description;
    if (dueDate !== undefined) stitching.dueDate = dueDate;
    if (thawbType) stitching.thawbType = thawbType;
    if (fabricColor !== undefined) stitching.fabricColor = fabricColor;
    const oldStatus = stitching.status;
    if (status) {
      stitching.status = status;
      if (status === 'completed') stitching.completedDate = new Date();
      if (status === 'delivered') stitching.deliveredDate = new Date();
    }
    
    await stitching.save();
    await stitching.populate('customerId', 'name phone');
    await stitching.populate('workerId', 'name');
    
    // Send WhatsApp notification on status change
    if (status && status !== oldStatus) {
      const user = await User.findById(req.user._id);
      const customer = await Customer.findById(stitching.customerId._id || stitching.customerId);
      
      if (user?.whatsappSettings?.enabled && customer) {
        if (status === 'completed' && user.whatsappSettings.autoMessageOnReady) {
          whatsappService.sendReadyNotification(user, customer, stitching)
            .then(result => {
              if (result.success) console.log('WhatsApp ready notification sent');
            })
            .catch(err => console.error('WhatsApp error:', err));
        } else if (status === 'delivered' && user.whatsappSettings.autoMessageOnDelivery) {
          whatsappService.sendDeliveryNotification(user, customer, stitching)
            .then(result => {
              if (result.success) console.log('WhatsApp delivery notification sent');
            })
            .catch(err => console.error('WhatsApp error:', err));
        }
      }
    }
    
    res.json({ message: 'Stitching updated successfully', stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign to worker
router.put('/:id/assign', async (req, res) => {
  try {
    const { workerId } = req.body;
    
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }
    
    if (workerId) {
      const worker = await Worker.findOne({ 
        _id: workerId, 
        userId: req.user._id 
      });
      
      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }
      
      stitching.workerId = workerId;
      stitching.status = 'assigned';
    } else {
      stitching.workerId = null;
      stitching.status = 'pending';
    }
    
    await stitching.save();
    await stitching.populate('customerId', 'name phone');
    await stitching.populate('workerId', 'name');
    
    res.json({ message: 'Worker assigned successfully', stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete stitching
router.delete('/:id', async (req, res) => {
  try {
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }
    
    const customer = await Customer.findById(stitching.customerId);
    if (customer) {
      customer.totalSpent -= stitching.price;
      customer.totalOrders -= 1;
      await customer.save();
    }
    
    await Stitching.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Stitching deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
