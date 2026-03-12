const mongoose = require('mongoose');

const i18nTextSchema = new mongoose.Schema({
  en: { type: String, default: '' },
  ar: { type: String, default: '' },
  ur: { type: String, default: '' },
  hi: { type: String, default: '' },
  bn: { type: String, default: '' }
}, { _id: false });

const catalogItemSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, default: '', trim: true },
  nameI18n: { type: i18nTextSchema, default: () => ({}) },
  enabled: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  image: { type: String, default: null },
  imageUpdatedAt: { type: Number, default: null }
}, { _id: false });

const styleOptionGroupSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, default: '', trim: true },
  nameI18n: { type: i18nTextSchema, default: () => ({}) },
  enabled: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  options: { type: [catalogItemSchema], default: () => [] }
}, { _id: false });

const systemSettingsSchema = new mongoose.Schema(
  {
    gemini: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, default: '' },
      model: { type: String, default: 'gemini-3-flash-preview' },
      updatedAt: { type: Date, default: Date.now }
    },
    measurementsCatalog: {
      fields: { type: [catalogItemSchema], default: () => [] }
    },
    styleOptionsCatalog: {
      groups: { type: [styleOptionGroupSchema], default: () => [] }
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
