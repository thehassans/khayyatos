const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Worker = require('../models/Worker');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    const admin = await Admin.findById(req.userId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

const isUser = async (req, res, next) => {
  try {
    if (req.userRole !== 'user' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    
    let user;
    if (req.userRole === 'admin' && req.headers['x-login-as-user']) {
      user = await User.findById(req.headers['x-login-as-user']);
    } else {
      user = await User.findById(req.userId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive.' });
    }
    
    if (!user.isSubscriptionActive()) {
      return res.status(403).json({ error: 'Subscription expired. Please renew.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

const isWorker = async (req, res, next) => {
  try {
    if (req.userRole !== 'worker') {
      return res.status(403).json({ error: 'Access denied. Worker only.' });
    }
    
    const worker = await Worker.findById(req.userId).populate('userId');
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found.' });
    }
    
    if (!worker.isActive) {
      return res.status(403).json({ error: 'Account is inactive.' });
    }
    
    if (!worker.userId.isSubscriptionActive()) {
      return res.status(403).json({ error: 'Shop subscription expired.' });
    }
    
    req.worker = worker;
    req.user = worker.userId;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

const isUserOrWorker = async (req, res, next) => {
  try {
    if (req.userRole === 'user' || req.userRole === 'admin') {
      return isUser(req, res, next);
    } else if (req.userRole === 'worker') {
      return isWorker(req, res, next);
    }
    return res.status(403).json({ error: 'Access denied.' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  isAdmin,
  isUser,
  isWorker,
  isUserOrWorker
};
