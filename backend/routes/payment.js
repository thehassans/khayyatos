const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const { verifyToken, isUser } = require('../middleware/auth');

router.use(verifyToken, isUser);

// Get all payments
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, workerId } = req.query;
    const query = { userId: req.user._id };
    
    if (workerId) query.workerId = workerId;
    
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('workerId', 'name phone');
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get worker payment summary
router.get('/summary', async (req, res) => {
  try {
    const workers = await Worker.find({ userId: req.user._id })
      .select('name phone totalEarnings totalPaid pendingAmount');
    
    const totalPaid = await Payment.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      workers,
      totalPaid: totalPaid[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create payment (send money to worker)
router.post('/', async (req, res) => {
  try {
    const { workerId, amount, type, description } = req.body;
    
    const worker = await Worker.findOne({ 
      _id: workerId, 
      userId: req.user._id 
    });
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    const payment = new Payment({
      userId: req.user._id,
      workerId,
      amount,
      type: type || 'salary',
      description: description || ''
    });
    
    await payment.save();
    
    worker.totalPaid += amount;
    worker.pendingAmount = worker.totalEarnings - worker.totalPaid;
    await worker.save();
    
    await payment.populate('workerId', 'name phone');
    
    res.status(201).json({ 
      message: 'Payment sent successfully',
      payment,
      workerBalance: {
        totalEarnings: worker.totalEarnings,
        totalPaid: worker.totalPaid,
        pendingAmount: worker.pendingAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const worker = await Worker.findById(payment.workerId);
    if (worker) {
      worker.totalPaid -= payment.amount;
      worker.pendingAmount = worker.totalEarnings - worker.totalPaid;
      await worker.save();
    }
    
    await Payment.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
