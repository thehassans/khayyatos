const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Stitching = require('../models/Stitching');
const { verifyToken, isUser } = require('../middleware/auth');
const { blockDemoWrites } = require('../middleware/demoGuard');
const { translateMany, buildFallbackI18n } = require('../utils/geminiTranslate');
const { mergeMeasurementValues, normalizeMeasurementValues } = require('../utils/measurements');
const { buildSaudiPhoneNeedles, normalizeSaudiPhone } = require('../utils/saudi');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const INVERSE_RELATION_TYPES = {
  father: 'son',
  son: 'father',
  brother: 'brother',
  cousin: 'cousin',
  friend: 'friend'
};

const relationRefId = (rel) => {
  const ref = rel?.customerId;
  return (ref && typeof ref === 'object') ? ref._id : ref;
};

const buildInverseMap = (relations) => {
  const map = new Map();
  (Array.isArray(relations) ? relations : []).forEach((r) => {
    const refId = relationRefId(r);
    const relType = r?.relationType;
    const inverseType = INVERSE_RELATION_TYPES[relType];
    if (!inverseType || !refId) return;
    map.set(String(refId), inverseType);
  });
  return map;
};

const ensureInverseRelation = async ({ userId, sourceCustomer, targetCustomerId, inverseType }) => {
  if (!userId || !sourceCustomer?._id || !targetCustomerId || !inverseType) return;
  const sourceIdStr = String(sourceCustomer._id);
  const targetIdStr = String(targetCustomerId);
  if (!targetIdStr || targetIdStr === sourceIdStr) return;

  const target = await Customer.findOne({ _id: targetCustomerId, userId });
  if (!target) return;
  const existing = Array.isArray(target.relations) ? target.relations : [];
  const beforeSonIds = inverseType === 'son' ? collectSonIds(existing) : [];

  const next = existing.filter((r) => String(relationRefId(r)) !== sourceIdStr);
  next.push({
    customerId: sourceCustomer._id,
    customerName: sourceCustomer.name || '',
    customerPhone: sourceCustomer.phone || '',
    relationType: inverseType
  });

  const changed = next.length !== existing.length || existing.some((r) => {
    if (String(relationRefId(r)) !== sourceIdStr) return false;
    return r?.relationType !== inverseType;
  });

  if (changed) {
    target.relations = next;
    await target.save();
    if (inverseType === 'son') {
      await syncBrotherRelationsAmongSons({
        userId,
        beforeSonIds,
        afterSonIds: collectSonIds(next)
      });
    }
  }
};

const removeInverseRelation = async ({ userId, sourceCustomerId, targetCustomerId, inverseType }) => {
  if (!userId || !sourceCustomerId || !targetCustomerId || !inverseType) return;
  const sourceIdStr = String(sourceCustomerId);
  const target = await Customer.findOne({ _id: targetCustomerId, userId });
  if (!target) return;

  const existing = Array.isArray(target.relations) ? target.relations : [];
  const beforeSonIds = inverseType === 'son' ? collectSonIds(existing) : [];
  const next = existing.filter((r) => {
    const rid = String(relationRefId(r));
    if (rid !== sourceIdStr) return true;
    return r?.relationType !== inverseType;
  });

  if (next.length !== existing.length) {
    target.relations = next;
    await target.save();
    if (inverseType === 'son') {
      await syncBrotherRelationsAmongSons({
        userId,
        beforeSonIds,
        afterSonIds: collectSonIds(next)
      });
    }
  }
};

const syncReverseRelations = async ({ userId, customer, oldRelations }) => {
  const before = buildInverseMap(oldRelations);
  const after = buildInverseMap(customer?.relations);
  const customerId = customer?._id;

  for (const [refIdStr, inverseType] of after.entries()) {
    await ensureInverseRelation({
      userId,
      sourceCustomer: customer,
      targetCustomerId: refIdStr,
      inverseType
    });
  }

  for (const [refIdStr, inverseType] of before.entries()) {
    if (after.has(refIdStr)) continue;
    await removeInverseRelation({
      userId,
      sourceCustomerId: customerId,
      targetCustomerId: refIdStr,
      inverseType
    });
  }
};

const collectSonIds = (relations) => {
  const out = new Set();
  (Array.isArray(relations) ? relations : []).forEach((r) => {
    if (r?.relationType !== 'son') return;
    const id = relationRefId(r);
    if (!id) return;
    out.add(String(id));
  });
  return Array.from(out);
};

const syncBrotherRelationsAmongSons = async ({ userId, beforeSonIds, afterSonIds }) => {
  const before = new Set((beforeSonIds || []).map((x) => String(x)));
  const after = new Set((afterSonIds || []).map((x) => String(x)));
  const union = new Set([...before, ...after]);
  if (!userId || union.size === 0) return;

  const allIds = Array.from(union);
  const lookup = await Customer.find({ userId, _id: { $in: allIds } }).select('name phone nameI18n relations');
  const byId = new Map(lookup.map((c) => [String(c._id), c]));

  for (const childId of allIds) {
    const child = byId.get(String(childId));
    if (!child) continue;

    const shouldHave = after.has(String(childId))
      ? Array.from(after).filter((x) => String(x) !== String(childId))
      : [];
    const shouldHaveSet = new Set(shouldHave.map(String));

    const existing = Array.isArray(child.relations) ? child.relations : [];
    const next = [];
    const seenBrother = new Set();
    let changed = false;

    existing.forEach((rel) => {
      const ridRaw = relationRefId(rel);
      if (!ridRaw) {
        next.push(rel);
        return;
      }
      const rid = String(ridRaw);

      if (rel?.relationType === 'brother' && union.has(rid)) {
        seenBrother.add(rid);
        if (!shouldHaveSet.has(rid)) {
          changed = true;
          return;
        }
      }

      next.push(rel);
    });

    shouldHave.forEach((broId) => {
      const idStr = String(broId);
      if (seenBrother.has(idStr)) return;
      const bro = byId.get(idStr);
      if (!bro) return;
      next.push({
        customerId: bro._id,
        customerName: bro.name || '',
        customerPhone: bro.phone || '',
        relationType: 'brother'
      });
      changed = true;
    });

    if (changed) {
      child.relations = next;
      await child.save();
    }
  }
};

router.use(verifyToken, isUser);

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 20));
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
    
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      Customer.countDocuments(query)
    ]);
    
    res.json({
      customers,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
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
    const normalizedMeasurements = normalizeMeasurementValues(measurements);
    const normalizedPhone = normalizeSaudiPhone(phone);
    
    let customer = await Customer.findOne({ userId: req.user._id, phone: normalizedPhone });
    const oldRelations = customer ? (Array.isArray(customer.relations) ? customer.relations.slice() : []) : [];
    
    if (customer) {
      if (name) {
        customer.name = name;
        if (typeof name === 'string' && name.trim()) {
          const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
          customer.nameI18n = translations.name || buildFallbackI18n(name.trim());
        }
      }
      if (measurements && typeof measurements === 'object' && !Array.isArray(measurements)) {
        customer.measurements = mergeMeasurementValues(customer.measurements, normalizedMeasurements);
      }
      if (notes) customer.notes = notes;
      if (Array.isArray(relations)) customer.relations = relations;
      await customer.save();

      await syncReverseRelations({ userId: req.user._id, customer, oldRelations });
      await syncBrotherRelationsAmongSons({
        userId: req.user._id,
        beforeSonIds: collectSonIds(oldRelations),
        afterSonIds: collectSonIds(customer.relations)
      });
      return res.json({ message: 'Customer updated', customer, isExisting: true });
    }
    
    customer = new Customer({
      userId: req.user._id,
      name,
      phone: normalizedPhone,
      measurements: normalizedMeasurements,
      notes: notes || '',
      relations: Array.isArray(relations) ? relations : []
    });

    if (typeof name === 'string' && name.trim()) {
      const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
      customer.nameI18n = translations.name || buildFallbackI18n(name.trim());
    }
    
    await customer.save();

    await syncReverseRelations({ userId: req.user._id, customer, oldRelations: [] });
    await syncBrotherRelationsAmongSons({
      userId: req.user._id,
      beforeSonIds: [],
      afterSonIds: collectSonIds(customer.relations)
    });
    
    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update customer
router.put('/:id', blockDemoWrites, async (req, res) => {
  try {
    const { name, phone, measurements, notes, relations } = req.body;
    const normalizedMeasurements = normalizeMeasurementValues(measurements);
    const normalizedPhone = phone ? normalizeSaudiPhone(phone) : '';
    
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    const oldRelations = Array.isArray(customer?.relations) ? customer.relations.slice() : [];
    
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
    if (phone) customer.phone = normalizedPhone;
    if (measurements && typeof measurements === 'object' && !Array.isArray(measurements)) {
      customer.measurements = mergeMeasurementValues(customer.measurements, normalizedMeasurements);
    }
    if (notes !== undefined) customer.notes = notes;
    if (Array.isArray(relations)) customer.relations = relations;
    
    await customer.save();

    await syncReverseRelations({ userId: req.user._id, customer, oldRelations });
    await syncBrotherRelationsAmongSons({
      userId: req.user._id,
      beforeSonIds: collectSonIds(oldRelations),
      afterSonIds: collectSonIds(customer.relations)
    });
    
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
    await Customer.updateMany(
      { userId: req.user._id },
      { $pull: { relations: { customerId: customer._id } } }
    );
    await Customer.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
