const mongoose = require('mongoose');

const finisherAssignmentSchema = new mongoose.Schema({
  finisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Finisher',
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinisherShop',
    required: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  pieces: {
    type: Number,
    required: true,
    min: 1
  },
  ratePerPiece: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  amountReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed'],
    default: 'assigned'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
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

finisherAssignmentSchema.index({ finisherId: 1, shopId: 1, createdAt: -1 });
finisherAssignmentSchema.index({ finisherId: 1, status: 1 });

finisherAssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  const pieces = Number(this.pieces) || 0;
  const ratePerPiece = Number(this.ratePerPiece) || 0;
  this.totalAmount = Math.max(0, pieces * ratePerPiece);
  const received = Number(this.amountReceived) || 0;
  this.amountReceived = Math.min(this.totalAmount, Math.max(0, received));
  this.pendingAmount = Math.max(0, this.totalAmount - this.amountReceived);
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  if (this.status !== 'completed') {
    this.completedAt = null;
  }
  next();
});

module.exports = mongoose.model('FinisherAssignment', finisherAssignmentSchema);
