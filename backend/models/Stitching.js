const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  length: { type: Number, default: null },
  shoulderWidth: { type: Number, default: null },
  chest: { type: Number, default: null },
  sleeveLength: { type: Number, default: null },
  neck: { type: Number, default: null },
  wrist: { type: Number, default: null },
  expansion: { type: Number, default: null },
  armhole: { type: Number, default: null }
}, { _id: false });

const stitchingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    default: null
  },
  receiptNumber: {
    type: String,
    required: true
  },
  thawbType: {
    type: String,
    enum: ['saudi', 'qatari', 'emirati', 'kuwaiti', 'omani', 'bahraini', 'noum'],
    default: 'saudi'
  },
  fabricColor: {
    type: String,
    enum: ['white', 'cream', 'offwhite', 'beige', 'grey', 'black', 'navy', 'brown', null],
    default: null
  },
  measurements: {
    type: measurementSchema,
    default: () => ({})
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'delivered'],
    default: 'pending'
  },
  description: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  deliveredDate: {
    type: Date,
    default: null
  },
  workerPaid: {
    type: Boolean,
    default: false
  },
  zatcaStatus: {
    type: String,
    enum: ['PENDING', 'REPORTED', 'CLEARED', 'FAILED', null],
    default: null
  },
  zatcaResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  zatcaReportedAt: {
    type: Date,
    default: null
  },
  zatcaUUID: {
    type: String,
    default: null
  },
  zatcaInvoiceHash: {
    type: String,
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

stitchingSchema.index({ userId: 1, receiptNumber: 1 }, { unique: true });
stitchingSchema.index({ userId: 1, status: 1 });
stitchingSchema.index({ workerId: 1, status: 1 });

stitchingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Stitching', stitchingSchema);
