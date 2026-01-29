const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Customer = require('../models/Customer');
const Stitching = require('../models/Stitching');
const Payment = require('../models/Payment');
const { verifyToken, isUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verifyToken, isUser);

// Get settings
router.get('/', async (req, res) => {
  try {
    res.json({
      settings: {
        businessName: req.user.businessName,
        logo: req.user.logo,
        language: req.user.language,
        theme: req.user.theme,
        receiptPrefix: req.user.receiptPrefix,
        receiptCounter: req.user.receiptCounter,
        whatsappEnabled: req.user.whatsappEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.put('/', upload.single('logo'), async (req, res) => {
  try {
    const { language, receiptPrefix, businessName, theme } = req.body;
    
    if (language) req.user.language = language;
    if (receiptPrefix) req.user.receiptPrefix = receiptPrefix;
    if (businessName) req.user.businessName = businessName;
    if (theme) req.user.theme = theme;
    if (req.file) req.user.logo = `/uploads/${req.file.filename}`;
    
    await req.user.save();
    
    res.json({ 
      message: 'Settings updated successfully',
      settings: {
        businessName: req.user.businessName,
        logo: req.user.logo,
        language: req.user.language,
        theme: req.user.theme,
        receiptPrefix: req.user.receiptPrefix,
        receiptCounter: req.user.receiptCounter,
        whatsappEnabled: req.user.whatsappEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update receipt settings
router.put('/receipt', async (req, res) => {
  try {
    const { receiptPrefix, receiptCounter } = req.body;
    
    if (receiptPrefix) req.user.receiptPrefix = receiptPrefix;
    if (receiptCounter) req.user.receiptCounter = receiptCounter;
    
    await req.user.save();
    
    res.json({ 
      message: 'Receipt settings updated',
      receiptPrefix: req.user.receiptPrefix,
      receiptCounter: req.user.receiptCounter
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Export user data
router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [workers, customers, stitchings, payments] = await Promise.all([
      Worker.find({ userId }).lean(),
      Customer.find({ userId }).lean(),
      Stitching.find({ userId }).lean(),
      Payment.find({ userId }).lean()
    ]);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      businessName: req.user.businessName,
      data: {
        workers,
        customers,
        stitchings,
        payments
      },
      stats: {
        totalWorkers: workers.length,
        totalCustomers: customers.length,
        totalStitchings: stitchings.length,
        totalPayments: payments.length
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
