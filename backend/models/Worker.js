const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workerSchema = new mongoose.Schema({
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
  paymentType: {
    type: String,
    enum: ['per_stitching', 'salary'],
    default: 'per_stitching'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  completedStitchings: {
    type: Number,
    default: 0
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
    default: 'worker',
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

workerSchema.index({ userId: 1, phone: 1 }, { unique: true });

workerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

workerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.pendingAmount = this.totalEarnings - this.totalPaid;
  next();
});

workerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Worker', workerSchema);
