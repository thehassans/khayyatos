const mongoose = require('mongoose');

const finisherShopSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  finisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Finisher',
    required: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  perPieceFinishing: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

finisherShopSchema.index({ userId: 1, finisherId: 1, phone: 1 }, { unique: true, sparse: true });

finisherShopSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FinisherShop', finisherShopSchema);
