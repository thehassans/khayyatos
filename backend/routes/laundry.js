const express = require('express');
const router = express.Router();
const Laundry = require('../models/Laundry');
const LaundryPayment = require('../models/LaundryPayment');
const { verifyToken, isUser } = require('../middleware/auth');
const { blockDemoWrites } = require('../middleware/demoGuard');

router.use(verifyToken, isUser);

router.get('/', async (req, res) => {
  try {
    const laundries = await Laundry.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ laundries });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', blockDemoWrites, async (req, res) => {
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

router.put('/:id', blockDemoWrites, async (req, res) => {
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

router.get('/:id/payments', async (req, res) => {
  try {
    const laundry = await Laundry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!laundry) return res.status(404).json({ error: 'Laundry not found' });

    const payments = await LaundryPayment.find({ userId: req.user._id, laundryId: laundry._id })
      .sort({ createdAt: -1 })
      .limit(200);

    const totalAssigned = Number(laundry.totalAssigned) || 0;
    const pricePerPiece = Number(laundry.pricePerPiece) || 0;
    const totalAmount = totalAssigned * pricePerPiece;
    const totalPaid = Number(laundry.totalPaid) || 0;
    const pendingAmount = Math.max(0, totalAmount - totalPaid);

    res.json({
      laundry,
      payments,
      summary: {
        totalAssigned,
        pricePerPiece,
        totalAmount,
        totalPaid,
        pendingAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/payments', blockDemoWrites, async (req, res) => {
  try {
    const laundry = await Laundry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!laundry) return res.status(404).json({ error: 'Laundry not found' });

    const amount = Number(req.body?.amount);
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const totalAssigned = Number(laundry.totalAssigned) || 0;
    const pricePerPiece = Number(laundry.pricePerPiece) || 0;
    const totalAmount = totalAssigned * pricePerPiece;
    const totalPaidBefore = Number(laundry.totalPaid) || 0;
    const pendingBefore = totalAmount - totalPaidBefore;

    if (amount - pendingBefore > 0.000001) {
      return res.status(400).json({ error: 'Amount exceeds pending balance' });
    }

    const payment = new LaundryPayment({
      userId: req.user._id,
      laundryId: laundry._id,
      amount,
      description
    });

    await payment.save();

    laundry.totalPaid = totalPaidBefore + amount;
    await laundry.save();

    const totalPaid = Number(laundry.totalPaid) || 0;
    const pendingAmount = Math.max(0, totalAmount - totalPaid);

    res.status(201).json({
      message: 'Payment saved successfully',
      laundry,
      payment,
      summary: {
        totalAssigned,
        pricePerPiece,
        totalAmount,
        totalPaid,
        pendingAmount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/assign', blockDemoWrites, async (req, res) => {
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

router.delete('/:id', blockDemoWrites, async (req, res) => {
  try {
    const laundry = await Laundry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!laundry) return res.status(404).json({ error: 'Laundry not found' });
    await LaundryPayment.deleteMany({ userId: req.user._id, laundryId: req.params.id });
    res.json({ message: 'Laundry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
