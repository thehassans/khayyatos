const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const upload = require('./middleware/upload');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  }
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Unified login (without MongoDB)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Mock admin login
    if (identifier === 'admin@test.com' && password === 'Admin@123456') {
      return res.json({
        token: 'mock_jwt_token_admin',
        role: 'admin',
        user: {
          id: 'mock_admin_id',
          email: 'admin@test.com',
          name: 'Test Admin',
          role: 'admin'
        }
      });
    }
    
    // Check if user exists in mockUsers (created via admin panel)
    const user = mockUsers.find(u => u.phone === identifier);
    if (user && user.password === password) {
      return res.json({
        token: 'mock_jwt_token_user_' + user._id,
        role: 'user',
        user: {
          id: user._id,
          name: user.name,
          businessName: user.businessName,
          phone: user.phone,
          logo: user.logo || null,
          language: user.language || 'en',
          theme: user.theme || 'light',
          role: 'user'
        }
      });
    }
    
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Mock data store
let mockUsers = [
  {
    _id: '1',
    name: 'Test User 1',
    businessName: 'Test Shop 1',
    phone: '+1234567890',
    subscriptionType: 'trial',
    subscriptionEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date()
  },
  {
    _id: '2',
    name: 'Test User 2',
    businessName: 'Test Shop 2',
    phone: '+0987654321',
    subscriptionType: 'yearly',
    subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date()
  }
];

// Mock admin dashboard
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    stats: {
      totalUsers: mockUsers.length,
      activeUsers: mockUsers.filter(u => u.isActive).length,
      trialUsers: mockUsers.filter(u => u.subscriptionType === 'trial').length,
      yearlyUsers: mockUsers.filter(u => u.subscriptionType === 'yearly').length,
      lifetimeUsers: mockUsers.filter(u => u.subscriptionType === 'lifetime').length
    },
    recentUsers: mockUsers.slice(0, 5),
    expiringUsers: []
  });
});

// Get all users
app.get('/api/admin/users', (req, res) => {
  res.json(mockUsers);
});

// Get single user
app.get('/api/admin/users/:id', (req, res) => {
  const user = mockUsers.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// Create user
app.post('/api/admin/users', upload.single('logo'), (req, res) => {
  const { name, businessName, phone, password, subscriptionType } = req.body;
  const newUser = {
    _id: String(Date.now()),
    name,
    businessName,
    phone,
    password, // Store password for login
    subscriptionType: subscriptionType || 'trial',
    subscriptionEndDate: new Date(Date.now() + (subscriptionType === 'lifetime' ? 36500 : subscriptionType === 'yearly' ? 365 : 7) * 24 * 60 * 60 * 1000),
    isActive: true,
    logo: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: new Date()
  };
  mockUsers.push(newUser);
  // Don't send password back
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    message: 'User created successfully',
    user: userWithoutPassword
  });
});

// Update user
app.put('/api/admin/users/:id', upload.single('logo'), (req, res) => {
  const index = mockUsers.findIndex(u => u._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const updatedUser = { ...mockUsers[index] };
  if (req.body.name !== undefined) updatedUser.name = req.body.name;
  if (req.body.businessName !== undefined) updatedUser.businessName = req.body.businessName;
  if (req.body.phone !== undefined) updatedUser.phone = req.body.phone;
  if (req.body.password !== undefined && req.body.password !== '') updatedUser.password = req.body.password;
  if (req.body.subscriptionType !== undefined) {
    updatedUser.subscriptionType = req.body.subscriptionType;
    updatedUser.subscriptionEndDate = new Date(Date.now() + (req.body.subscriptionType === 'lifetime' ? 36500 : req.body.subscriptionType === 'yearly' ? 365 : 7) * 24 * 60 * 60 * 1000);
  }
  if (req.body.isActive !== undefined) {
    updatedUser.isActive = req.body.isActive === true || req.body.isActive === 'true';
  }
  if (req.file) {
    updatedUser.logo = `/uploads/${req.file.filename}`;
  }

  mockUsers[index] = updatedUser;
  const { password: _, ...userWithoutPassword } = mockUsers[index];
  res.json({ message: 'User updated successfully', user: userWithoutPassword });
});

// Delete user
app.delete('/api/admin/users/:id', (req, res) => {
  const index = mockUsers.findIndex(u => u._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  mockUsers.splice(index, 1);
  res.json({ message: 'User deleted' });
});

// Mock workers data
let mockWorkers = [];

// Get workers for user
app.get('/api/worker', (req, res) => {
  res.json(mockWorkers);
});

// Create worker
app.post('/api/worker', (req, res) => {
  const newWorker = {
    _id: String(Date.now()),
    ...req.body,
    isActive: true,
    createdAt: new Date()
  };
  mockWorkers.push(newWorker);
  res.status(201).json(newWorker);
});

// Delete worker
app.delete('/api/worker/:id', (req, res) => {
  const index = mockWorkers.findIndex(w => w._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Worker not found' });
  mockWorkers.splice(index, 1);
  res.json({ message: 'Worker deleted' });
});

// Mock stitchings data
let mockStitchings = [];

// Get stitchings
app.get('/api/stitchings', (req, res) => {
  res.json(mockStitchings);
});

// Create stitching
app.post('/api/stitchings', (req, res) => {
  const receiptNumber = `KO-${Date.now().toString().slice(-6)}`;
  const stitching = {
    _id: String(Date.now()),
    receiptNumber,
    ...req.body,
    status: req.body.status || 'pending',
    createdAt: new Date()
  };
  mockStitchings.push(stitching);
  res.status(201).json(stitching);
});

// Get single stitching
app.get('/api/stitchings/:id', (req, res) => {
  const stitching = mockStitchings.find(s => s._id === req.params.id);
  if (!stitching) return res.status(404).json({ error: 'Order not found' });
  res.json(stitching);
});

// Update stitching
app.put('/api/stitchings/:id', (req, res) => {
  const index = mockStitchings.findIndex(s => s._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  mockStitchings[index] = { ...mockStitchings[index], ...req.body };
  res.json(mockStitchings[index]);
});

// Delete stitching
app.delete('/api/stitchings/:id', (req, res) => {
  const index = mockStitchings.findIndex(s => s._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  mockStitchings.splice(index, 1);
  res.json({ message: 'Order deleted' });
});

// Assign worker to stitching
app.put('/api/stitchings/:id/assign', (req, res) => {
  const index = mockStitchings.findIndex(s => s._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  const { workerId } = req.body;
  const worker = mockWorkers.find(w => w._id === workerId);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  mockStitchings[index] = { 
    ...mockStitchings[index], 
    workerId: { _id: worker._id, name: worker.name, phone: worker.phone },
    status: 'assigned'
  };
  res.json(mockStitchings[index]);
});

// Public track order endpoint
app.get('/api/track/:id', (req, res) => {
  const stitching = mockStitchings.find(s => s._id === req.params.id || s.receiptNumber === req.params.id);
  if (!stitching) return res.status(404).json({ error: 'Order not found' });
  res.json({
    _id: stitching._id,
    receiptNumber: stitching.receiptNumber,
    customerName: stitching.customerName,
    status: stitching.status,
    quantity: stitching.quantity,
    price: stitching.price,
    paidAmount: stitching.paidAmount,
    dueDate: stitching.dueDate
  });
});

// Mock customers data
let mockCustomers = [];

// Get customers (with aggregated stats from stitchings)
app.get('/api/customers', (req, res) => {
  // Aggregate totalOrders and totalSpent from stitchings
  const customersWithStats = mockCustomers.map(customer => {
    const customerStitchings = mockStitchings.filter(s => s.customerId === customer._id);
    return {
      ...customer,
      totalOrders: customerStitchings.length,
      totalSpent: customerStitchings.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
    };
  });
  res.json(customersWithStats);
});

// Customer loyalty - MUST be before :id route
app.get('/api/customers/loyalty', (req, res) => {
  // Calculate stats from stitchings for each customer
  const customersWithStats = mockCustomers.map(customer => {
    const customerStitchings = mockStitchings.filter(s => s.customerId === customer._id);
    return {
      ...customer,
      totalOrders: customerStitchings.length,
      totalSpent: customerStitchings.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
    };
  });
  
  res.json({
    customers: customersWithStats.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)),
    stats: {
      totalCustomers: customersWithStats.length,
      totalSpent: customersWithStats.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
    }
  });
});

// Get single customer
app.get('/api/customers/:id', (req, res) => {
  const customer = mockCustomers.find(c => c._id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// Create customer
app.post('/api/customers', (req, res) => {
  const customer = {
    _id: String(Date.now()),
    ...req.body,
    totalOrders: 0,
    totalSpent: 0,
    loyaltyPoints: 0,
    createdAt: new Date()
  };
  mockCustomers.push(customer);
  res.status(201).json(customer);
});

// Update customer
app.put('/api/customers/:id', (req, res) => {
  const index = mockCustomers.findIndex(c => c._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found' });
  mockCustomers[index] = { ...mockCustomers[index], ...req.body };
  res.json(mockCustomers[index]);
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
  const index = mockCustomers.findIndex(c => c._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found' });
  mockCustomers.splice(index, 1);
  res.json({ message: 'Customer deleted' });
});

// WhatsApp status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ connected: false, message: 'Use WhatsApp Web or API' });
});

// WhatsApp send (opens WhatsApp URL)
app.post('/api/whatsapp/send', (req, res) => {
  const { phone, message } = req.body;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  res.json({ success: true, url: whatsappUrl });
});

// User dashboard
app.get('/api/user/dashboard', (req, res) => {
  res.json({
    stats: {
      workerCount: mockWorkers.length,
      customerCount: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0
    },
    recentStitchings: []
  });
});

// User profile
app.get('/api/user/profile', (req, res) => {
  res.json({
    name: 'Test User',
    businessName: 'Test Shop',
    phone: '+966501234567',
    language: 'en'
  });
});

// Settings storage
let mockSettings = {
  language: 'en',
  theme: 'light',
  receiptPrefix: 'RCP',
  receiptCounter: 0,
  businessName: 'Test Shop 2',
  logo: null,
  hiddenNavItems: []
};

// Get settings
app.get('/api/settings', (req, res) => {
  res.json({ settings: mockSettings });
});

// Update settings
app.put('/api/settings', upload.single('logo'), (req, res) => {
  const next = { ...mockSettings, ...req.body };
  if (req.file) {
    next.logo = `/uploads/${req.file.filename}`;
  }
  mockSettings = next;
  res.json({ settings: mockSettings });
});

// Update receipt settings
app.put('/api/settings/receipt', (req, res) => {
  mockSettings.receiptPrefix = req.body.receiptPrefix || mockSettings.receiptPrefix;
  mockSettings.receiptCounter = req.body.receiptCounter || mockSettings.receiptCounter;
  res.json({ settings: mockSettings });
});

// Payment endpoints
let mockPayments = [];

app.get('/api/payments/summary', (req, res) => {
  res.json(mockWorkers.map(w => {
    // Calculate earnings from assigned stitchings
    const workerStitchings = mockStitchings.filter(s => s.workerId && s.workerId._id === w._id);
    const totalEarnings = workerStitchings.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    
    // Calculate total paid from payments
    const workerPayments = mockPayments.filter(p => p.workerId === w._id);
    const totalPaid = workerPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    return {
      ...w,
      totalEarnings,
      totalPaid,
      pendingAmount: totalEarnings - totalPaid
    };
  }));
});

app.get('/api/payments', (req, res) => {
  res.json(mockPayments);
});

app.post('/api/payments', (req, res) => {
  const payment = {
    _id: String(Date.now()),
    ...req.body,
    createdAt: new Date()
  };
  mockPayments.push(payment);
  res.status(201).json(payment);
});

// Login as user (from admin panel)
app.post('/api/admin/users/:id/login-as', (req, res) => {
  const user = mockUsers.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  res.json({
    token: 'mock_jwt_token_user_' + user._id,
    user: {
      id: user._id,
      name: user.name,
      businessName: user.businessName,
      phone: user.phone,
      logo: user.logo || null,
      language: user.language || 'en',
      theme: user.theme || 'light',
      role: 'user'
    }
  });
});

// Token verify
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === 'mock_jwt_token_admin') {
    return res.json({ user: { id: 'mock_admin_id', email: 'admin@test.com', name: 'Test Admin', role: 'admin' } });
  }
  // Check for dynamic user tokens
  if (token && token.startsWith('mock_jwt_token_user_')) {
    const userId = token.replace('mock_jwt_token_user_', '');
    const user = mockUsers.find(u => u._id === userId);
    if (user) {
      return res.json({ 
        user: { 
          id: user._id, 
          name: user.name, 
          businessName: user.businessName, 
          phone: user.phone, 
          logo: user.logo || null,
          language: user.language || 'en',
          theme: user.theme || 'light',
          role: 'user' 
        } 
      });
    }
  }
  res.status(401).json({ error: 'Invalid token' });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test admin credentials:`);
  console.log(`Email: admin@test.com`);
  console.log(`Password: Admin@123456`);
});
