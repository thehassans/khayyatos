const mongoose = require('mongoose');

const i18nTextSchema = new mongoose.Schema({
  en: { type: String, default: '' },
  ar: { type: String, default: '' },
  ur: { type: String, default: '' },
  hi: { type: String, default: '' },
  bn: { type: String, default: '' }
}, { _id: false });

const measurementSchema = new mongoose.Schema({
  length: { type: Number, default: null },
  shoulderWidth: { type: Number, default: null },
  chest: { type: Number, default: null },
  waist: { type: Number, default: null },
  hips: { type: Number, default: null },
  sleeveLength: { type: Number, default: null },
  bicep: { type: Number, default: null },
  forearm: { type: Number, default: null },
  neck: { type: Number, default: null },
  wrist: { type: Number, default: null },
  cuffWidth: { type: Number, default: null },
  expansion: { type: Number, default: null },
  armhole: { type: Number, default: null },
  bottom: { type: Number, default: null }
}, { _id: false });

const customerSchema = new mongoose.Schema({
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
  measurements: {
    type: measurementSchema,
    default: () => ({})
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  relations: {
    type: [
      {
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        customerName: { type: String, default: '' },
        customerPhone: { type: String, default: '' },
        relationType: { type: String, default: '' }
      }
    ],
    default: () => []
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

customerSchema.index({ userId: 1, phone: 1 }, { unique: true });
customerSchema.index({ userId: 1, name: 'text' });

customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
