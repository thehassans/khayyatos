const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['salary', 'per_stitching', 'bonus', 'advance', 'deduction'],
    default: 'salary'
  },
  description: {
    type: String,
    default: ''
  },
  stitchingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stitching',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.index({ userId: 1, workerId: 1 });
paymentSchema.index({ workerId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
