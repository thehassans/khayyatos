const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    gemini: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, default: '' },
      model: { type: String, default: 'gemini-3-flash-preview' },
      updatedAt: { type: Date, default: Date.now }
    },
    styleOptionImages: [
      {
        groupKey: { type: String, required: true },
        optionKey: { type: String, required: true },
        image: { type: String, default: null },
        imageUpdatedAt: { type: Number, default: null }
      }
    ],
    addons: {
      whatsapp: {
        price: { type: Number, default: 0 },
        currency: { type: String, default: 'SAR' },
        billingCycle: { type: String, enum: ['monthly', 'yearly', 'one-time'], default: 'monthly' },
        description: { type: String, default: 'WhatsApp Cloud API integration with auto-messaging, auto-invoicing, and status notifications.' }
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
