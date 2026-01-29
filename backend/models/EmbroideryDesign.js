const mongoose = require('mongoose');

const i18nTextSchema = new mongoose.Schema({
  en: { type: String, default: '' },
  ar: { type: String, default: '' },
  ur: { type: String, default: '' },
  hi: { type: String, default: '' },
  bn: { type: String, default: '' }
}, { _id: false });

const embroideryDesignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameI18n: {
    type: i18nTextSchema,
    default: () => ({})
  },
  image: {
    type: String,
    default: null
  },
  imageUpdatedAt: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

embroideryDesignSchema.index({ userId: 1, createdAt: -1 });

embroideryDesignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmbroideryDesign', embroideryDesignSchema);
