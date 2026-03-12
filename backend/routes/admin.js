const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Customer = require('../models/Customer');
const Stitching = require('../models/Stitching');
const Finisher = require('../models/Finisher');
const FinisherShop = require('../models/FinisherShop');
const FinisherAssignment = require('../models/FinisherAssignment');
const SystemSettings = require('../models/SystemSettings');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateToken } = require('../middleware/auth');
const { calculateEndDate } = require('../utils/subscriptionChecker');
const upload = require('../middleware/upload');
const { translateMany, buildFallbackI18n, getGeminiConfig, invalidateGeminiConfigCache } = require('../utils/geminiTranslate');
const {
  buildDefaultMeasurementsCatalog,
  buildDefaultStyleOptionsCatalog,
  normalizeMeasurementsCatalog,
  normalizeStyleOptionsCatalog
} = require('../utils/catalogs');
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}

router.use(verifyToken, isAdmin);

const uploadsBaseDir = path.join(__dirname, '..', 'uploads');
const STYLE_OPTION_GROUPS = [
  { key: 'collar', options: ['classic', 'round', 'mandarin', 'open'] },
  { key: 'bain', options: ['hidden', 'visible', 'zip', 'half'] },
  { key: 'cuff', options: ['single', 'double', 'round', 'angled'] },
  { key: 'pocket', options: ['none', 'chest', 'side', 'both'] },
  { key: 'buttons', options: ['classic', 'hidden', 'snap', 'premium'] },
  { key: 'embroidery', options: ['none', 'name', 'logo', 'premium'] }
];

const sanitizeKey = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
};

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const safeUnlink = (absPath) => {
  try {
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch (e) {
    null;
  }
};

const moveFile = (from, to) => {
  try {
    fs.renameSync(from, to);
  } catch (e) {
    fs.copyFileSync(from, to);
    safeUnlink(from);
  }
};

const isWebpUpload = (file) => {
  const mime = (file?.mimetype || '').toLowerCase();
  const ext = path.extname(file?.originalname || '').toLowerCase();
  return mime === 'image/webp' || ext === '.webp';
};

const buildAdminMeasurementsCatalog = (doc) => {
  return normalizeMeasurementsCatalog(
    doc?.measurementsCatalog?.fields?.length
      ? doc.measurementsCatalog
      : buildDefaultMeasurementsCatalog()
  );
};

const buildAdminStyleOptionsCatalog = (doc) => {
  const catalog = normalizeStyleOptionsCatalog(
    doc?.styleOptionsCatalog?.groups?.length
      ? doc.styleOptionsCatalog
      : buildDefaultStyleOptionsCatalog()
  );
  const images = Array.isArray(doc?.styleOptionImages) ? doc.styleOptionImages : [];
  const imageMap = new Map(
    images
      .filter((item) => item?.groupKey && item?.optionKey)
      .map((item) => [`${item.groupKey}:${item.optionKey}`, item])
  );

  return {
    groups: (catalog.groups || []).map((group) => ({
      ...group,
      options: (group.options || []).map((option) => {
        const match = imageMap.get(`${group.key}:${option.key}`);
        if (!match) return option;
        return {
          ...option,
          image: match.image || option.image || null,
          imageUpdatedAt: match.imageUpdatedAt || option.imageUpdatedAt || null
        };
      })
    }))
  };
};

router.get('/gemini', async (req, res) => {
  try {
    const doc = await SystemSettings.findOne({});
    const gemini = doc?.gemini || {};
    const cfg = await getGeminiConfig();
    res.json({
      gemini: {
        enabled: cfg.enabled === true,
        model: cfg.model || 'gemini-3-flash-preview',
        hasApiKey: !!cfg.apiKey,
        updatedAt: gemini.updatedAt || doc?.updatedAt || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/gemini', async (req, res) => {
  try {
    const { enabled, apiKey, model, clearApiKey } = req.body || {};

    const doc = (await SystemSettings.findOne({})) || new SystemSettings({});
    if (!doc.gemini) doc.gemini = {};

    if (enabled !== undefined) doc.gemini.enabled = enabled === true;
    if (typeof model === 'string' && model.trim()) doc.gemini.model = model.trim();
    if (typeof apiKey === 'string' && apiKey.trim()) doc.gemini.apiKey = apiKey.trim();
    if (clearApiKey === true) doc.gemini.apiKey = '';
    doc.gemini.updatedAt = new Date();

    await doc.save();
    invalidateGeminiConfigCache();

    const cfg = await getGeminiConfig();
    res.json({
      success: true,
      gemini: {
        enabled: cfg.enabled === true,
        model: cfg.model || 'gemini-3-flash-preview',
        hasApiKey: !!cfg.apiKey,
        updatedAt: doc.gemini.updatedAt || doc.updatedAt || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/gemini/translate', async (req, res) => {
  try {
    const { text, entries, targetLangs } = req.body || {};
    let list = Array.isArray(entries) ? entries : [];
    if (!list.length && typeof text === 'string' && text.trim()) {
      list = [{ id: 'text', text: text.trim() }];
    }
    const translations = await translateMany({ entries: list, targetLangs });
    res.json({ translations });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/measurements-catalog', async (req, res) => {
  try {
    const doc = await SystemSettings.findOne({});
    res.json({ catalog: buildAdminMeasurementsCatalog(doc) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/measurements-catalog', async (req, res) => {
  try {
    const normalizedCatalog = normalizeMeasurementsCatalog({
      fields: Array.isArray(req.body?.fields) ? req.body.fields : []
    });
    const entries = (normalizedCatalog.fields || [])
      .filter((field) => typeof field.name === 'string' && field.name.trim())
      .map((field) => ({ id: `m:${field.key}`, text: field.name.trim() }));
    const translations = entries.length ? await translateMany({ entries }) : {};

    const fields = (normalizedCatalog.fields || []).map((field) => {
      if (typeof field.name === 'string' && field.name.trim()) {
        return { ...field, nameI18n: translations[`m:${field.key}`] || buildFallbackI18n(field.name.trim()) };
      }
      return { ...field, nameI18n: field.nameI18n || {} };
    });

    const doc = (await SystemSettings.findOne({})) || new SystemSettings({});
    doc.measurementsCatalog = { fields };
    doc.markModified('measurementsCatalog');
    await doc.save();

    res.json({ message: 'Measurements catalog updated', catalog: buildAdminMeasurementsCatalog(doc) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/measurements-catalog/image', upload.single('image'), async (req, res) => {
  try {
    const fieldKey = String(req.body?.fieldKey || '').trim();
    if (!fieldKey) {
      return res.status(400).json({ error: 'fieldKey is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const doc = (await SystemSettings.findOne({})) || new SystemSettings({});
    const catalog = buildAdminMeasurementsCatalog(doc);
    const field = (catalog.fields || []).find((item) => item.key === fieldKey);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const relPath = path.join('system-measurements');
    const dirPath = path.join(uploadsBaseDir, relPath);
    ensureDir(dirPath);
    const fileName = `${fieldKey}.webp`;
    const absTarget = path.join(dirPath, fileName);

    if (sharp) {
      await sharp(req.file.path)
        .rotate()
        .resize({ width: 720, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(absTarget);
      safeUnlink(req.file.path);
    } else {
      if (!isWebpUpload(req.file)) {
        safeUnlink(req.file.path);
        return res.status(500).json({ error: 'Image processing is not available on this server' });
      }
      moveFile(req.file.path, absTarget);
    }

    field.image = `/uploads/${path.join(relPath, fileName).replace(/\\/g, '/')}`;
    field.imageUpdatedAt = Date.now();
    doc.measurementsCatalog = normalizeMeasurementsCatalog(catalog);
    doc.markModified('measurementsCatalog');
    await doc.save();

    res.json({ message: 'Measurement image updated', catalog: buildAdminMeasurementsCatalog(doc) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/measurements-catalog/image', async (req, res) => {
  try {
    const fieldKey = String(req.query?.fieldKey || '').trim();
    if (!fieldKey) {
      return res.status(400).json({ error: 'fieldKey is required' });
    }

    const doc = (await SystemSettings.findOne({})) || new SystemSettings({});
    const catalog = buildAdminMeasurementsCatalog(doc);
    const field = (catalog.fields || []).find((item) => item.key === fieldKey);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    if (typeof field.image === 'string' && field.image.startsWith('/uploads/')) {
      const rel = field.image.replace(/^\/uploads\//, '');
      const abs = path.join(uploadsBaseDir, rel);
      safeUnlink(abs);
    }

    field.image = null;
    field.imageUpdatedAt = Date.now();
    doc.measurementsCatalog = normalizeMeasurementsCatalog(catalog);
    doc.markModified('measurementsCatalog');
    await doc.save();

    res.json({ message: 'Measurement image deleted', catalog: buildAdminMeasurementsCatalog(doc) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/style-options-catalog', async (req, res) => {
  try {
    const doc = await SystemSettings.findOne({});
    res.json({ catalog: buildAdminStyleOptionsCatalog(doc) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/style-options-catalog', async (req, res) => {
  try {
    const normalizedCatalog = normalizeStyleOptionsCatalog({
      groups: Array.isArray(req.body?.groups) ? req.body.groups : []
    });
    const groups = (normalizedCatalog.groups || []).filter((group) => STYLE_OPTION_GROUPS.some((item) => item.key === group.key));

    const entries = [];
    groups.forEach((group) => {
      if (typeof group.name === 'string' && group.name.trim()) {
        entries.push({ id: `g:${group.key}`, text: group.name.trim() });
      }
      (group.options || []).forEach((option) => {
        if (typeof option.name === 'string' && option.name.trim()) {
          entries.push({ id: `o:${group.key}:${option.key}`, text: option.name.trim() });
        }
      });
    });
    const translations = entries.length ? await translateMany({ entries }) : {};

    const groupsWithI18n = groups.map((group) => ({
      ...group,
      nameI18n: typeof group.name === 'string' && group.name.trim()
        ? (translations[`g:${group.key}`] || buildFallbackI18n(group.name.trim()))
        : (group.nameI18n || {}),
      options: (group.options || []).map((option) => ({
        ...option,
        nameI18n: typeof option.name === 'string' && option.name.trim()
          ? (translations[`o:${group.key}:${option.key}`] || buildFallbackI18n(option.name.trim()))
          : (option.nameI18n || {})
      }))
    }));

    const doc = (await SystemSettings.findOne({})) || new SystemSettings({});
    doc.styleOptionsCatalog = { groups: groupsWithI18n };
    doc.markModified('styleOptionsCatalog');
    await doc.save();

    res.json({ message: 'Style options catalog updated', catalog: buildAdminStyleOptionsCatalog(doc) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/style-option-images', async (req, res) => {
  try {
    const doc = await SystemSettings.findOne({});
    res.json({
      catalog: buildAdminStyleOptionsCatalog(doc)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/style-option-images/image', upload.single('image'), async (req, res) => {
  try {
    const groupKey = sanitizeKey(req.body.groupKey);
    const optionKey = sanitizeKey(req.body.optionKey);

    if (!groupKey || !optionKey) {
      return res.status(400).json({ error: 'groupKey and optionKey are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const doc = (await SystemSettings.findOne({})) || new SystemSettings({});
    const catalog = buildAdminStyleOptionsCatalog(doc);
    const group = (catalog.groups || []).find((item) => item.key === groupKey);
    const option = (group?.options || []).find((item) => item.key === optionKey);
    if (!group || !option) {
      return res.status(404).json({ error: 'Style option not found' });
    }
    doc.styleOptionImages = Array.isArray(doc.styleOptionImages) ? doc.styleOptionImages : [];

    const relPath = path.join('system-style-options', groupKey);
    const dirPath = path.join(uploadsBaseDir, relPath);
    ensureDir(dirPath);
    const fileName = `${optionKey}.webp`;
    const absTarget = path.join(dirPath, fileName);

    if (sharp) {
      await sharp(req.file.path)
        .rotate()
        .resize({ width: 720, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(absTarget);
      safeUnlink(req.file.path);
    } else {
      if (!isWebpUpload(req.file)) {
        safeUnlink(req.file.path);
        return res.status(500).json({ error: 'Image processing is not available on this server' });
      }
      moveFile(req.file.path, absTarget);
    }

    const imagePath = `/uploads/${path.join(relPath, fileName).replace(/\\/g, '/')}`;
    const imageUpdatedAt = Date.now();
    const existingIndex = doc.styleOptionImages.findIndex((item) => item.groupKey === groupKey && item.optionKey === optionKey);

    if (existingIndex >= 0) {
      doc.styleOptionImages[existingIndex].image = imagePath;
      doc.styleOptionImages[existingIndex].imageUpdatedAt = imageUpdatedAt;
    } else {
      doc.styleOptionImages.push({ groupKey, optionKey, image: imagePath, imageUpdatedAt });
    }

    await doc.save();

    res.json({
      message: 'Style option image updated',
      catalog: buildAdminStyleOptionsCatalog(doc)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/style-option-images/image', async (req, res) => {
  try {
    const groupKey = sanitizeKey(req.query.groupKey);
    const optionKey = sanitizeKey(req.query.optionKey);

    if (!groupKey || !optionKey) {
      return res.status(400).json({ error: 'groupKey and optionKey are required' });
    }
    const doc = (await SystemSettings.findOne({})) || new SystemSettings({});
    const catalog = buildAdminStyleOptionsCatalog(doc);
    const group = (catalog.groups || []).find((item) => item.key === groupKey);
    const option = (group?.options || []).find((item) => item.key === optionKey);
    if (!group || !option) {
      return res.status(404).json({ error: 'Style option not found' });
    }
    doc.styleOptionImages = Array.isArray(doc.styleOptionImages) ? doc.styleOptionImages : [];

    const existingIndex = doc.styleOptionImages.findIndex((item) => item.groupKey === groupKey && item.optionKey === optionKey);
    if (existingIndex >= 0) {
      doc.styleOptionImages[existingIndex].image = null;
      doc.styleOptionImages[existingIndex].imageUpdatedAt = Date.now();
    } else {
      doc.styleOptionImages.push({ groupKey, optionKey, image: null, imageUpdatedAt: Date.now() });
    }

    await doc.save();

    res.json({
      message: 'Style option image deleted',
      catalog: buildAdminStyleOptionsCatalog(doc)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const trialUsers = await User.countDocuments({ subscriptionType: 'trial' });
    const yearlyUsers = await User.countDocuments({ subscriptionType: 'yearly' });
    const lifetimeUsers = await User.countDocuments({ subscriptionType: 'lifetime' });
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');
    
    const expiringUsers = await User.find({
      subscriptionType: { $ne: 'lifetime' },
      subscriptionEndDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).select('-password');
    
    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        trialUsers,
        yearlyUsers,
        lifetimeUsers
      },
      recentUsers,
      expiringUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, subscription } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (subscription) query.subscriptionType = subscription;
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user with stats
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const workersCount = await Worker.countDocuments({ userId: user._id });
    const customersCount = await Customer.countDocuments({ userId: user._id });
    const stitchingsCount = await Stitching.countDocuments({ userId: user._id });
    const totalRevenue = await Stitching.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    res.json({
      user,
      stats: {
        workersCount,
        customersCount,
        stitchingsCount,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user
router.post('/users', upload.single('logo'), async (req, res) => {
  try {
    const { name, nameAr, businessName, businessNameAr, businessAddress, phone, password, subscriptionType, receiptPrefix } = req.body;
    
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    
    const subscriptionEndDate = calculateEndDate(subscriptionType || 'trial');
    
    const user = new User({
      name,
      nameAr: nameAr || name,
      nameI18n: {},
      businessName,
      businessNameAr: businessNameAr || businessName,
      businessNameI18n: {},
      businessAddress: businessAddress || '',
      phone,
      password,
      subscriptionType: subscriptionType || 'trial',
      subscriptionEndDate,
      receiptPrefix: receiptPrefix || 'RCP',
      logo: req.file ? `/uploads/${req.file.filename}` : null
    });

    if (typeof name === 'string' && name.trim()) {
      const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
      user.nameI18n = translations.name || buildFallbackI18n(name.trim());
    }
    if (typeof businessName === 'string' && businessName.trim()) {
      const translations = await translateMany({ entries: [{ id: 'businessName', text: businessName.trim() }] });
      user.businessNameI18n = translations.businessName || buildFallbackI18n(businessName.trim());
    }
    
    await user.save();
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        businessName: user.businessName,
        phone: user.phone,
        subscriptionType: user.subscriptionType,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/users/:id', upload.single('logo'), async (req, res) => {
  try {
    const { name, nameAr, businessNameAr, businessAddress, phone, subscriptionType, isActive, receiptPrefix } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (name) {
      user.name = name;
      if (typeof name === 'string' && name.trim()) {
        const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
        user.nameI18n = translations.name || buildFallbackI18n(name.trim());
      }
    }
    if (nameAr) user.nameAr = nameAr;
    if (businessNameAr) {
      user.businessNameAr = businessNameAr;
      const source = typeof businessNameAr === 'string' && businessNameAr.trim() ? businessNameAr.trim() : (user.businessName || '');
      if (source) {
        const translations = await translateMany({ entries: [{ id: 'businessName', text: source }] });
        user.businessNameI18n = translations.businessName || buildFallbackI18n(source);
      }
    }
    if (businessAddress !== undefined) user.businessAddress = businessAddress;
    if (phone) user.phone = phone;
    if (receiptPrefix) user.receiptPrefix = receiptPrefix;
    if (isActive !== undefined) user.isActive = isActive;
    
    if (subscriptionType && subscriptionType !== user.subscriptionType) {
      user.subscriptionType = subscriptionType;
      user.subscriptionStartDate = new Date();
      user.subscriptionEndDate = calculateEndDate(subscriptionType);
      user.isActive = true;
    }
    
    if (req.file) {
      user.logo = `/uploads/${req.file.filename}`;
    }
    
    await user.save();
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await Worker.deleteMany({ userId: user._id });
    await Customer.deleteMany({ userId: user._id });
    await Stitching.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login as user
router.post('/users/:id/login-as', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const token = generateToken(user._id, 'user');
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        businessName: user.businessName,
        phone: user.phone,
        logo: user.logo,
        language: user.language,
        theme: user.theme,
        role: 'user',
        isAdminSession: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Renew subscription
router.post('/users/:id/renew', async (req, res) => {
  try {
    const { subscriptionType } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.subscriptionType = subscriptionType;
    user.subscriptionStartDate = new Date();
    user.subscriptionEndDate = calculateEndDate(subscriptionType);
    user.isActive = true;
    
    await user.save();
    
    res.json({ message: 'Subscription renewed successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get addon pricing
router.get('/addons', async (req, res) => {
  try {
    const doc = await SystemSettings.findOne({});
    const addons = doc?.addons || {};
    res.json({
      whatsapp: {
        price: addons.whatsapp?.price || 0,
        currency: addons.whatsapp?.currency || 'SAR',
        billingCycle: addons.whatsapp?.billingCycle || 'monthly',
        description: addons.whatsapp?.description || ''
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update addon pricing
router.put('/addons', async (req, res) => {
  try {
    const { whatsapp } = req.body;
    const doc = (await SystemSettings.findOne({})) || new SystemSettings({});
    if (!doc.addons) doc.addons = {};
    if (whatsapp) {
      if (!doc.addons.whatsapp) doc.addons.whatsapp = {};
      if (whatsapp.price !== undefined) doc.addons.whatsapp.price = whatsapp.price;
      if (whatsapp.currency) doc.addons.whatsapp.currency = whatsapp.currency;
      if (whatsapp.billingCycle) doc.addons.whatsapp.billingCycle = whatsapp.billingCycle;
      if (whatsapp.description) doc.addons.whatsapp.description = whatsapp.description;
    }
    await doc.save();
    res.json({ success: true, addons: doc.addons });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle WhatsApp addon for a user
router.put('/users/:id/whatsapp-addon', async (req, res) => {
  try {
    const { activated } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.whatsappAddon) user.whatsappAddon = {};
    user.whatsappAddon.activated = !!activated;
    if (activated) {
      user.whatsappAddon.activatedAt = new Date();
      user.whatsappAddon.activatedBy = req.admin?.name || 'admin';
    }
    await user.save();
    res.json({ success: true, whatsappAddon: user.whatsappAddon });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Admin Finisher Management ────────────────────────────────────────────────

router.get('/users/:userId/finishers', async (req, res) => {
  try {
    const finishers = await Finisher.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .select('-password');
    res.json({ finishers });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users/:userId/finishers', async (req, res) => {
  try {
    const { name, phone, password, language } = req.body || {};
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }
    const existing = await Finisher.findOne({ userId: req.params.userId, phone });
    if (existing) {
      return res.status(400).json({ error: 'Finisher with this phone already exists' });
    }
    const finisher = new Finisher({
      userId: req.params.userId,
      name,
      phone,
      password,
      language: language || 'en'
    });
    if (typeof name === 'string' && name.trim()) {
      const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
      finisher.nameI18n = translations.name || buildFallbackI18n(name.trim());
    }
    await finisher.save();
    res.status(201).json({ message: 'Finisher created successfully', finisher: { ...finisher.toObject(), password: undefined } });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Finisher with this phone already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users/:userId/finishers/:finisherId([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const finisher = await Finisher.findOne({ _id: req.params.finisherId, userId: req.params.userId }).select('-password');
    if (!finisher) return res.status(404).json({ error: 'Finisher not found' });
    res.json({ finisher });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:userId/finishers/:finisherId([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const { name, phone, password, language, isActive } = req.body || {};
    const finisher = await Finisher.findOne({ _id: req.params.finisherId, userId: req.params.userId });
    if (!finisher) return res.status(404).json({ error: 'Finisher not found' });
    if (name) {
      finisher.name = name;
      if (typeof name === 'string' && name.trim()) {
        const translations = await translateMany({ entries: [{ id: 'name', text: name.trim() }] });
        finisher.nameI18n = translations.name || buildFallbackI18n(name.trim());
      }
    }
    if (phone) finisher.phone = phone;
    if (password) finisher.password = password;
    if (language) finisher.language = language;
    if (isActive !== undefined) finisher.isActive = !!isActive;
    await finisher.save();
    res.json({ message: 'Finisher updated successfully', finisher: { ...finisher.toObject(), password: undefined } });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Finisher with this phone already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:userId/finishers/:finisherId([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const finisher = await Finisher.findOne({ _id: req.params.finisherId, userId: req.params.userId });
    if (!finisher) return res.status(404).json({ error: 'Finisher not found' });
    await Promise.all([
      FinisherAssignment.deleteMany({ userId: req.params.userId, finisherId: finisher._id }),
      FinisherShop.deleteMany({ userId: req.params.userId, finisherId: finisher._id }),
      Finisher.findByIdAndDelete(finisher._id)
    ]);
    res.json({ message: 'Finisher deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users/:userId/finishers/:finisherId([0-9a-fA-F]{24})/login-as', async (req, res) => {
  try {
    const finisher = await Finisher.findOne({ _id: req.params.finisherId, userId: req.params.userId }).select('-password');
    if (!finisher) return res.status(404).json({ error: 'Finisher not found' });
    const token = generateToken(finisher._id, 'finisher');
    res.json({
      token,
      role: 'finisher',
      user: {
        id: finisher._id,
        userId: finisher.userId,
        name: finisher.name,
        phone: finisher.phone,
        language: finisher.language,
        role: 'finisher'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
