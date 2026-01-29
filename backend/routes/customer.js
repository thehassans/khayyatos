const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Stitching = require('../models/Stitching');
const { verifyToken, isUser } = require('../middleware/auth');
const { blockDemoWrites } = require('../middleware/demoGuard');
const { translateMany, buildFallbackI18n } = require('../utils/geminiTranslate');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSaudiPhoneNeedles = (q) => {
  const raw = String(q || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return [];

  let d = digits;
  if (d.startsWith('966')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length > 9) d = d.slice(-9);
  if (d.length < 3) return [];

  const set = new Set([
    digits,
    d,
    `0${d}`,
    `966${d}`,
    `+966${d}`
  ]);
  return Array.from(set);
};

router.use(verifyToken, isUser);

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { userId: req.user._id };
    
    if (search) {
      const safe = escapeRegex(search);
      const needles = buildSaudiPhoneNeedles(search);
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe, $options: 'i' } },
        ...needles.map((n) => ({ phone: { $regex: escapeRegex(n), $options: 'i' } }))
      ];
    }
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Customer.countDocuments(query);
    
    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search customers
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json({ customers: [] });
    }
    
    const needles = buildSaudiPhoneNeedles(q);
    const safe = escapeRegex(q);
    const customers = await Customer.find({
      userId: req.user._id,
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe, $options: 'i' } },
        ...needles.map((n) => ({ phone: { $regex: escapeRegex(n), $options: 'i' } }))
      ]
    }).limit(10);
    
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer loyalty data
router.get('/loyalty', async (req, res) => {
  try {
    const { search, sortBy = 'totalSpent', order = 'desc' } = req.query;
    
    const query = { userId: req.user._id };
    if (search) {
      const safe = escapeRegex(search);
      const needles = buildSaudiPhoneNeedles(search);
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe, $options: 'i' } },
        ...needles.map((n) => ({ phone: { $regex: escapeRegex(n), $options: 'i' } }))
      ];
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const customers = await Customer.find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(100);
    
    const totalCustomers = await Customer.countDocuments({ userId: req.user._id });
    const totalSpent = await Customer.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: '$totalSpent' } } }
    ]);
    
    res.json({
      customers,
      stats: {
        totalCustomers,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single customer with history
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('relations.customerId', 'name phone nameI18n');
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const stitchings = await Stitching.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .populate('workerId', 'name phone nameI18n');
    
    res.json({ customer, stitchings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create customer
router.post('/', blockDemoWrites, async (req, res) => {
  try {
    const { name, phone, measurements, notes, relations } = req.body;
    
    let customer = await Customer.findOne({ userId: req.user._id, phone });
    
    if (customer) {
      if (name) {
        customer.name = name;
        if (typeof name === 'string' && name.trim()) {
          const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
          customer.nameI18n = translations.name || buildFallbackI18n(name.trim());
        }
      }
      if (measurements) {
        customer.measurements = { ...customer.measurements.toObject(), ...measurements };
      }
      if (notes) customer.notes = notes;
      if (Array.isArray(relations)) customer.relations = relations;
      await customer.save();
      return res.json({ message: 'Customer updated', customer, isExisting: true });
    }
    
    customer = new Customer({
      userId: req.user._id,
      name,
      phone,
      measurements: measurements || {},
      notes: notes || '',
      relations: Array.isArray(relations) ? relations : []
    });

    if (typeof name === 'string' && name.trim()) {
      const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
      customer.nameI18n = translations.name || buildFallbackI18n(name.trim());
    }
    
    await customer.save();
    
    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update customer
router.put('/:id', blockDemoWrites, async (req, res) => {
  try {
    const { name, phone, measurements, notes, relations } = req.body;
    
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    if (name) {
      customer.name = name;
      if (typeof name === 'string' && name.trim()) {
        const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
        customer.nameI18n = translations.name || buildFallbackI18n(name.trim());
      }
    }
    if (phone) customer.phone = phone;
    if (measurements) {
      customer.measurements = { ...customer.measurements.toObject(), ...measurements };
    }
    if (notes !== undefined) customer.notes = notes;
    if (Array.isArray(relations)) customer.relations = relations;
    
    await customer.save();
    
    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete customer
router.delete('/:id', blockDemoWrites, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    await Stitching.deleteMany({ customerId: customer._id });
    await Customer.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
