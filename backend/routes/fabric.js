const express = require('express');
const router = express.Router();
const Fabric = require('../models/Fabric');
const Stitching = require('../models/Stitching');
const { verifyToken, isUser } = require('../middleware/auth');
const { blockDemoWrites } = require('../middleware/demoGuard');

router.use(verifyToken, isUser);

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

router.get('/', async (req, res) => {
  try {
    const fabrics = await Fabric.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ fabrics });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', blockDemoWrites, async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const madeIn = typeof req.body?.madeIn === 'string' ? req.body.madeIn.trim() : '';
    const pricePerRoll = safeNumber(req.body?.pricePerRoll);
    const rollsInStock = safeNumber(req.body?.rollsInStock);

    if (!name) {
      return res.status(400).json({ error: 'Fabric name is required' });
    }

    const fabric = new Fabric({
      userId: req.user._id,
      name,
      madeIn,
      pricePerRoll: (pricePerRoll != null && pricePerRoll >= 0) ? pricePerRoll : 0,
      rollsInStock: (rollsInStock != null && rollsInStock >= 0) ? rollsInStock : 0
    });

    await fabric.save();
    res.status(201).json({ fabric });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', blockDemoWrites, async (req, res) => {
  try {
    const fabric = await Fabric.findOne({ _id: req.params.id, userId: req.user._id });
    if (!fabric) return res.status(404).json({ error: 'Fabric not found' });

    if (typeof req.body?.name === 'string') {
      const n = req.body.name.trim();
      if (n) fabric.name = n;
    }

    if (typeof req.body?.madeIn === 'string') {
      fabric.madeIn = req.body.madeIn.trim();
    }

    if (req.body?.pricePerRoll !== undefined) {
      const p = safeNumber(req.body.pricePerRoll);
      if (p != null && p >= 0) fabric.pricePerRoll = p;
    }

    if (req.body?.rollsInStock !== undefined) {
      const r = safeNumber(req.body.rollsInStock);
      if (r != null && r >= 0) fabric.rollsInStock = r;
    }

    await fabric.save();
    res.json({ fabric });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/stock', blockDemoWrites, async (req, res) => {
  try {
    const delta = safeNumber(req.body?.delta);
    if (delta == null || delta === 0) {
      return res.status(400).json({ error: 'Invalid stock change' });
    }

    if (delta > 0) {
      const updated = await Fabric.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $inc: { rollsInStock: delta } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Fabric not found' });
      return res.json({ fabric: updated });
    }

    const need = Math.abs(delta);
    const updated = await Fabric.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, rollsInStock: { $gte: need } },
      { $inc: { rollsInStock: -need } },
      { new: true }
    );

    if (!updated) {
      const exists = await Fabric.findOne({ _id: req.params.id, userId: req.user._id }).select('_id');
      if (!exists) return res.status(404).json({ error: 'Fabric not found' });
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    res.json({ fabric: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', blockDemoWrites, async (req, res) => {
  try {
    const inUse = await Stitching.findOne({ userId: req.user._id, fabricId: req.params.id }).select('_id').lean();
    if (inUse) {
      return res.status(400).json({ error: 'Fabric is used by orders' });
    }

    const deleted = await Fabric.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Fabric not found' });

    res.json({ message: 'Fabric deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
