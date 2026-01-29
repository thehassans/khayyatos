const express = require('express');
const router = express.Router();
const Laundry = require('../models/Laundry');
const { verifyToken, isUser } = require('../middleware/auth');

router.use(verifyToken, isUser);

router.get('/', async (req, res) => {
  try {
    const laundries = await Laundry.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ laundries });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const pricePerPiece = Number(req.body?.pricePerPiece);

    if (!name) {
      return res.status(400).json({ error: 'Laundry name is required' });
    }

    const laundry = new Laundry({
      userId: req.user._id,
      name,
      pricePerPiece: Number.isFinite(pricePerPiece) && pricePerPiece >= 0 ? pricePerPiece : 0,
      totalAssigned: 0
    });

    await laundry.save();
    res.status(201).json({ laundry });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const laundry = await Laundry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!laundry) return res.status(404).json({ error: 'Laundry not found' });

    if (typeof req.body?.name === 'string') {
      const n = req.body.name.trim();
      if (n) laundry.name = n;
    }

    if (req.body?.pricePerPiece !== undefined) {
      const p = Number(req.body.pricePerPiece);
      if (Number.isFinite(p) && p >= 0) laundry.pricePerPiece = p;
    }

    if (req.body?.totalAssigned !== undefined) {
      const a = Number(req.body.totalAssigned);
      if (Number.isFinite(a) && a >= 0) laundry.totalAssigned = a;
    }

    await laundry.save();
    res.json({ laundry });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/assign', async (req, res) => {
  try {
    const laundry = await Laundry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!laundry) return res.status(404).json({ error: 'Laundry not found' });

    const pieces = Number(req.body?.pieces);
    if (!Number.isFinite(pieces) || pieces <= 0) {
      return res.status(400).json({ error: 'Invalid pieces' });
    }

    laundry.totalAssigned = (Number(laundry.totalAssigned) || 0) + pieces;
    await laundry.save();

    res.json({ laundry });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const laundry = await Laundry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!laundry) return res.status(404).json({ error: 'Laundry not found' });
    res.json({ message: 'Laundry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
