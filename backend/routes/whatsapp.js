const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, isUser } = require('../middleware/auth');
const whatsappService = require('../utils/whatsappService');

router.use(verifyToken, isUser);

// Get WhatsApp settings
router.get('/settings', async (req, res) => {
  try {
    const settings = req.user.whatsappSettings || {};
    res.json({
      enabled: settings.enabled || false,
      phoneNumberId: settings.phoneNumberId || '',
      businessAccountId: settings.businessAccountId || '',
      hasAccessToken: !!settings.accessToken,
      autoMessageOnOrder: settings.autoMessageOnOrder !== false,
      autoMessageOnReady: settings.autoMessageOnReady !== false,
      autoMessageOnDelivery: settings.autoMessageOnDelivery !== false,
      orderMessageTemplate: settings.orderMessageTemplate || '',
      readyMessageTemplate: settings.readyMessageTemplate || '',
      deliveryMessageTemplate: settings.deliveryMessageTemplate || ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update WhatsApp settings
router.put('/settings', async (req, res) => {
  try {
    const { 
      enabled, accessToken, phoneNumberId, businessAccountId,
      autoMessageOnOrder, autoMessageOnReady, autoMessageOnDelivery,
      orderMessageTemplate, readyMessageTemplate, deliveryMessageTemplate
    } = req.body;

    if (!req.user.whatsappSettings) {
      req.user.whatsappSettings = {};
    }

    if (enabled !== undefined) req.user.whatsappSettings.enabled = enabled;
    if (accessToken) req.user.whatsappSettings.accessToken = accessToken;
    if (phoneNumberId) req.user.whatsappSettings.phoneNumberId = phoneNumberId;
    if (businessAccountId) req.user.whatsappSettings.businessAccountId = businessAccountId;
    if (autoMessageOnOrder !== undefined) req.user.whatsappSettings.autoMessageOnOrder = autoMessageOnOrder;
    if (autoMessageOnReady !== undefined) req.user.whatsappSettings.autoMessageOnReady = autoMessageOnReady;
    if (autoMessageOnDelivery !== undefined) req.user.whatsappSettings.autoMessageOnDelivery = autoMessageOnDelivery;
    if (orderMessageTemplate) req.user.whatsappSettings.orderMessageTemplate = orderMessageTemplate;
    if (readyMessageTemplate) req.user.whatsappSettings.readyMessageTemplate = readyMessageTemplate;
    if (deliveryMessageTemplate) req.user.whatsappSettings.deliveryMessageTemplate = deliveryMessageTemplate;

    await req.user.save();
    
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify WhatsApp connection
router.post('/verify', async (req, res) => {
  try {
    const settings = req.user.whatsappSettings;
    if (!settings?.accessToken || !settings?.phoneNumberId) {
      return res.status(400).json({ error: 'Please configure access token and phone number ID first' });
    }

    const result = await whatsappService.verifyConnection(settings);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send test message
router.post('/test', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const settings = req.user.whatsappSettings;
    const testMessage = `🎉 Test message from ${req.user.businessName}!\n\nYour WhatsApp integration is working correctly.\n\nتجربة الاتصال ناجحة!`;
    
    const result = await whatsappService.sendMessage(settings, phone, testMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send custom message
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    const result = await whatsappService.sendMessage(req.user.whatsappSettings, phone, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get message templates info
router.get('/templates', async (req, res) => {
  try {
    res.json({
      availableVariables: [
        '{businessName} - Your business name',
        '{receiptNumber} - Order receipt number',
        '{customerName} - Customer name',
        '{price} - Total price',
        '{paidAmount} - Amount paid',
        '{balance} - Remaining balance',
        '{dueDate} - Due date',
        '{status} - Order status'
      ],
      defaultTemplates: {
        order: 'Thank you for your order at {businessName}! Your order #{receiptNumber} has been received. Total: {price} SAR. Due date: {dueDate}. We will notify you when it is ready.',
        ready: 'Good news! Your order #{receiptNumber} at {businessName} is ready for pickup. Please visit us at your earliest convenience.',
        delivery: 'Thank you for choosing {businessName}! Your order #{receiptNumber} has been delivered. We hope to serve you again soon!'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
