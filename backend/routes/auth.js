const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Worker = require('../models/Worker');
const { generateToken, verifyToken } = require('../middleware/auth');

// Unified login - auto-detect user type
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Phone and password required' });
    }

    // Check if identifier is email (admin) or phone (user/worker)
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      // Try admin login
      const admin = await Admin.findOne({ email: identifier.toLowerCase() });
      if (admin) {
        const isMatch = await admin.comparePassword(password);
        if (isMatch) {
          const token = generateToken(admin._id, 'admin');
          return res.json({
            token,
            role: 'admin',
            user: {
              id: admin._id,
              email: admin.email,
              name: admin.name,
              role: 'admin'
            }
          });
        }
      }
    } else {
      // Try user login first
      const user = await User.findOne({ phone: identifier });
      if (user) {
        const isMatch = await user.comparePassword(password);
        if (isMatch) {
          if (!user.isActive) {
            return res.status(403).json({ error: 'Account is inactive' });
          }
          if (!user.isSubscriptionActive()) {
            return res.status(403).json({ error: 'Subscription expired' });
          }
          const token = generateToken(user._id, 'user');
          return res.json({
            token,
            role: 'user',
            user: {
              id: user._id,
              name: user.name,
              businessName: user.businessName,
              phone: user.phone,
              logo: user.logo,
              language: user.language,
              theme: user.theme,
              subscriptionType: user.subscriptionType,
              role: 'user'
            }
          });
        }
      }
      
      // Try worker login
      const worker = await Worker.findOne({ phone: identifier }).populate('userId');
      if (worker) {
        const isMatch = await worker.comparePassword(password);
        if (isMatch) {
          if (!worker.isActive) {
            return res.status(403).json({ error: 'Account is inactive' });
          }
          if (!worker.userId.isSubscriptionActive()) {
            return res.status(403).json({ error: 'Shop subscription expired' });
          }
          const token = generateToken(worker._id, 'worker');
          return res.json({
            token,
            role: 'worker',
            user: {
              id: worker._id,
              name: worker.name,
              phone: worker.phone,
              language: worker.language,
              shopName: worker.userId.businessName,
              role: 'worker'
            }
          });
        }
      }
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(admin._id, 'admin');
    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
router.post('/user/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    if (!user.isSubscriptionActive()) {
      return res.status(403).json({ error: 'Subscription expired. Please contact admin.' });
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
        subscriptionType: user.subscriptionType,
        subscriptionEndDate: user.subscriptionEndDate,
        role: 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Worker login
router.post('/worker/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const worker = await Worker.findOne({ phone }).populate('userId');
    if (!worker) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await worker.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!worker.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    if (!worker.userId.isSubscriptionActive()) {
      return res.status(403).json({ error: 'Shop subscription expired' });
    }
    
    const token = generateToken(worker._id, 'worker');
    res.json({
      token,
      user: {
        id: worker._id,
        name: worker.name,
        phone: worker.phone,
        language: worker.language,
        shopName: worker.userId.businessName,
        role: 'worker'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    let user;
    if (req.userRole === 'admin') {
      user = await Admin.findById(req.userId).select('-password');
    } else if (req.userRole === 'user') {
      user = await User.findById(req.userId).select('-password');
    } else if (req.userRole === 'worker') {
      user = await Worker.findById(req.userId).select('-password').populate('userId', 'businessName');
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: { ...user.toObject(), role: req.userRole } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
