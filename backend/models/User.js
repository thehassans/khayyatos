const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameAr: {
    type: String,
    trim: true,
    default: ''
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessNameAr: {
    type: String,
    trim: true,
    default: ''
  },
  businessAddress: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  logo: {
    type: String,
    default: null
  },
  subscriptionType: {
    type: String,
    enum: ['trial', 'yearly', 'lifetime'],
    default: 'trial'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  receiptPrefix: {
    type: String,
    default: 'RCP'
  },
  receiptCounter: {
    type: Number,
    default: 1000
  },
  language: {
    type: String,
    enum: ['en', 'ar', 'hi', 'ur', 'bn'],
    default: 'en'
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  whatsappSettings: {
    enabled: { type: Boolean, default: false },
    accessToken: { type: String, default: '' },
    phoneNumberId: { type: String, default: '' },
    businessAccountId: { type: String, default: '' },
    autoMessageOnOrder: { type: Boolean, default: true },
    autoMessageOnReady: { type: Boolean, default: true },
    autoMessageOnDelivery: { type: Boolean, default: true },
    orderMessageTemplate: { type: String, default: 'Thank you for your order at {businessName}! Your order #{receiptNumber} has been received. Total: {price} SAR. Due date: {dueDate}. We will notify you when it is ready.' },
    readyMessageTemplate: { type: String, default: 'Good news! Your order #{receiptNumber} at {businessName} is ready for pickup. Please visit us at your earliest convenience.' },
    deliveryMessageTemplate: { type: String, default: 'Thank you for choosing {businessName}! Your order #{receiptNumber} has been delivered. We hope to serve you again soon!' }
  },
  zatcaSettings: {
    vatNumber: { type: String, default: '' },
    crn: { type: String, default: '' },
    street: { type: String, default: '' },
    buildingNumber: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    plotId: { type: String, default: '' },
    phase: { type: Number, default: 1 },
    environment: { type: String, enum: ['sandbox', 'simulation', 'production'], default: 'sandbox' },
    invoiceCounter: { type: Number, default: 0 },
    previousInvoiceHash: { type: String, default: null },
    csid: { type: String, default: null },
    csidSecret: { type: String, default: null },
    productionCsid: { type: String, default: null },
    productionCsidSecret: { type: String, default: null },
    onboardingStatus: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
    showOnInvoice: { type: Boolean, default: false },
    updatedAt: { type: Date, default: null }
  },
  role: {
    type: String,
    default: 'user',
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isSubscriptionActive = function() {
  if (this.subscriptionType === 'lifetime') return true;
  return new Date() < new Date(this.subscriptionEndDate);
};

userSchema.methods.generateReceiptNumber = function() {
  this.receiptCounter += 1;
  return `${this.receiptPrefix}-${this.receiptCounter}`;
};

module.exports = mongoose.model('User', userSchema);
