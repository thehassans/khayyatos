const mongoose = require('mongoose');

const fabricSchema = new mongoose.Schema({
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
  madeIn: {
    type: String,
    default: '',
    trim: true
  },
  pricePerRoll: {
    type: Number,
    default: 0,
    min: 0
  },
  rollsInStock: {
    type: Number,
    default: 0,
    min: 0
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

fabricSchema.index({ userId: 1, createdAt: -1 });

fabricSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Fabric', fabricSchema);
