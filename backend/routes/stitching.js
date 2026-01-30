const express = require('express');
const router = express.Router();
const Stitching = require('../models/Stitching');
const Customer = require('../models/Customer');
const Worker = require('../models/Worker');
const User = require('../models/User');
const EmbroideryDesign = require('../models/EmbroideryDesign');
const Fabric = require('../models/Fabric');
const { verifyToken, isUser } = require('../middleware/auth');
const { blockDemoWrites } = require('../middleware/demoGuard');
const whatsappService = require('../utils/whatsappService');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const canonicalSaudiMobile = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  let d = digits;
  if (d.startsWith('966')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length > 9) d = d.slice(-9);
  return d;
};

const buildSaudiPhoneNeedles = (q) => {
  const digits = String(q || '').replace(/\D/g, '');
  if (!digits) return [];
  const d9 = canonicalSaudiMobile(digits);
  if (!d9 || d9.length < 3) return [];
  const set = new Set([
    digits,
    d9,
    `0${d9}`,
    `966${d9}`,
    `+966${d9}`
  ]);
  return Array.from(set);
};

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
      .populate('customerId', 'name phone nameI18n')
      .populate('relationId', 'name phone nameI18n')
      .populate('workerId', 'name phone nameI18n')
      .populate('fabricId', 'name madeIn pricePerRoll rollsInStock');
    
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

    if (phone) {
      const safePhone = escapeRegex(phone);
      const needles = buildSaudiPhoneNeedles(phone);
      const orPhone = [
        { phone: { $regex: safePhone, $options: 'i' } },
        ...needles.map((n) => ({ phone: { $regex: escapeRegex(n), $options: 'i' } }))
      ];

      const matchedCustomers = await Customer.find({
        userId: req.user._id,
        $or: orPhone
      }).select('_id').limit(50);

      const ids = matchedCustomers.map((c) => c._id);
      if (!ids.length) {
        return res.json({ stitchings: [] });
      }
      query.customerId = { $in: ids };
    }
    
    let stitchings = await Stitching.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('customerId', 'name phone nameI18n')
      .populate('relationId', 'name phone nameI18n')
      .populate('workerId', 'name phone nameI18n');

    if (phone) {
      const p = canonicalSaudiMobile(phone);
      if (p) {
        stitchings = stitchings.filter((s) => canonicalSaudiMobile(s.customerId?.phone) === p);
      }
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
      .populate('relationId', 'name phone nameI18n')
      .populate('workerId', 'name phone')
      .populate('fabricId', 'name madeIn pricePerRoll rollsInStock');
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }
    
    res.json({ stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create stitching order
router.post('/', blockDemoWrites, async (req, res) => {
  try {
    const { 
      customerId, 
      relationId,
      relationName,
      relationType,
      orderFor,
      measurements, 
      styleOptions,
      embroideryDesignId,
      quantity, 
      price, 
      paidAmount,
      description, 
      dueDate,
      receiptNumber,
      thawbType,
      fabricColor,
      fabricId,
      rollsUsed
    } = req.body;
    
    const customer = await Customer.findOne({ 
      _id: customerId, 
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let relationToSave = null;
    if (relationId) {
      const relExists = await Customer.findOne({ _id: relationId, userId: req.user._id }).select('_id name phone nameI18n measurements');
      if (!relExists) return res.status(400).json({ error: 'Invalid relation customer' });
      relationToSave = relExists;
    }
    
    let finalReceiptNumber = receiptNumber;
    if (!finalReceiptNumber) {
      const user = await User.findById(req.user._id);
      finalReceiptNumber = user.generateReceiptNumber();
      await user.save();
    }

    let designIdToSave = null;
    let designSnapshot = {};
    if (embroideryDesignId) {
      const design = await EmbroideryDesign.findOne({ _id: embroideryDesignId, userId: req.user._id });
      if (!design) {
        return res.status(400).json({ error: 'Invalid embroidery design' });
      }
      designIdToSave = design._id;
      designSnapshot = {
        name: design.name || '',
        image: design.image || null,
        imageUpdatedAt: design.imageUpdatedAt || null
      };
    }

    const rollsUsedNum = Number(rollsUsed);
    if (rollsUsed !== undefined && (!Number.isFinite(rollsUsedNum) || rollsUsedNum < 0)) {
      return res.status(400).json({ error: 'Invalid rolls used' });
    }
    const rollsToUse = Number.isFinite(rollsUsedNum) ? rollsUsedNum : 0;
    const fabricToUse = fabricId ? String(fabricId) : null;

    if (fabricToUse && rollsToUse > 0) {
      const updated = await Fabric.findOneAndUpdate(
        { _id: fabricToUse, userId: req.user._id, rollsInStock: { $gte: rollsToUse } },
        { $inc: { rollsInStock: -rollsToUse } },
        { new: true }
      );
      if (!updated) {
        const exists = await Fabric.findOne({ _id: fabricToUse, userId: req.user._id }).select('_id');
        if (!exists) return res.status(400).json({ error: 'Invalid fabric' });
        return res.status(400).json({ error: 'Insufficient fabric stock' });
      }
    } else if (fabricToUse) {
      const exists = await Fabric.findOne({ _id: fabricToUse, userId: req.user._id }).select('_id');
      if (!exists) return res.status(400).json({ error: 'Invalid fabric' });
    }
    
    const defaultMeasurements = relationToSave ? relationToSave.measurements : customer.measurements;

    const stitching = new Stitching({
      userId: req.user._id,
      customerId,
      relationId: relationToSave?._id || null,
      relationName: (relationToSave ? (relationToSave.nameI18n?.en || relationToSave.name) : null) || relationName || null,
      relationType: relationType || null,
      orderFor: (relationToSave ? (relationToSave.nameI18n?.en || relationToSave.name) : null) || orderFor || null,
      receiptNumber: finalReceiptNumber,
      thawbType: thawbType || 'saudi',
      fabricColor: fabricColor || null,
      fabricId: fabricToUse,
      rollsUsed: rollsToUse,
      measurements: measurements || defaultMeasurements,
      styleOptions: styleOptions || {},
      embroideryDesignId: designIdToSave,
      embroideryDesign: designSnapshot,
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
    await customer.save();

    if (measurements) {
      if (relationToSave) {
        relationToSave.measurements = { ...relationToSave.measurements.toObject(), ...measurements };
        await relationToSave.save();
      } else {
        customer.measurements = { ...customer.measurements.toObject(), ...measurements };
        await customer.save();
      }
    }
    
    await stitching.populate('customerId', 'name phone nameI18n');
    await stitching.populate('relationId', 'name phone nameI18n');
    await stitching.populate('fabricId', 'name madeIn pricePerRoll rollsInStock');
    
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
router.put('/:id', blockDemoWrites, async (req, res) => {
  try {
    const { 
      relationId,
      relationName,
      relationType,
      orderFor,
      measurements, 
      styleOptions,
      embroideryDesignId,
      quantity, 
      price, 
      paidAmount,
      description, 
      dueDate,
      status,
      thawbType,
      fabricColor,
      fabricId,
      rollsUsed
    } = req.body;
    
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }

    const oldStatus = stitching.status;
    const oldQty = Number(stitching.quantity) || 0;
    const wasCredited = !!stitching.workerEarningsCredited;
    const workerId = stitching.workerId;

    const oldFabricId = stitching.fabricId ? String(stitching.fabricId) : null;
    const oldRollsUsed = Number(stitching.rollsUsed) || 0;

    let nextFabricId = oldFabricId;
    if (fabricId !== undefined) {
      nextFabricId = fabricId ? String(fabricId) : null;
    }

    let nextRollsUsed = oldRollsUsed;
    if (rollsUsed !== undefined) {
      const n = Number(rollsUsed);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ error: 'Invalid rolls used' });
      }
      nextRollsUsed = n;
    }

    if (nextFabricId) {
      const exists = await Fabric.findOne({ _id: nextFabricId, userId: req.user._id }).select('_id');
      if (!exists) return res.status(400).json({ error: 'Invalid fabric' });
    }

    if (oldFabricId === nextFabricId) {
      const delta = nextRollsUsed - oldRollsUsed;
      if (delta > 0 && nextFabricId) {
        const updated = await Fabric.findOneAndUpdate(
          { _id: nextFabricId, userId: req.user._id, rollsInStock: { $gte: delta } },
          { $inc: { rollsInStock: -delta } },
          { new: true }
        );
        if (!updated) return res.status(400).json({ error: 'Insufficient fabric stock' });
      } else if (delta < 0 && nextFabricId) {
        await Fabric.findOneAndUpdate(
          { _id: nextFabricId, userId: req.user._id },
          { $inc: { rollsInStock: Math.abs(delta) } },
          { new: true }
        );
      }
    } else {
      if (nextFabricId && nextRollsUsed > 0) {
        const updated = await Fabric.findOneAndUpdate(
          { _id: nextFabricId, userId: req.user._id, rollsInStock: { $gte: nextRollsUsed } },
          { $inc: { rollsInStock: -nextRollsUsed } },
          { new: true }
        );
        if (!updated) return res.status(400).json({ error: 'Insufficient fabric stock' });
      }

      if (oldFabricId && oldRollsUsed > 0) {
        await Fabric.findOneAndUpdate(
          { _id: oldFabricId, userId: req.user._id },
          { $inc: { rollsInStock: oldRollsUsed } },
          { new: true }
        );
      }
    }
    
    if (measurements) stitching.measurements = measurements;
    if (styleOptions) stitching.styleOptions = styleOptions;
    if (embroideryDesignId !== undefined) {
      if (!embroideryDesignId) {
        stitching.embroideryDesignId = null;
        stitching.embroideryDesign = {};
      } else {
        const design = await EmbroideryDesign.findOne({ _id: embroideryDesignId, userId: req.user._id });
        if (!design) {
          return res.status(400).json({ error: 'Invalid embroidery design' });
        }
        stitching.embroideryDesignId = design._id;
        stitching.embroideryDesign = {
          name: design.name || '',
          image: design.image || null,
          imageUpdatedAt: design.imageUpdatedAt || null
        };
      }
    }
    if (quantity) stitching.quantity = quantity;
    if (price !== undefined) stitching.price = price;
    if (paidAmount !== undefined) stitching.paidAmount = paidAmount;
    if (description !== undefined) stitching.description = description;
    if (dueDate !== undefined) stitching.dueDate = dueDate;
    if (thawbType) stitching.thawbType = thawbType;
    if (fabricColor !== undefined) stitching.fabricColor = fabricColor;
    if (fabricId !== undefined) stitching.fabricId = nextFabricId;
    if (rollsUsed !== undefined) stitching.rollsUsed = nextRollsUsed;

    if (relationId !== undefined || relationName !== undefined || relationType !== undefined || orderFor !== undefined) {
      let relToSave = null;
      if (relationId) {
        const relExists = await Customer.findOne({ _id: relationId, userId: req.user._id }).select('_id name phone nameI18n');
        if (!relExists) return res.status(400).json({ error: 'Invalid relation customer' });
        relToSave = relExists;
      }
      stitching.relationId = relToSave?._id || (relationId ? relationId : null);
      stitching.relationName = (relToSave ? (relToSave.nameI18n?.en || relToSave.name) : null) || (relationName !== undefined ? relationName : stitching.relationName);
      stitching.relationType = relationType !== undefined ? relationType : stitching.relationType;
      stitching.orderFor = (relToSave ? (relToSave.nameI18n?.en || relToSave.name) : null) || (orderFor !== undefined ? orderFor : stitching.orderFor);
    }

    if (measurements) {
      const targetId = stitching.relationId ? (stitching.relationId._id || stitching.relationId) : (stitching.customerId?._id || stitching.customerId);
      const targetCustomer = await Customer.findOne({ _id: targetId, userId: req.user._id });
      if (targetCustomer) {
        targetCustomer.measurements = { ...targetCustomer.measurements.toObject(), ...measurements };
        await targetCustomer.save();
      }
    }
    if (status) {
      stitching.status = status;
      if (status === 'completed') stitching.completedDate = new Date();
      if (status === 'delivered') stitching.deliveredDate = new Date();
    }

    const newStatus = stitching.status;
    const newQty = Number(stitching.quantity) || 0;

    const rollbackWorkerEarnings = async (qtyToUse) => {
      if (!workerId) return;
      const worker = await Worker.findOne({ _id: workerId, userId: req.user._id });
      if (!worker) return;
      if (worker.paymentType !== 'per_stitching') return;
      const q = Number(qtyToUse) || 0;
      const delta = (Number(worker.paymentAmount) || 0) * q;
      worker.totalEarnings = Math.max(0, (Number(worker.totalEarnings) || 0) - delta);
      worker.completedStitchings = Math.max(0, (Number(worker.completedStitchings) || 0) - q);
      await worker.save();
    };

    const creditWorkerEarnings = async (qtyToUse) => {
      if (!workerId) return;
      const worker = await Worker.findOne({ _id: workerId, userId: req.user._id });
      if (!worker) return;
      if (worker.paymentType !== 'per_stitching') return;
      const q = Number(qtyToUse) || 0;
      const delta = (Number(worker.paymentAmount) || 0) * q;
      worker.totalEarnings = (Number(worker.totalEarnings) || 0) + delta;
      worker.completedStitchings = (Number(worker.completedStitchings) || 0) + q;
      await worker.save();
    };

    if (wasCredited && oldStatus === 'delivered' && newStatus !== 'delivered') {
      await rollbackWorkerEarnings(oldQty);
      stitching.workerEarningsCredited = false;
    }

    if (!wasCredited && newStatus === 'delivered') {
      await creditWorkerEarnings(newQty);
      stitching.workerEarningsCredited = true;
    }

    if (wasCredited && oldStatus === 'delivered' && newStatus === 'delivered' && oldQty !== newQty) {
      const deltaQty = newQty - oldQty;
      if (deltaQty > 0) {
        await creditWorkerEarnings(deltaQty);
      } else if (deltaQty < 0) {
        await rollbackWorkerEarnings(Math.abs(deltaQty));
      }
      stitching.workerEarningsCredited = true;
    }
    
    await stitching.save();
    await stitching.populate('customerId', 'name phone nameI18n');
    await stitching.populate('relationId', 'name phone nameI18n');
    await stitching.populate('workerId', 'name phone nameI18n');
    await stitching.populate('fabricId', 'name madeIn pricePerRoll rollsInStock');
    
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
router.put('/:id/assign', blockDemoWrites, async (req, res) => {
  try {
    const { workerId } = req.body;
    
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }

    if (stitching.workerEarningsCredited && stitching.workerId) {
      const oldWorker = await Worker.findOne({ _id: stitching.workerId, userId: req.user._id });
      if (oldWorker && oldWorker.paymentType === 'per_stitching') {
        const q = Number(stitching.quantity) || 0;
        const delta = (Number(oldWorker.paymentAmount) || 0) * q;
        oldWorker.totalEarnings = Math.max(0, (Number(oldWorker.totalEarnings) || 0) - delta);
        oldWorker.completedStitchings = Math.max(0, (Number(oldWorker.completedStitchings) || 0) - q);
        await oldWorker.save();
      }
      stitching.workerEarningsCredited = false;
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
    await stitching.populate('customerId', 'name phone nameI18n');
    await stitching.populate('workerId', 'name phone nameI18n');
    
    res.json({ message: 'Worker assigned successfully', stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete stitching
router.delete('/:id', blockDemoWrites, async (req, res) => {
  try {
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }

    if (stitching.workerEarningsCredited && stitching.workerId) {
      const oldWorker = await Worker.findOne({ _id: stitching.workerId, userId: req.user._id });
      if (oldWorker && oldWorker.paymentType === 'per_stitching') {
        const q = Number(stitching.quantity) || 0;
        const delta = (Number(oldWorker.paymentAmount) || 0) * q;
        oldWorker.totalEarnings = Math.max(0, (Number(oldWorker.totalEarnings) || 0) - delta);
        oldWorker.completedStitchings = Math.max(0, (Number(oldWorker.completedStitchings) || 0) - q);
        await oldWorker.save();
      }
    }
    
    const customer = await Customer.findById(stitching.customerId);
    if (customer) {
      customer.totalSpent -= stitching.price;
      customer.totalOrders -= 1;
      await customer.save();
    }

    const fid = stitching.fabricId ? String(stitching.fabricId) : null;
    const ru = Number(stitching.rollsUsed) || 0;
    if (fid && ru > 0) {
      await Fabric.findOneAndUpdate(
        { _id: fid, userId: req.user._id },
        { $inc: { rollsInStock: ru } },
        { new: true }
      );
    }
    
    await Stitching.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Stitching deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
