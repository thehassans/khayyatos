const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const i18nTextSchema = new mongoose.Schema({
  en: { type: String, default: '' },
  ar: { type: String, default: '' },
  ur: { type: String, default: '' },
  hi: { type: String, default: '' },
  bn: { type: String, default: '' }
}, { _id: false });

const finisherSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 4
  },
  language: {
    type: String,
    enum: ['en', 'ar', 'hi', 'ur', 'bn'],
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    default: 'finisher',
    immutable: true
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

finisherSchema.index({ userId: 1, phone: 1 }, { unique: true });

finisherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

finisherSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

finisherSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Finisher', finisherSchema);
