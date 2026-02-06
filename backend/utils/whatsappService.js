const axios = require('axios');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

const formatPhoneNumber = (phone) => {
  let formatted = phone.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '966' + formatted.slice(1);
  }
  if (!formatted.startsWith('966') && formatted.length === 9) {
    formatted = '966' + formatted;
  }
  return formatted;
};

const sendMessage = async (settings, phoneNumber, message) => {
  try {
    if (!settings || !settings.enabled) {
      return { success: false, error: 'WhatsApp not enabled' };
    }
    
    if (!settings.accessToken || !settings.phoneNumberId) {
      return { success: false, error: 'WhatsApp not configured. Please add your access token and phone number ID.' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${settings.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('WhatsApp message sent:', response.data);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    console.error('WhatsApp send error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
};

const sendTemplateMessage = async (settings, phoneNumber, templateName, languageCode = 'en', components = []) => {
  try {
    if (!settings || !settings.enabled || !settings.accessToken || !settings.phoneNumberId) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${settings.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    console.error('WhatsApp template error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
};

const verifyConnection = async (settings) => {
  try {
    if (!settings.accessToken || !settings.phoneNumberId) {
      return { success: false, error: 'Missing credentials' };
    }

    const response = await axios.get(
      `${WHATSAPP_API_URL}/${settings.phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${settings.accessToken}`
        }
      }
    );

    return { 
      success: true, 
      phoneNumber: response.data.display_phone_number,
      qualityRating: response.data.quality_rating,
      verifiedName: response.data.verified_name
    };
  } catch (error) {
    console.error('WhatsApp verify error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
};

const parseMessageTemplate = (template, data) => {
  return template
    .replace(/{businessName}/g, data.businessName || '')
    .replace(/{receiptNumber}/g, data.receiptNumber || '')
    .replace(/{customerName}/g, data.customerName || '')
    .replace(/{price}/g, data.price || '0')
    .replace(/{paidAmount}/g, data.paidAmount || '0')
    .replace(/{balance}/g, data.balance || '0')
    .replace(/{dueDate}/g, data.dueDate || '')
    .replace(/{status}/g, data.status || '');
};

const sendOrderNotification = async (user, customer, order) => {
  const settings = user.whatsappSettings;
  if (!settings?.enabled || !settings?.autoMessageOnOrder) {
    return { success: false, error: 'Auto-message on order disabled' };
  }

  const message = parseMessageTemplate(settings.orderMessageTemplate, {
    businessName: user.businessName,
    receiptNumber: order.receiptNumber,
    customerName: customer.name,
    price: order.price,
    paidAmount: order.paidAmount || 0,
    balance: (order.price || 0) - (order.paidAmount || 0),
    dueDate: order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'TBD'
  });

  return sendMessage(settings, customer.phone, message);
};

const sendReadyNotification = async (user, customer, order) => {
  const settings = user.whatsappSettings;
  if (!settings?.enabled || !settings?.autoMessageOnReady) {
    return { success: false, error: 'Auto-message on ready disabled' };
  }

  const message = parseMessageTemplate(settings.readyMessageTemplate, {
    businessName: user.businessName,
    receiptNumber: order.receiptNumber,
    customerName: customer.name
  });

  return sendMessage(settings, customer.phone, message);
};

const sendDeliveryNotification = async (user, customer, order) => {
  const settings = user.whatsappSettings;
  if (!settings?.enabled || !settings?.autoMessageOnDelivery) {
    return { success: false, error: 'Auto-message on delivery disabled' };
  }

  const message = parseMessageTemplate(settings.deliveryMessageTemplate, {
    businessName: user.businessName,
    receiptNumber: order.receiptNumber,
    customerName: customer.name
  });

  return sendMessage(settings, customer.phone, message);
};

const sendInvoiceNotification = async (user, customer, order) => {
  const settings = user.whatsappSettings;
  if (!settings?.enabled || !settings?.autoInvoice) {
    return { success: false, error: 'Auto-invoice disabled' };
  }
  if (!user.whatsappAddon?.activated) {
    return { success: false, error: 'WhatsApp addon not activated' };
  }

  const template = settings.invoiceMessageTemplate || '🧾 Invoice from {businessName}\n\nOrder: #{receiptNumber}\nCustomer: {customerName}\nTotal: {price} SAR\nPaid: {paidAmount} SAR\nBalance: {balance} SAR\nDue Date: {dueDate}\n\nThank you for your business!';
  const message = parseMessageTemplate(template, {
    businessName: user.businessName,
    receiptNumber: order.receiptNumber,
    customerName: customer.name,
    price: order.price || 0,
    paidAmount: order.paidAmount || 0,
    balance: (order.price || 0) - (order.paidAmount || 0),
    dueDate: order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'TBD'
  });

  return sendMessage(settings, customer.phone, message);
};

const sendStatusUpdateNotification = async (user, customer, order, newStatus) => {
  const settings = user.whatsappSettings;
  if (!settings?.enabled || !settings?.autoStatusUpdate) {
    return { success: false, error: 'Auto-status-update disabled' };
  }
  if (!user.whatsappAddon?.activated) {
    return { success: false, error: 'WhatsApp addon not activated' };
  }

  const statusLabels = {
    pending: 'Pending / قيد الانتظار',
    'in-progress': 'In Progress / قيد التنفيذ',
    completed: 'Completed / مكتمل',
    delivered: 'Delivered / تم التسليم',
    cancelled: 'Cancelled / ملغي'
  };

  const template = settings.statusUpdateMessageTemplate || '📋 Order Update from {businessName}\n\nYour order #{receiptNumber} status has been updated to: {status}\n\nWe will keep you informed of any further changes.';
  const message = parseMessageTemplate(template, {
    businessName: user.businessName,
    receiptNumber: order.receiptNumber,
    customerName: customer.name,
    status: statusLabels[newStatus] || newStatus,
    price: order.price || 0,
    paidAmount: order.paidAmount || 0,
    balance: (order.price || 0) - (order.paidAmount || 0),
    dueDate: order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'TBD'
  });

  return sendMessage(settings, customer.phone, message);
};

const sendDueReminderNotification = async (user, customer, order) => {
  const settings = user.whatsappSettings;
  if (!settings?.enabled || !settings?.autoDueReminder) {
    return { success: false, error: 'Auto-due-reminder disabled' };
  }
  if (!user.whatsappAddon?.activated) {
    return { success: false, error: 'WhatsApp addon not activated' };
  }

  const template = settings.dueReminderMessageTemplate || '⏰ Reminder from {businessName}\n\nYour order #{receiptNumber} is due on {dueDate}. Please visit us to collect your order.\n\nBalance remaining: {balance} SAR';
  const message = parseMessageTemplate(template, {
    businessName: user.businessName,
    receiptNumber: order.receiptNumber,
    customerName: customer.name,
    price: order.price || 0,
    paidAmount: order.paidAmount || 0,
    balance: (order.price || 0) - (order.paidAmount || 0),
    dueDate: order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'TBD'
  });

  return sendMessage(settings, customer.phone, message);
};

module.exports = {
  sendMessage,
  sendTemplateMessage,
  verifyConnection,
  parseMessageTemplate,
  sendOrderNotification,
  sendReadyNotification,
  sendDeliveryNotification,
  sendInvoiceNotification,
  sendStatusUpdateNotification,
  sendDueReminderNotification,
  formatPhoneNumber
};
