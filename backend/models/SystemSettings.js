const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    gemini: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, default: '' },
      model: { type: String, default: 'gemini-3-flash-preview' },
      updatedAt: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
