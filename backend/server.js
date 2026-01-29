const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const workerRoutes = require('./routes/worker');
const customerRoutes = require('./routes/customer');
const stitchingRoutes = require('./routes/stitching');
const paymentRoutes = require('./routes/payment');
const settingsRoutes = require('./routes/settings');
const whatsappRoutes = require('./routes/whatsapp');

// ZATCA routes with error handling
let zatcaRoutes;
let zatcaLoadError = null;
try {
  zatcaRoutes = require('./routes/zatca');
  console.log('ZATCA routes loaded successfully');
} catch (err) {
  console.error('Failed to load ZATCA routes:', err.message);
  console.error('Stack:', err.stack);
  zatcaLoadError = { message: err.message, stack: err.stack };
  // Create fallback router
  zatcaRoutes = require('express').Router();
  zatcaRoutes.get('/debug', (req, res) => {
    res.json({ error: 'ZATCA routes failed to load', details: zatcaLoadError });
  });
  zatcaRoutes.all('*', (req, res) => {
    res.status(503).json({ error: 'ZATCA service unavailable', details: err.message });
  });
}

const { checkSubscriptions } = require('./utils/subscriptionChecker');
const { initializeAdmin } = require('./utils/initAdmin');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/stitchings', stitchingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/zatca', zatcaRoutes);

// Health check with MongoDB status
app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: states[mongoState] || 'unknown',
    mongoEnvSet: !!process.env.MONGODB_URI
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// MongoDB connection with proper options for cloud hosting
const mongoOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saas_tailor', mongoOptions)
  .then(async () => {
    console.log('MongoDB connected successfully');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set from env' : 'Using default localhost');
    await initializeAdmin();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('MONGODB_URI env exists:', !!process.env.MONGODB_URI);
  });

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting reconnect...');
});

// Check subscriptions daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running subscription check...');
  checkSubscriptions();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
