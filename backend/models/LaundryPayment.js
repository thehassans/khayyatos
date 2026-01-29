const mongoose = require('mongoose');

const laundryPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  laundryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laundry',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

laundryPaymentSchema.index({ userId: 1, laundryId: 1, createdAt: -1 });

module.exports = mongoose.model('LaundryPayment', laundryPaymentSchema);
