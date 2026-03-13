const express = require('express');
const router = express.Router();
const Finisher = require('../models/Finisher');
const FinisherShop = require('../models/FinisherShop');
const FinisherAssignment = require('../models/FinisherAssignment');
const { verifyToken, isFinisher } = require('../middleware/auth');
const { blockDemoWrites } = require('../middleware/demoGuard');
const { translateMany, buildFallbackI18n } = require('../utils/geminiTranslate');

const summarizeAssignments = (assignments) => {
  return (assignments || []).reduce((acc, item) => {
    acc.totalPieces += Number(item?.pieces) || 0;
    acc.totalAmount += Number(item?.totalAmount) || 0;
    acc.amountReceived += Number(item?.amountReceived) || 0;
    acc.pendingAmount += Number(item?.pendingAmount) || 0;
    if (item?.status === 'completed') acc.completedAssignments += 1;
    if (item?.status === 'assigned' || item?.status === 'in_progress') acc.activeAssignments += 1;
    return acc;
  }, {
    totalPieces: 0,
    totalAmount: 0,
    amountReceived: 0,
    pendingAmount: 0,
    completedAssignments: 0,
    activeAssignments: 0
  });
};

const buildFinisherAuthUser = (finisher) => ({
  id: finisher._id,
  userId: finisher.userId,
  name: finisher.name,
  phone: finisher.phone,
  language: finisher.language,
  role: 'finisher'
});

const ensureShopOwnership = async ({ userId, finisherId, shopId }) => {
  return await FinisherShop.findOne({ _id: shopId, userId, finisherId });
};

router.get('/panel/dashboard', verifyToken, isFinisher, async (req, res) => {
  try {
    const finisherId = req.finisher._id;
    const userId = req.finisher.userId;

    const [shops, assignments] = await Promise.all([
      FinisherShop.find({ userId, finisherId }).sort({ createdAt: -1 }).lean(),
      FinisherAssignment.find({ userId, finisherId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('shopId', 'shopName ownerName phone perPieceFinishing')
        .lean()
    ]);

    res.json({
      finisher: buildFinisherAuthUser(req.finisher),
      stats: {
        totalShops: shops.length,
        ...summarizeAssignments(assignments)
      },
      recentAssignments: assignments,
      shops
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/panel/shops', verifyToken, isFinisher, async (req, res) => {
  try {
    const shops = await FinisherShop.find({ userId: req.finisher.userId, finisherId: req.finisher._id })
      .sort({ createdAt: -1 })
      .lean();

    const assignments = await FinisherAssignment.find({ userId: req.finisher.userId, finisherId: req.finisher._id }).lean();
    const assignmentMap = assignments.reduce((acc, item) => {
      const key = String(item.shopId);
      if (!acc.has(key)) acc.set(key, []);
      acc.get(key).push(item);
      return acc;
    }, new Map());

    res.json({
      shops: shops.map((shop) => ({
        ...shop,
        stats: summarizeAssignments(assignmentMap.get(String(shop._id)) || [])
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/panel/shops', verifyToken, isFinisher, blockDemoWrites, async (req, res) => {
  try {
    const { shopName, ownerName, phone, perPieceFinishing, isActive } = req.body || {};
    if (!shopName) {
      return res.status(400).json({ error: 'Shop name is required' });
    }

    const shop = new FinisherShop({
      userId: req.finisher.userId,
      finisherId: req.finisher._id,
      shopName,
      ownerName: ownerName || '',
      phone: phone || '',
      perPieceFinishing: Number(perPieceFinishing) || 0,
      isActive: isActive !== false
    });

    await shop.save();
    res.status(201).json({ message: 'Shop created successfully', shop });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Shop with this phone already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/panel/shops/:shopId', verifyToken, isFinisher, blockDemoWrites, async (req, res) => {
  try {
    const shop = await ensureShopOwnership({ userId: req.finisher.userId, finisherId: req.finisher._id, shopId: req.params.shopId });
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { shopName, ownerName, phone, perPieceFinishing, isActive } = req.body || {};
    if (shopName !== undefined) shop.shopName = shopName;
    if (ownerName !== undefined) shop.ownerName = ownerName;
    if (phone !== undefined) shop.phone = phone;
    if (perPieceFinishing !== undefined) shop.perPieceFinishing = Number(perPieceFinishing) || 0;
    if (isActive !== undefined) shop.isActive = !!isActive;

    await shop.save();
    res.json({ message: 'Shop updated successfully', shop });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Shop with this phone already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/panel/assignments', verifyToken, isFinisher, async (req, res) => {
  try {
    const { shopId, status } = req.query || {};
    const query = { userId: req.finisher.userId, finisherId: req.finisher._id };
    if (shopId) query.shopId = shopId;
    if (status) query.status = status;

    const assignments = await FinisherAssignment.find(query)
      .sort({ createdAt: -1 })
      .populate('shopId', 'shopName ownerName phone perPieceFinishing')
      .lean();

    res.json({ assignments, stats: summarizeAssignments(assignments) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/panel/assignments', verifyToken, isFinisher, blockDemoWrites, async (req, res) => {
  try {
    const { shopId, description, pieces, ratePerPiece, amountReceived, status } = req.body || {};
    if (!shopId || !pieces) {
      return res.status(400).json({ error: 'shopId and pieces are required' });
    }

    const shop = await ensureShopOwnership({ userId: req.finisher.userId, finisherId: req.finisher._id, shopId });
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const assignment = new FinisherAssignment({
      userId: req.finisher.userId,
      finisherId: req.finisher._id,
      shopId: shop._id,
      description: description || '',
      pieces: Number(pieces) || 0,
      ratePerPiece: ratePerPiece !== undefined ? Number(ratePerPiece) || 0 : Number(shop.perPieceFinishing) || 0,
      amountReceived: Number(amountReceived) || 0,
      status: status || 'assigned'
    });

    await assignment.save();
    await assignment.populate('shopId', 'shopName ownerName phone perPieceFinishing');
    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/panel/assignments/:id', verifyToken, isFinisher, blockDemoWrites, async (req, res) => {
  try {
    const assignment = await FinisherAssignment.findOne({
      _id: req.params.id,
      userId: req.finisher.userId,
      finisherId: req.finisher._id
    });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const { shopId, description, pieces, ratePerPiece, amountReceived, status } = req.body || {};
    if (shopId && String(shopId) !== String(assignment.shopId)) {
      const shop = await ensureShopOwnership({ userId: req.finisher.userId, finisherId: req.finisher._id, shopId });
      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
      assignment.shopId = shop._id;
    }
    if (description !== undefined) assignment.description = description;
    if (pieces !== undefined) assignment.pieces = Number(pieces) || 0;
    if (ratePerPiece !== undefined) assignment.ratePerPiece = Number(ratePerPiece) || 0;
    if (amountReceived !== undefined) assignment.amountReceived = Number(amountReceived) || 0;
    if (status) assignment.status = status;

    await assignment.save();
    await assignment.populate('shopId', 'shopName ownerName phone perPieceFinishing');
    res.json({ message: 'Assignment updated successfully', assignment });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/panel/settings', verifyToken, isFinisher, async (req, res) => {
  try {
    const { language } = req.body || {};
    if (language) req.finisher.language = language;
    await req.finisher.save();
    res.json({ user: buildFinisherAuthUser(req.finisher) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
