const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const Stitching = require('../models/Stitching');
const Customer = require('../models/Customer');
const { verifyToken, isUser } = require('../middleware/auth');
const whatsappService = require('../utils/whatsappService');

router.use(verifyToken, isUser);

// Get WhatsApp addon status + pricing
router.get('/addon-status', async (req, res) => {
  try {
    const addon = req.user.whatsappAddon || {};
    const doc = await SystemSettings.findOne({});
    const pricing = doc?.addons?.whatsapp || {};
    res.json({
      activated: addon.activated || false,
      activatedAt: addon.activatedAt || null,
      activatedBy: addon.activatedBy || null,
      pricing: {
        price: pricing.price || 0,
        currency: pricing.currency || 'SAR',
        billingCycle: pricing.billingCycle || 'monthly',
        description: pricing.description || ''
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

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
      autoInvoice: settings.autoInvoice || false,
      autoStatusUpdate: settings.autoStatusUpdate || false,
      autoDueReminder: settings.autoDueReminder || false,
      orderMessageTemplate: settings.orderMessageTemplate || '',
      readyMessageTemplate: settings.readyMessageTemplate || '',
      deliveryMessageTemplate: settings.deliveryMessageTemplate || '',
      invoiceMessageTemplate: settings.invoiceMessageTemplate || '',
      statusUpdateMessageTemplate: settings.statusUpdateMessageTemplate || '',
      dueReminderMessageTemplate: settings.dueReminderMessageTemplate || ''
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
      autoInvoice, autoStatusUpdate, autoDueReminder,
      orderMessageTemplate, readyMessageTemplate, deliveryMessageTemplate,
      invoiceMessageTemplate, statusUpdateMessageTemplate, dueReminderMessageTemplate
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
    if (autoInvoice !== undefined) req.user.whatsappSettings.autoInvoice = autoInvoice;
    if (autoStatusUpdate !== undefined) req.user.whatsappSettings.autoStatusUpdate = autoStatusUpdate;
    if (autoDueReminder !== undefined) req.user.whatsappSettings.autoDueReminder = autoDueReminder;
    if (orderMessageTemplate) req.user.whatsappSettings.orderMessageTemplate = orderMessageTemplate;
    if (readyMessageTemplate) req.user.whatsappSettings.readyMessageTemplate = readyMessageTemplate;
    if (deliveryMessageTemplate) req.user.whatsappSettings.deliveryMessageTemplate = deliveryMessageTemplate;
    if (invoiceMessageTemplate) req.user.whatsappSettings.invoiceMessageTemplate = invoiceMessageTemplate;
    if (statusUpdateMessageTemplate) req.user.whatsappSettings.statusUpdateMessageTemplate = statusUpdateMessageTemplate;
    if (dueReminderMessageTemplate) req.user.whatsappSettings.dueReminderMessageTemplate = dueReminderMessageTemplate;

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

// Trigger due-date reminders for orders due within next 24h
router.post('/send-due-reminders', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.whatsappSettings?.enabled || !user?.whatsappSettings?.autoDueReminder || !user?.whatsappAddon?.activated) {
      return res.json({ success: false, sent: 0, error: 'Due reminders not enabled or addon not activated' });
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const orders = await Stitching.find({
      userId: req.user._id,
      status: { $in: ['pending', 'in-progress', 'completed'] },
      dueDate: { $gte: now, $lte: tomorrow }
    }).populate('customerId', 'name phone nameI18n');

    let sent = 0;
    for (const order of orders) {
      const customer = order.customerId;
      if (!customer?.phone) continue;
      try {
        const result = await whatsappService.sendDueReminderNotification(user, customer, order);
        if (result.success) sent++;
      } catch (e) { console.error('Due reminder error:', e); }
    }

    res.json({ success: true, sent, total: orders.length });
  } catch (error) {
    console.error('Due reminder route error:', error);
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
        delivery: 'Thank you for choosing {businessName}! Your order #{receiptNumber} has been delivered. We hope to serve you again soon!',
        invoice: '🧾 Invoice from {businessName}\n\nOrder: #{receiptNumber}\nCustomer: {customerName}\nTotal: {price} SAR\nPaid: {paidAmount} SAR\nBalance: {balance} SAR\nDue Date: {dueDate}\n\nThank you for your business!',
        statusUpdate: '📋 Order Update from {businessName}\n\nYour order #{receiptNumber} status has been updated to: {status}\n\nWe will keep you informed of any further changes.',
        dueReminder: '⏰ Reminder from {businessName}\n\nYour order #{receiptNumber} is due on {dueDate}. Please visit us to collect your order.\n\nBalance remaining: {balance} SAR'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
