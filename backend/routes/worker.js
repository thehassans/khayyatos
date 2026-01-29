const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Stitching = require('../models/Stitching');
const Payment = require('../models/Payment');
const { verifyToken, isUser, isWorker } = require('../middleware/auth');

// User routes for managing workers
router.get('/', verifyToken, isUser, async (req, res) => {
  try {
    const workers = await Worker.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-password');
    res.json({ workers });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', verifyToken, isUser, async (req, res) => {
  try {
    const worker = await Worker.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).select('-password');
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    const stitchings = await Stitching.find({ workerId: worker._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name phone');
    
    const payments = await Payment.find({ workerId: worker._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({ worker, stitchings, payments });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', verifyToken, isUser, async (req, res) => {
  try {
    const { name, phone, password, paymentType, paymentAmount } = req.body;
    
    const existingWorker = await Worker.findOne({ userId: req.user._id, phone });
    if (existingWorker) {
      return res.status(400).json({ error: 'Worker with this phone already exists' });
    }
    
    const worker = new Worker({
      userId: req.user._id,
      name,
      phone,
      password,
      paymentType: paymentType || 'per_stitching',
      paymentAmount: paymentAmount || 0
    });
    
    await worker.save();
    
    res.status(201).json({ 
      message: 'Worker created successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        phone: worker.phone,
        paymentType: worker.paymentType,
        paymentAmount: worker.paymentAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', verifyToken, isUser, async (req, res) => {
  try {
    const { name, phone, password, paymentType, paymentAmount, isActive } = req.body;
    
    const worker = await Worker.findOne({ _id: req.params.id, userId: req.user._id });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    if (name) worker.name = name;
    if (phone) worker.phone = phone;
    if (password) worker.password = password;
    if (paymentType) worker.paymentType = paymentType;
    if (paymentAmount !== undefined) worker.paymentAmount = paymentAmount;
    if (isActive !== undefined) worker.isActive = isActive;
    
    await worker.save();
    
    res.json({ message: 'Worker updated successfully', worker });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', verifyToken, isUser, async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, userId: req.user._id });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    await Stitching.updateMany(
      { workerId: worker._id },
      { $set: { workerId: null, status: 'pending' } }
    );
    
    await Payment.deleteMany({ workerId: worker._id });
    await Worker.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Worker panel routes
router.get('/panel/dashboard', verifyToken, isWorker, async (req, res) => {
  try {
    const workerId = req.worker._id;
    
    const assignedStitchings = await Stitching.countDocuments({ 
      workerId, 
      status: { $in: ['assigned', 'in_progress'] } 
    });
    
    const completedStitchings = await Stitching.countDocuments({ 
      workerId, 
      status: 'completed' 
    });
    
    const pendingAmount = req.worker.pendingAmount;
    const totalEarnings = req.worker.totalEarnings;
    const totalPaid = req.worker.totalPaid;
    
    const recentStitchings = await Stitching.find({ workerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name phone');
    
    res.json({
      stats: {
        assignedStitchings,
        completedStitchings,
        pendingAmount,
        totalEarnings,
        totalPaid
      },
      recentStitchings
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/panel/stitchings', verifyToken, isWorker, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { workerId: req.worker._id };
    
    if (status) {
      query.status = status;
    }
    
    const stitchings = await Stitching.find(query)
      .sort({ createdAt: -1 })
      .populate('customerId', 'name phone');
    
    res.json({ stitchings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/panel/stitchings/:id/status', verifyToken, isWorker, async (req, res) => {
  try {
    const { status } = req.body;
    
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      workerId: req.worker._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }
    
    if (status === 'completed' && stitching.status !== 'completed') {
      stitching.completedDate = new Date();
      
      if (req.worker.paymentType === 'per_stitching') {
        req.worker.totalEarnings += req.worker.paymentAmount * stitching.quantity;
        req.worker.completedStitchings += stitching.quantity;
        await req.worker.save();
      }
    }
    
    stitching.status = status;
    await stitching.save();
    
    res.json({ message: 'Status updated successfully', stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/panel/amounts', verifyToken, isWorker, async (req, res) => {
  try {
    const payments = await Payment.find({ workerId: req.worker._id })
      .sort({ createdAt: -1 });
    
    res.json({
      payments,
      summary: {
        totalEarnings: req.worker.totalEarnings,
        totalPaid: req.worker.totalPaid,
        pendingAmount: req.worker.pendingAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/panel/settings', verifyToken, isWorker, async (req, res) => {
  try {
    const { language } = req.body;
    
    if (language) {
      req.worker.language = language;
      await req.worker.save();
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
