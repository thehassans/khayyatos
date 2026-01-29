const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Stitching = require('../models/Stitching');
const { verifyToken, isUser } = require('../middleware/auth');

router.use(verifyToken, isUser);

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { userId: req.user._id };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Customer.countDocuments(query);
    
    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search customers
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json({ customers: [] });
    }
    
    const customers = await Customer.find({
      userId: req.user._id,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);
    
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer loyalty data
router.get('/loyalty', async (req, res) => {
  try {
    const { search, sortBy = 'totalSpent', order = 'desc' } = req.query;
    
    const query = { userId: req.user._id };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const customers = await Customer.find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(100);
    
    const totalCustomers = await Customer.countDocuments({ userId: req.user._id });
    const totalSpent = await Customer.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: '$totalSpent' } } }
    ]);
    
    res.json({
      customers,
      stats: {
        totalCustomers,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single customer with history
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const stitchings = await Stitching.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .populate('workerId', 'name');
    
    res.json({ customer, stitchings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, measurements, notes } = req.body;
    
    let customer = await Customer.findOne({ userId: req.user._id, phone });
    
    if (customer) {
      if (measurements) {
        customer.measurements = { ...customer.measurements.toObject(), ...measurements };
      }
      if (notes) customer.notes = notes;
      await customer.save();
      return res.json({ message: 'Customer updated', customer, isExisting: true });
    }
    
    customer = new Customer({
      userId: req.user._id,
      name,
      phone,
      measurements: measurements || {},
      notes: notes || ''
    });
    
    await customer.save();
    
    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, measurements, notes } = req.body;
    
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (measurements) {
      customer.measurements = { ...customer.measurements.toObject(), ...measurements };
    }
    if (notes !== undefined) customer.notes = notes;
    
    await customer.save();
    
    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    await Stitching.deleteMany({ customerId: customer._id });
    await Customer.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
