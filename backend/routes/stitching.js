const express = require('express');
const fs = require('fs');
const path = require('path');
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}
const router = express.Router();
const Stitching = require('../models/Stitching');
const Customer = require('../models/Customer');
const Worker = require('../models/Worker');
const User = require('../models/User');
const EmbroideryDesign = require('../models/EmbroideryDesign');
const Fabric = require('../models/Fabric');
const { verifyToken, isUser } = require('../middleware/auth');
const { blockDemoWrites } = require('../middleware/demoGuard');
const upload = require('../middleware/upload');
const whatsappService = require('../utils/whatsappService');
const { mergeMeasurementValues, normalizeMeasurementValues } = require('../utils/measurements');
const { translateMany, buildFallbackI18n } = require('../utils/geminiTranslate');
const { canonicalSaudiMobile, buildSaudiPhoneNeedles, normalizeSaudiPhone } = require('../utils/saudi');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const uploadsBaseDir = path.join(__dirname, '..', 'uploads');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const safeUnlink = (absPath) => {
  try {
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch (e) {

  }
};

const moveFile = (from, to) => {
  try {
    fs.renameSync(from, to);
  } catch (e) {
    try {
      fs.copyFileSync(from, to);
      safeUnlink(from);
    } catch (err) {
      throw err;
    }
  }
};

const isWebpUpload = (file) => {
  const mime = (file?.mimetype || '').toLowerCase();
  const ext = path.extname(file?.originalname || '').toLowerCase();
  return mime === 'image/webp' || ext === '.webp';
};

const removeUploadedAssetByUrl = (urlPath) => {
  if (typeof urlPath !== 'string' || !urlPath.startsWith('/uploads/')) return;
  const rel = urlPath.replace(/^\/uploads\//, '');
  const abs = path.join(uploadsBaseDir, rel);
  safeUnlink(abs);
};

const parseObjectField = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return {};
  const trimmed = value.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    return {};
  }
};

const parseBooleanField = (value) => value === true || value === 'true' || value === 1 || value === '1';

const persistMeasurementImage = async ({ userId, stitchingId, file }) => {
  if (!file || !userId || !stitchingId) return null;

  const relPath = path.join('measurement-images', String(userId));
  const dirPath = path.join(uploadsBaseDir, relPath);
  ensureDir(dirPath);

  const fileName = `${String(stitchingId)}.webp`;
  const absTarget = path.join(dirPath, fileName);

  if (sharp) {
    await sharp(file.path)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(absTarget);

    safeUnlink(file.path);
  } else {
    if (!isWebpUpload(file)) {
      safeUnlink(file.path);
      const error = new Error('Image processing is not available on this server');
      error.statusCode = 500;
      throw error;
    }
    moveFile(file.path, absTarget);
  }

  return {
    measurementImage: `/uploads/${path.join(relPath, fileName).replace(/\\/g, '/')}`,
    measurementImageUpdatedAt: Date.now()
  };
};

const computeReceiptPrefixFromBusinessName = (businessName) => {
  const rawShop = typeof businessName === 'string' ? businessName : '';
  const shop = rawShop.trim().replace(/\s+/g, '-');
  const safeShop = shop.replace(/[^\p{L}\p{N}-]/gu, '').slice(0, 24);
  return safeShop || 'SHOP';
};

const syncManualReceiptCounter = async (user, receiptNumber) => {
  if (!user || !receiptNumber) return;
  const prefix = computeReceiptPrefixFromBusinessName(user.businessName);
  const pattern = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`, 'u');
  const match = String(receiptNumber).trim().match(pattern);
  if (!match) return;
  const manualCounter = Number(match[1]);
  if (!Number.isFinite(manualCounter)) return;
  if (manualCounter <= (Number(user.receiptCounter) || 0)) return;
  user.receiptCounter = manualCounter;
  await user.save();
};

const normalizeOldInvoiceNumber = (value) => normalizeText(value);

const findMatchingCustomerIds = async ({ userId, search }) => {
  const rawSearch = String(search || '').trim();
  if (!rawSearch) return [];

  const safe = escapeRegex(rawSearch);
  const needles = buildSaudiPhoneNeedles(rawSearch);
  const customers = await Customer.find({
    userId,
    $or: [
      { name: { $regex: safe, $options: 'i' } },
      { phone: { $regex: safe, $options: 'i' } },
      { 'nameI18n.en': { $regex: safe, $options: 'i' } },
      { 'nameI18n.ar': { $regex: safe, $options: 'i' } },
      ...needles.map((needle) => ({ phone: { $regex: escapeRegex(needle), $options: 'i' } }))
    ]
  }).select('_id').limit(100).lean();

  return customers.map((customer) => customer._id);
};

const resolveOrderCustomer = async ({
  userId,
  customerId,
  customerName,
  customerPhone,
  normalizedMeasurements,
  hasMeasurementsPayload
}) => {
  if (customerId) {
    const customer = await Customer.findOne({
      _id: customerId,
      userId
    });
    if (!customer) {
      const error = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }
    return { customer, createdCustomer: false };
  }

  const normalizedName = normalizeText(customerName);
  const normalizedPhone = normalizeSaudiPhone(customerPhone);

  if (!normalizedName || !normalizedPhone) {
    const error = new Error('Customer name and phone are required');
    error.statusCode = 400;
    throw error;
  }

  let customer = await Customer.findOne({ userId, phone: normalizedPhone });
  if (customer) {
    let shouldSave = false;

    if (normalizedName && normalizedName !== customer.name) {
      customer.name = normalizedName;
      const translations = await translateMany({ entries: [{ id: 'name', text: normalizedName }] });
      customer.nameI18n = translations.name || buildFallbackI18n(normalizedName);
      shouldSave = true;
    }

    if (hasMeasurementsPayload && Object.keys(normalizedMeasurements || {}).length) {
      customer.measurements = mergeMeasurementValues(customer.measurements, normalizedMeasurements);
      shouldSave = true;
    }

    if (shouldSave) await customer.save();
    return { customer, createdCustomer: false };
  }

  customer = new Customer({
    userId,
    name: normalizedName,
    phone: normalizedPhone,
    measurements: normalizedMeasurements,
    notes: '',
    relations: []
  });

  if (normalizedName) {
    const translations = await translateMany({ entries: [{ id: 'name', text: normalizedName }] });
    customer.nameI18n = translations.name || buildFallbackI18n(normalizedName);
  }

  await customer.save();
  return { customer, createdCustomer: true };
};

router.use(verifyToken, isUser);

// Get all stitchings
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, workerId } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 20));
    const query = { userId: req.user._id };
    
    if (status) query.status = status;
    if (workerId) query.workerId = workerId;
    if (search) {
      const rawSearch = String(search || '').trim();
      const customerIds = await findMatchingCustomerIds({ userId: req.user._id, search: rawSearch });
      const searchConditions = [
        { receiptNumber: { $regex: escapeRegex(rawSearch), $options: 'i' } },
        { oldInvoiceNumber: { $regex: escapeRegex(rawSearch), $options: 'i' } }
      ];
      if (customerIds.length) {
        searchConditions.push({ customerId: { $in: customerIds } });
      }
      query.$or = searchConditions;
    }
    
    const [stitchings, total] = await Promise.all([
      Stitching.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .populate('customerId', 'name phone nameI18n')
        .populate('relationId', 'name phone nameI18n')
        .populate('workerId', 'name phone nameI18n')
        .populate('fabricId', 'name madeIn pricePerRoll rollsInStock')
        .lean(),
      Stitching.countDocuments(query)
    ]);
    
    res.json({
      stitchings,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search by receipt number
router.get('/search', async (req, res) => {
  try {
    const { receipt, phone, q } = req.query;
    const query = { userId: req.user._id };
    const genericSearch = String(q || receipt || phone || '').trim();
    const explicitPhone = String(phone || '').trim();
    const customerIds = await findMatchingCustomerIds({
      userId: req.user._id,
      search: explicitPhone || genericSearch
    });
    const searchConditions = [];

    if (genericSearch) {
      searchConditions.push({ receiptNumber: { $regex: escapeRegex(genericSearch), $options: 'i' } });
      searchConditions.push({ oldInvoiceNumber: { $regex: escapeRegex(genericSearch), $options: 'i' } });
    }
    if (customerIds.length) {
      searchConditions.push({ customerId: { $in: customerIds } });
    }
    if (!searchConditions.length) {
      return res.json({ stitchings: [] });
    }
    query.$or = searchConditions;
    
    let stitchings = await Stitching.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('customerId', 'name phone nameI18n')
      .populate('relationId', 'name phone nameI18n')
      .populate('workerId', 'name phone nameI18n');

    if (explicitPhone) {
      const p = canonicalSaudiMobile(explicitPhone);
      if (p) {
        stitchings = stitchings.filter((s) => canonicalSaudiMobile(s.customerId?.phone) === p);
      }
    }
    
    res.json({ stitchings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single stitching
router.get('/:id', async (req, res) => {
  try {
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })
      .populate('customerId')
      .populate('relationId', 'name phone nameI18n')
      .populate('workerId', 'name phone')
      .populate('fabricId', 'name madeIn pricePerRoll rollsInStock');
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }
    
    res.json({ stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create stitching order
router.post('/', blockDemoWrites, upload.single('measurementImage'), async (req, res) => {
  try {
    const parsedMeasurements = parseObjectField(req.body?.measurements);
    const parsedStyleOptions = parseObjectField(req.body?.styleOptions);
    const { 
      customerId, 
      customerName,
      customerPhone,
      relationId,
      relationName,
      relationType,
      orderFor,
      embroideryDesignId,
      quantity, 
      price, 
      paidAmount,
      description, 
      notes,
      dueDate,
      receiptNumber,
      oldInvoiceNumber,
      thawbType,
      fabricColor,
      fabricId,
      customFabricName,
      rollsUsed
    } = req.body;
    const hasMeasurementsPayload = req.body?.measurements !== undefined;
    const normalizedMeasurements = normalizeMeasurementValues(parsedMeasurements);

    const { customer } = await resolveOrderCustomer({
      userId: req.user._id,
      customerId,
      customerName,
      customerPhone,
      normalizedMeasurements,
      hasMeasurementsPayload
    });

    let relationToSave = null;
    if (relationId) {
      const relExists = await Customer.findOne({ _id: relationId, userId: req.user._id }).select('_id name phone nameI18n measurements');
      if (!relExists) return res.status(400).json({ error: 'Invalid relation customer' });
      relationToSave = relExists;
    }
    
    const user = await User.findById(req.user._id);
    let finalReceiptNumber = receiptNumber;
    if (!finalReceiptNumber) {
      finalReceiptNumber = user.generateReceiptNumber();
      await user.save();
    } else {
      await syncManualReceiptCounter(user, finalReceiptNumber);
    }

    let designIdToSave = null;
    let designSnapshot = {};
    if (embroideryDesignId) {
      const design = await EmbroideryDesign.findOne({ _id: embroideryDesignId, userId: req.user._id });
      if (!design) {
        return res.status(400).json({ error: 'Invalid embroidery design' });
      }
      designIdToSave = design._id;
      designSnapshot = {
        name: design.name || '',
        image: design.image || null,
        imageUpdatedAt: design.imageUpdatedAt || null
      };
    }

    const rollsUsedNum = Number(rollsUsed);
    if (rollsUsed !== undefined && (!Number.isFinite(rollsUsedNum) || rollsUsedNum < 0)) {
      return res.status(400).json({ error: 'Invalid rolls used' });
    }
    const rollsToUse = Number.isFinite(rollsUsedNum) ? rollsUsedNum : 0;
    const fabricToUse = fabricId ? String(fabricId) : null;
    const customFabricToUse = normalizeText(customFabricName);

    if (fabricToUse && rollsToUse > 0) {
      const updated = await Fabric.findOneAndUpdate(
        { _id: fabricToUse, userId: req.user._id, rollsInStock: { $gte: rollsToUse } },
        { $inc: { rollsInStock: -rollsToUse } },
        { new: true }
      );
      if (!updated) {
        const exists = await Fabric.findOne({ _id: fabricToUse, userId: req.user._id }).select('_id');
        if (!exists) return res.status(400).json({ error: 'Invalid fabric' });
        return res.status(400).json({ error: 'Insufficient fabric stock' });
      }
    } else if (fabricToUse) {
      const exists = await Fabric.findOne({ _id: fabricToUse, userId: req.user._id }).select('_id');
      if (!exists) return res.status(400).json({ error: 'Invalid fabric' });
    }

    if (!fabricToUse && !customFabricToUse && rollsToUse > 0) {
      return res.status(400).json({ error: 'Select fabric or enter fabric name' });
    }
    
    const defaultMeasurements = normalizeMeasurementValues(relationToSave ? relationToSave.measurements : customer.measurements);

    const stitching = new Stitching({
      userId: req.user._id,
      customerId: customer._id,
      relationId: relationToSave?._id || null,
      relationName: (relationToSave ? (relationToSave.nameI18n?.en || relationToSave.name) : null) || relationName || null,
      relationType: relationType || null,
      orderFor: (relationToSave ? (relationToSave.nameI18n?.en || relationToSave.name) : null) || orderFor || null,
      receiptNumber: finalReceiptNumber,
      oldInvoiceNumber: normalizeOldInvoiceNumber(oldInvoiceNumber),
      thawbType: thawbType || 'saudi',
      fabricColor: fabricColor || null,
      fabricId: fabricToUse,
      customFabricName: fabricToUse ? '' : customFabricToUse,
      rollsUsed: rollsToUse,
      measurements: Object.keys(normalizedMeasurements).length ? normalizedMeasurements : defaultMeasurements,
      styleOptions: parsedStyleOptions,
      embroideryDesignId: designIdToSave,
      embroideryDesign: designSnapshot,
      quantity: quantity || 1,
      price,
      paidAmount: paidAmount || 0,
      description: description || '',
      notes: normalizeText(notes),
      dueDate: dueDate || null
    });

    if (req.file) {
      const imageMeta = await persistMeasurementImage({
        userId: req.user._id,
        stitchingId: stitching._id,
        file: req.file
      });
      if (imageMeta) {
        stitching.measurementImage = imageMeta.measurementImage;
        stitching.measurementImageUpdatedAt = imageMeta.measurementImageUpdatedAt;
      }
    }
    
    await stitching.save();

    const safePrice = Number(price) || 0;
    customer.totalSpent += safePrice;
    customer.totalOrders += 1;
    customer.loyaltyPoints += Math.floor(safePrice / 100);
    await customer.save();

    if (hasMeasurementsPayload && Object.keys(normalizedMeasurements).length) {
      if (relationToSave) {
        relationToSave.measurements = mergeMeasurementValues(relationToSave.measurements, normalizedMeasurements);
        await relationToSave.save();
      } else {
        customer.measurements = mergeMeasurementValues(customer.measurements, normalizedMeasurements);
        await customer.save();
      }
    }
    
    await stitching.populate('customerId', 'name phone nameI18n');
    await stitching.populate('relationId', 'name phone nameI18n');
    await stitching.populate('fabricId', 'name madeIn pricePerRoll rollsInStock');
    
    // Send WhatsApp notification for new order
    if (user?.whatsappSettings?.enabled && user?.whatsappSettings?.autoMessageOnOrder) {
      whatsappService.sendOrderNotification(user, customer, stitching)
        .then(result => {
          if (result.success) console.log('WhatsApp order notification sent');
          else console.log('WhatsApp notification failed:', result.error);
        })
        .catch(err => console.error('WhatsApp error:', err));
    }

    // Send WhatsApp auto-invoice on order creation (addon feature)
    if (user?.whatsappSettings?.enabled && user?.whatsappSettings?.autoInvoice && user?.whatsappAddon?.activated) {
      whatsappService.sendInvoiceNotification(user, customer, stitching)
        .then(result => {
          if (result.success) console.log('WhatsApp invoice notification sent');
          else console.log('WhatsApp invoice failed:', result.error);
        })
        .catch(err => console.error('WhatsApp invoice error:', err));
    }
    
    res.status(201).json({ 
      message: 'Stitching order created successfully',
      stitching,
      customer
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Receipt number already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stitching
router.put('/:id', blockDemoWrites, upload.single('measurementImage'), async (req, res) => {
  try {
    const parsedMeasurements = parseObjectField(req.body?.measurements);
    const parsedStyleOptions = parseObjectField(req.body?.styleOptions);
    const { 
      relationId,
      relationName,
      relationType,
      orderFor,
      embroideryDesignId,
      quantity, 
      price, 
      paidAmount,
      description, 
      notes,
      dueDate,
      status,
      oldInvoiceNumber,
      thawbType,
      fabricColor,
      fabricId,
      customFabricName,
      rollsUsed,
      removeMeasurementImage
    } = req.body;
    const hasMeasurementsPayload = req.body?.measurements !== undefined;
    const normalizedMeasurements = normalizeMeasurementValues(parsedMeasurements);
    const shouldRemoveMeasurementImage = parseBooleanField(removeMeasurementImage);
    
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }

    const oldStatus = stitching.status;
    const oldQty = Number(stitching.quantity) || 0;
    const wasCredited = !!stitching.workerEarningsCredited;
    const workerId = stitching.workerId;

    const oldFabricId = stitching.fabricId ? String(stitching.fabricId) : null;
    const oldRollsUsed = Number(stitching.rollsUsed) || 0;

    let nextFabricId = oldFabricId;
    if (fabricId !== undefined) {
      nextFabricId = fabricId ? String(fabricId) : null;
    }

    let nextCustomFabricName = normalizeText(stitching.customFabricName);
    if (customFabricName !== undefined) {
      nextCustomFabricName = normalizeText(customFabricName);
    }

    let nextRollsUsed = oldRollsUsed;
    if (rollsUsed !== undefined) {
      const n = Number(rollsUsed);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ error: 'Invalid rolls used' });
      }
      nextRollsUsed = n;
    }

    if (nextFabricId) {
      const exists = await Fabric.findOne({ _id: nextFabricId, userId: req.user._id }).select('_id');
      if (!exists) return res.status(400).json({ error: 'Invalid fabric' });
    }

    if (!nextFabricId && !nextCustomFabricName && nextRollsUsed > 0) {
      return res.status(400).json({ error: 'Select fabric or enter fabric name' });
    }

    if (oldFabricId === nextFabricId) {
      const delta = nextRollsUsed - oldRollsUsed;
      if (delta > 0 && nextFabricId) {
        const updated = await Fabric.findOneAndUpdate(
          { _id: nextFabricId, userId: req.user._id, rollsInStock: { $gte: delta } },
          { $inc: { rollsInStock: -delta } },
          { new: true }
        );
        if (!updated) return res.status(400).json({ error: 'Insufficient fabric stock' });
      } else if (delta < 0 && nextFabricId) {
        await Fabric.findOneAndUpdate(
          { _id: nextFabricId, userId: req.user._id },
          { $inc: { rollsInStock: Math.abs(delta) } },
          { new: true }
        );
      }
    } else {
      if (nextFabricId && nextRollsUsed > 0) {
        const updated = await Fabric.findOneAndUpdate(
          { _id: nextFabricId, userId: req.user._id, rollsInStock: { $gte: nextRollsUsed } },
          { $inc: { rollsInStock: -nextRollsUsed } },
          { new: true }
        );
        if (!updated) return res.status(400).json({ error: 'Insufficient fabric stock' });
      }

      if (oldFabricId && oldRollsUsed > 0) {
        await Fabric.findOneAndUpdate(
          { _id: oldFabricId, userId: req.user._id },
          { $inc: { rollsInStock: oldRollsUsed } },
          { new: true }
        );
      }
    }
    
    if (hasMeasurementsPayload) stitching.measurements = normalizedMeasurements;
    if (req.body?.styleOptions !== undefined) stitching.styleOptions = parsedStyleOptions;
    if (embroideryDesignId !== undefined) {
      if (!embroideryDesignId) {
        stitching.embroideryDesignId = null;
        stitching.embroideryDesign = {};
      } else {
        const design = await EmbroideryDesign.findOne({ _id: embroideryDesignId, userId: req.user._id });
        if (!design) {
          return res.status(400).json({ error: 'Invalid embroidery design' });
        }
        stitching.embroideryDesignId = design._id;
        stitching.embroideryDesign = {
          name: design.name || '',
          image: design.image || null,
          imageUpdatedAt: design.imageUpdatedAt || null
        };
      }
    }
    if (quantity) stitching.quantity = quantity;
    if (price !== undefined) stitching.price = price;
    if (paidAmount !== undefined) stitching.paidAmount = paidAmount;
    if (description !== undefined) stitching.description = description;
    if (notes !== undefined) stitching.notes = normalizeText(notes);
    if (dueDate !== undefined) stitching.dueDate = dueDate;
    if (oldInvoiceNumber !== undefined) stitching.oldInvoiceNumber = normalizeOldInvoiceNumber(oldInvoiceNumber);
    if (thawbType) stitching.thawbType = thawbType;
    if (fabricColor !== undefined) stitching.fabricColor = fabricColor;
    if (fabricId !== undefined) stitching.fabricId = nextFabricId;
    if (customFabricName !== undefined || fabricId !== undefined) stitching.customFabricName = nextFabricId ? '' : nextCustomFabricName;
    if (rollsUsed !== undefined) stitching.rollsUsed = nextRollsUsed;
    if (req.file) {
      const imageMeta = await persistMeasurementImage({
        userId: req.user._id,
        stitchingId: stitching._id,
        file: req.file
      });
      if (imageMeta) {
        stitching.measurementImage = imageMeta.measurementImage;
        stitching.measurementImageUpdatedAt = imageMeta.measurementImageUpdatedAt;
      }
    } else if (shouldRemoveMeasurementImage) {
      removeUploadedAssetByUrl(stitching.measurementImage);
      stitching.measurementImage = null;
      stitching.measurementImageUpdatedAt = null;
    }

    if (relationId !== undefined || relationName !== undefined || relationType !== undefined || orderFor !== undefined) {
      let relToSave = null;
      if (relationId) {
        const relExists = await Customer.findOne({ _id: relationId, userId: req.user._id }).select('_id name phone nameI18n');
        if (!relExists) return res.status(400).json({ error: 'Invalid relation customer' });
        relToSave = relExists;
      }
      stitching.relationId = relToSave?._id || (relationId ? relationId : null);
      stitching.relationName = (relToSave ? (relToSave.nameI18n?.en || relToSave.name) : null) || (relationName !== undefined ? relationName : stitching.relationName);
      stitching.relationType = relationType !== undefined ? relationType : stitching.relationType;
      stitching.orderFor = (relToSave ? (relToSave.nameI18n?.en || relToSave.name) : null) || (orderFor !== undefined ? orderFor : stitching.orderFor);
    }

    if (hasMeasurementsPayload && Object.keys(normalizedMeasurements).length) {
      const targetId = stitching.relationId ? (stitching.relationId._id || stitching.relationId) : (stitching.customerId?._id || stitching.customerId);
      const targetCustomer = await Customer.findOne({ _id: targetId, userId: req.user._id });
      if (targetCustomer) {
        targetCustomer.measurements = mergeMeasurementValues(targetCustomer.measurements, normalizedMeasurements);
        await targetCustomer.save();
      }
    }
    if (status) {
      stitching.status = status;
      if (status === 'completed') stitching.completedDate = new Date();
      if (status === 'delivered') stitching.deliveredDate = new Date();
    }

    const newStatus = stitching.status;
    const newQty = Number(stitching.quantity) || 0;

    const rollbackWorkerEarnings = async (qtyToUse) => {
      if (!workerId) return;
      const worker = await Worker.findOne({ _id: workerId, userId: req.user._id });
      if (!worker) return;
      if (worker.paymentType !== 'per_stitching') return;
      const q = Number(qtyToUse) || 0;
      const delta = (Number(worker.paymentAmount) || 0) * q;
      worker.totalEarnings = Math.max(0, (Number(worker.totalEarnings) || 0) - delta);
      worker.completedStitchings = Math.max(0, (Number(worker.completedStitchings) || 0) - q);
      await worker.save();
    };

    const creditWorkerEarnings = async (qtyToUse) => {
      if (!workerId) return;
      const worker = await Worker.findOne({ _id: workerId, userId: req.user._id });
      if (!worker) return;
      if (worker.paymentType !== 'per_stitching') return;
      const q = Number(qtyToUse) || 0;
      const delta = (Number(worker.paymentAmount) || 0) * q;
      worker.totalEarnings = (Number(worker.totalEarnings) || 0) + delta;
      worker.completedStitchings = (Number(worker.completedStitchings) || 0) + q;
      await worker.save();
    };

    if (wasCredited && oldStatus === 'delivered' && newStatus !== 'delivered') {
      await rollbackWorkerEarnings(oldQty);
      stitching.workerEarningsCredited = false;
    }

    if (!wasCredited && newStatus === 'delivered') {
      await creditWorkerEarnings(newQty);
      stitching.workerEarningsCredited = true;
    }

    if (wasCredited && oldStatus === 'delivered' && newStatus === 'delivered' && oldQty !== newQty) {
      const deltaQty = newQty - oldQty;
      if (deltaQty > 0) {
        await creditWorkerEarnings(deltaQty);
      } else if (deltaQty < 0) {
        await rollbackWorkerEarnings(Math.abs(deltaQty));
      }
      stitching.workerEarningsCredited = true;
    }
    
    await stitching.save();
    await stitching.populate('customerId', 'name phone nameI18n');
    await stitching.populate('relationId', 'name phone nameI18n');
    await stitching.populate('workerId', 'name phone nameI18n');
    await stitching.populate('fabricId', 'name madeIn pricePerRoll rollsInStock');
    
    // Send WhatsApp notification on status change
    if (status && status !== oldStatus) {
      const user = await User.findById(req.user._id);
      const customer = await Customer.findById(stitching.customerId._id || stitching.customerId);
      
      if (user?.whatsappSettings?.enabled && customer) {
        if (status === 'completed' && user.whatsappSettings.autoMessageOnReady) {
          whatsappService.sendReadyNotification(user, customer, stitching)
            .then(result => {
              if (result.success) console.log('WhatsApp ready notification sent');
            })
            .catch(err => console.error('WhatsApp error:', err));
        } else if (status === 'delivered' && user.whatsappSettings.autoMessageOnDelivery) {
          whatsappService.sendDeliveryNotification(user, customer, stitching)
            .then(result => {
              if (result.success) console.log('WhatsApp delivery notification sent');
            })
            .catch(err => console.error('WhatsApp error:', err));
        }

        // Live Status Update notification (addon feature) — fires for ALL status changes
        if (user.whatsappSettings.autoStatusUpdate && user.whatsappAddon?.activated) {
          whatsappService.sendStatusUpdateNotification(user, customer, stitching, status)
            .then(result => {
              if (result.success) console.log('WhatsApp status update notification sent');
            })
            .catch(err => console.error('WhatsApp status update error:', err));
        }
      }
    }
    
    res.json({ message: 'Stitching updated successfully', stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign to worker
router.put('/:id/assign', blockDemoWrites, async (req, res) => {
  try {
    const { workerId } = req.body;
    
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }

    if (stitching.workerEarningsCredited && stitching.workerId) {
      const oldWorker = await Worker.findOne({ _id: stitching.workerId, userId: req.user._id });
      if (oldWorker && oldWorker.paymentType === 'per_stitching') {
        const q = Number(stitching.quantity) || 0;
        const delta = (Number(oldWorker.paymentAmount) || 0) * q;
        oldWorker.totalEarnings = Math.max(0, (Number(oldWorker.totalEarnings) || 0) - delta);
        oldWorker.completedStitchings = Math.max(0, (Number(oldWorker.completedStitchings) || 0) - q);
        await oldWorker.save();
      }
      stitching.workerEarningsCredited = false;
    }
    
    if (workerId) {
      const worker = await Worker.findOne({ 
        _id: workerId, 
        userId: req.user._id 
      });
      
      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }
      
      stitching.workerId = workerId;
      stitching.status = 'assigned';
    } else {
      stitching.workerId = null;
      stitching.status = 'pending';
    }
    
    await stitching.save();
    await stitching.populate('customerId', 'name phone nameI18n');
    await stitching.populate('workerId', 'name phone nameI18n');
    
    res.json({ message: 'Worker assigned successfully', stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete stitching
router.delete('/:id', blockDemoWrites, async (req, res) => {
  try {
    const stitching = await Stitching.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }

    if (stitching.workerEarningsCredited && stitching.workerId) {
      const oldWorker = await Worker.findOne({ _id: stitching.workerId, userId: req.user._id });
      if (oldWorker && oldWorker.paymentType === 'per_stitching') {
        const q = Number(stitching.quantity) || 0;
        const delta = (Number(oldWorker.paymentAmount) || 0) * q;
        oldWorker.totalEarnings = Math.max(0, (Number(oldWorker.totalEarnings) || 0) - delta);
        oldWorker.completedStitchings = Math.max(0, (Number(oldWorker.completedStitchings) || 0) - q);
        await oldWorker.save();
      }
    }
    
    const customer = await Customer.findById(stitching.customerId);
    if (customer) {
      customer.totalSpent -= stitching.price;
      customer.totalOrders -= 1;
      await customer.save();
    }

    const fid = stitching.fabricId ? String(stitching.fabricId) : null;
    const ru = Number(stitching.rollsUsed) || 0;
    if (fid && ru > 0) {
      await Fabric.findOneAndUpdate(
        { _id: fid, userId: req.user._id },
        { $inc: { rollsInStock: ru } },
        { new: true }
      );
    }

    removeUploadedAssetByUrl(stitching.measurementImage);
    
    await Stitching.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Stitching deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
