const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');
const Customer = require('../models/Customer');
const Stitching = require('../models/Stitching');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateToken } = require('../middleware/auth');
const { calculateEndDate } = require('../utils/subscriptionChecker');
const upload = require('../middleware/upload');

router.use(verifyToken, isAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const trialUsers = await User.countDocuments({ subscriptionType: 'trial' });
    const yearlyUsers = await User.countDocuments({ subscriptionType: 'yearly' });
    const lifetimeUsers = await User.countDocuments({ subscriptionType: 'lifetime' });
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');
    
    const expiringUsers = await User.find({
      subscriptionType: { $ne: 'lifetime' },
      subscriptionEndDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).select('-password');
    
    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        trialUsers,
        yearlyUsers,
        lifetimeUsers
      },
      recentUsers,
      expiringUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, subscription } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (subscription) query.subscriptionType = subscription;
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user with stats
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const workersCount = await Worker.countDocuments({ userId: user._id });
    const customersCount = await Customer.countDocuments({ userId: user._id });
    const stitchingsCount = await Stitching.countDocuments({ userId: user._id });
    const totalRevenue = await Stitching.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    res.json({
      user,
      stats: {
        workersCount,
        customersCount,
        stitchingsCount,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user
router.post('/users', upload.single('logo'), async (req, res) => {
  try {
    const { name, nameAr, businessName, businessNameAr, businessAddress, phone, password, subscriptionType, receiptPrefix } = req.body;
    
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    
    const subscriptionEndDate = calculateEndDate(subscriptionType || 'trial');
    
    const user = new User({
      name,
      nameAr: nameAr || name,
      businessName,
      businessNameAr: businessNameAr || businessName,
      businessAddress: businessAddress || '',
      phone,
      password,
      subscriptionType: subscriptionType || 'trial',
      subscriptionEndDate,
      receiptPrefix: receiptPrefix || 'RCP',
      logo: req.file ? `/uploads/${req.file.filename}` : null
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        businessName: user.businessName,
        phone: user.phone,
        subscriptionType: user.subscriptionType,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/users/:id', upload.single('logo'), async (req, res) => {
  try {
    const { name, nameAr, businessNameAr, businessAddress, phone, subscriptionType, isActive, receiptPrefix } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (name) user.name = name;
    if (nameAr) user.nameAr = nameAr;
    if (businessNameAr) user.businessNameAr = businessNameAr;
    if (businessAddress !== undefined) user.businessAddress = businessAddress;
    if (phone) user.phone = phone;
    if (receiptPrefix) user.receiptPrefix = receiptPrefix;
    if (isActive !== undefined) user.isActive = isActive;
    
    if (subscriptionType && subscriptionType !== user.subscriptionType) {
      user.subscriptionType = subscriptionType;
      user.subscriptionStartDate = new Date();
      user.subscriptionEndDate = calculateEndDate(subscriptionType);
      user.isActive = true;
    }
    
    if (req.file) {
      user.logo = `/uploads/${req.file.filename}`;
    }
    
    await user.save();
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await Worker.deleteMany({ userId: user._id });
    await Customer.deleteMany({ userId: user._id });
    await Stitching.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login as user
router.post('/users/:id/login-as', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const token = generateToken(user._id, 'user');
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        businessName: user.businessName,
        phone: user.phone,
        logo: user.logo,
        language: user.language,
        theme: user.theme,
        role: 'user',
        isAdminSession: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Renew subscription
router.post('/users/:id/renew', async (req, res) => {
  try {
    const { subscriptionType } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.subscriptionType = subscriptionType;
    user.subscriptionStartDate = new Date();
    user.subscriptionEndDate = calculateEndDate(subscriptionType);
    user.isActive = true;
    
    await user.save();
    
    res.json({ message: 'Subscription renewed successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
