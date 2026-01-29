const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Customer = require('../models/Customer');
const Stitching = require('../models/Stitching');
const Payment = require('../models/Payment');
const { verifyToken, isUser } = require('../middleware/auth');

router.use(verifyToken, isUser);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    
    const workersCount = await Worker.countDocuments({ userId: req.user._id });
    const customersCount = await Customer.countDocuments({ userId: req.user._id });
    
    const stitchingStats = await Stitching.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      }
    ]);
    
    const totalRevenue = await Stitching.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$price' }, paid: { $sum: '$paidAmount' } } }
    ]);
    
    const recentStitchings = await Stitching.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name phone')
      .populate('workerId', 'name');
    
    const pendingStitchings = await Stitching.countDocuments({ userId: req.user._id, status: { $in: ['pending', 'assigned'] } });
    const inProgressStitchings = await Stitching.countDocuments({ userId: req.user._id, status: 'in_progress' });
    const completedStitchings = await Stitching.countDocuments({ userId: req.user._id, status: { $in: ['completed', 'delivered'] } });
    
    const workerPayments = await Payment.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      stats: {
        workersCount,
        customersCount,
        pendingStitchings,
        inProgressStitchings,
        completedStitchings,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalPaid: totalRevenue[0]?.paid || 0,
        pendingPayments: (totalRevenue[0]?.total || 0) - (totalRevenue[0]?.paid || 0),
        workerPayments: workerPayments[0]?.total || 0
      },
      stitchingStats,
      recentStitchings,
      subscription: {
        type: req.user.subscriptionType,
        endDate: req.user.subscriptionEndDate,
        daysRemaining: Math.ceil((new Date(req.user.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        businessName: req.user.businessName,
        phone: req.user.phone,
        logo: req.user.logo,
        language: req.user.language,
        theme: req.user.theme,
        subscriptionType: req.user.subscriptionType,
        subscriptionEndDate: req.user.subscriptionEndDate,
        receiptPrefix: req.user.receiptPrefix,
        whatsappEnabled: req.user.whatsappEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
