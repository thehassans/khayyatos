const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Stitching = require('../models/Stitching');

router.get('/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const stitching = isObjectId
      ? await Stitching.findById(id).populate('customerId', 'name')
      : await Stitching.findOne({ receiptNumber: id }).populate('customerId', 'name');
    if (!stitching) return res.status(404).json({ error: 'Order not found' });

    res.json({
      _id: stitching._id,
      receiptNumber: stitching.receiptNumber,
      customerName: stitching.customerId?.name || '',
      status: stitching.status,
      quantity: stitching.quantity,
      price: stitching.price,
      paidAmount: stitching.paidAmount,
      dueDate: stitching.dueDate
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
