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
    const userIdStr = req.user._id;
    const userId = new mongoose.Types.ObjectId(userIdStr);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [
      workersCount,
      customersCount,
      stitchingStats,
      totalRevenue,
      recentStitchings,
      upcomingDueStitchings,
      pendingStitchings,
      inProgressStitchings,
      completedStitchings,
      workerPayments,
      dueTodayCount
    ] = await Promise.all([
      Worker.countDocuments({ userId: userIdStr }),
      Customer.countDocuments({ userId: userIdStr }),
      Stitching.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$price' }
          }
        }
      ]),
      Stitching.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$price' }, paid: { $sum: '$paidAmount' } } }
      ]),
      Stitching.find({ userId: userIdStr })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name phone nameI18n')
        .populate('workerId', 'name phone nameI18n')
        .lean(),
      Stitching.find({
        userId: userIdStr,
        dueDate: { $ne: null },
        status: { $nin: ['delivered', 'done'] }
      })
        .sort({ dueDate: 1 })
        .limit(8)
        .populate('customerId', 'name phone nameI18n')
        .populate('workerId', 'name phone nameI18n')
        .lean(),
      Stitching.countDocuments({ userId: userIdStr, status: { $in: ['pending', 'assigned'] } }),
      Stitching.countDocuments({ userId: userIdStr, status: 'in_progress' }),
      Stitching.countDocuments({ userId: userIdStr, status: { $in: ['completed', 'delivered'] } }),
      Payment.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Stitching.countDocuments({
        userId: userIdStr,
        dueDate: { $gte: todayStart, $lte: todayEnd },
        status: { $nin: ['delivered', 'done'] }
      })
    ]);

    const endDate = req.user.subscriptionEndDate ? new Date(req.user.subscriptionEndDate) : null;
    const daysRemaining = endDate && Number.isFinite(endDate.getTime())
      ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
      : 0;
    
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
        workerPayments: workerPayments[0]?.total || 0,
        dueTodayCount
      },
      stitchingStats,
      recentStitchings,
      upcomingDueStitchings,
      subscription: {
        type: req.user.subscriptionType,
        endDate: req.user.subscriptionEndDate,
        daysRemaining
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
