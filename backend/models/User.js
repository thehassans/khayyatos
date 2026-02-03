const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const i18nTextSchema = new mongoose.Schema({
  en: { type: String, default: '' },
  ar: { type: String, default: '' },
  ur: { type: String, default: '' },
  hi: { type: String, default: '' },
  bn: { type: String, default: '' }
}, { _id: false });

const styleOptionItemSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, default: '', trim: true },
  nameI18n: { type: i18nTextSchema, default: () => ({}) },
  image: { type: String, default: null },
  imageUpdatedAt: { type: Number, default: null },
  enabled: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { _id: false });

const styleOptionGroupSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, default: '', trim: true },
  nameI18n: { type: i18nTextSchema, default: () => ({}) },
  enabled: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  options: { type: [styleOptionItemSchema], default: () => [] }
}, { _id: false });

const styleOptionsCatalogSchema = new mongoose.Schema({
  groups: { type: [styleOptionGroupSchema], default: () => [] }
}, { _id: false });

const catalogImageItemSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, default: '', trim: true },
  nameI18n: { type: i18nTextSchema, default: () => ({}) },
  enabled: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  image: { type: String, default: null },
  imageUpdatedAt: { type: Number, default: null }
}, { _id: false });

const measurementsCatalogSchema = new mongoose.Schema({
  fields: { type: [catalogImageItemSchema], default: () => [] }
}, { _id: false });

const thawbTypesCatalogSchema = new mongoose.Schema({
  types: { type: [catalogImageItemSchema], default: () => [] }
}, { _id: false });

const fabricColorItemSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, default: '', trim: true },
  nameI18n: { type: i18nTextSchema, default: () => ({}) },
  enabled: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  hex: { type: String, default: '' }
}, { _id: false });

const fabricColorsCatalogSchema = new mongoose.Schema({
  colors: { type: [fabricColorItemSchema], default: () => [] }
}, { _id: false });

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
  nameI18n: {
    type: i18nTextSchema,
    default: () => ({})
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
  businessNameI18n: {
    type: i18nTextSchema,
    default: () => ({})
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
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingStep: {
    type: Number,
    default: 0
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  styleOptionsCatalog: {
    type: styleOptionsCatalogSchema,
    default: () => ({ groups: [] })
  },
  measurementsCatalog: {
    type: measurementsCatalogSchema,
    default: () => ({ fields: [] })
  },
  thawbTypesCatalog: {
    type: thawbTypesCatalogSchema,
    default: () => ({ types: [] })
  },
  fabricColorsCatalog: {
    type: fabricColorsCatalogSchema,
    default: () => ({ colors: [] })
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
  const rawShop = typeof this.businessName === 'string' ? this.businessName : '';
  const shop = rawShop.trim().replace(/\s+/g, '-');
  const safeShop = shop.replace(/[^\p{L}\p{N}-]/gu, '').slice(0, 24);

  const finalPrefix = safeShop || 'SHOP';
  this.receiptCounter += 1;
  return `${finalPrefix}-${this.receiptCounter}`;
};

module.exports = mongoose.model('User', userSchema);
