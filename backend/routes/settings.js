const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}
const User = require('../models/User');
const Worker = require('../models/Worker');
const Customer = require('../models/Customer');
const Stitching = require('../models/Stitching');
const Payment = require('../models/Payment');
const { translateMany, buildFallbackI18n } = require('../utils/geminiTranslate');
const { verifyToken, isUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verifyToken, isUser);

router.post('/translate', async (req, res) => {
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

const uploadsBaseDir = path.join(__dirname, '..', 'uploads');

const ALLOWED_STYLE_GROUPS = new Set([
  'collar',
  'bain',
  'cuff',
  'pocket',
  'buttons',
  'embroidery'
]);

const ALLOWED_MEASUREMENT_KEYS = [
  'length',
  'shoulderWidth',
  'chest',
  'waist',
  'hips',
  'sleeveLength',
  'bicep',
  'forearm',
  'neck',
  'wrist',
  'cuffWidth',
  'expansion',
  'armhole',
  'bottom'
];

const ALLOWED_THAWB_TYPES = [
  'saudi',
  'qatari',
  'emirati',
  'kuwaiti',
  'omani',
  'bahraini',
  'noum'
];

const ALLOWED_FABRIC_COLORS = [
  'white',
  'cream',
  'offwhite',
  'beige',
  'grey',
  'black',
  'navy',
  'brown'
];

const sanitizeKey = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
};

const sanitizeExactKey = (value) => {
  if (!value) return '';
  return String(value).trim();
};

const buildDefaultStyleOptionsCatalog = () => ({
  groups: [
    {
      key: 'collar',
      name: '',
      enabled: true,
      sortOrder: 0,
      options: [
        { key: 'classic', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 0 },
        { key: 'round', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 1 },
        { key: 'mandarin', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 2 },
        { key: 'open', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 3 }
      ]
    },
    {
      key: 'bain',
      name: '',
      enabled: true,
      sortOrder: 1,
      options: [
        { key: 'hidden', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 0 },
        { key: 'visible', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 1 },
        { key: 'zip', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 2 },
        { key: 'half', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 3 }
      ]
    },
    {
      key: 'cuff',
      name: '',
      enabled: true,
      sortOrder: 2,
      options: [
        { key: 'single', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 0 },
        { key: 'double', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 1 },
        { key: 'round', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 2 },
        { key: 'angled', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 3 }
      ]
    },
    {
      key: 'pocket',
      name: '',
      enabled: true,
      sortOrder: 3,
      options: [
        { key: 'none', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 0 },
        { key: 'chest', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 1 },
        { key: 'side', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 2 },
        { key: 'both', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 3 }
      ]
    },
    {
      key: 'buttons',
      name: '',
      enabled: true,
      sortOrder: 4,
      options: [
        { key: 'classic', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 0 },
        { key: 'hidden', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 1 },
        { key: 'snap', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 2 },
        { key: 'premium', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 3 }
      ]
    },
    {
      key: 'embroidery',
      name: '',
      enabled: true,
      sortOrder: 5,
      options: [
        { key: 'none', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 0 },
        { key: 'name', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 1 },
        { key: 'logo', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 2 },
        { key: 'premium', name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: 3 }
      ]
    }
  ]
});

const ensureUserStyleOptionsCatalog = async (user) => {
  const hasGroups = user?.styleOptionsCatalog?.groups && user.styleOptionsCatalog.groups.length > 0;
  if (hasGroups) return user.styleOptionsCatalog;
  user.styleOptionsCatalog = buildDefaultStyleOptionsCatalog();
  await user.save();
  return user.styleOptionsCatalog;
};

const buildDefaultMeasurementsCatalog = () => ({
  fields: ALLOWED_MEASUREMENT_KEYS.map((key, idx) => ({
    key,
    name: '',
    enabled: true,
    sortOrder: idx,
    image: null,
    imageUpdatedAt: null
  }))
});

const ensureUserMeasurementsCatalog = async (user) => {
  const hasFields = user?.measurementsCatalog?.fields && user.measurementsCatalog.fields.length > 0;
  if (hasFields) return user.measurementsCatalog;
  user.measurementsCatalog = buildDefaultMeasurementsCatalog();
  await user.save();
  return user.measurementsCatalog;
};

const buildDefaultThawbTypesCatalog = () => ({
  types: ALLOWED_THAWB_TYPES.map((key, idx) => ({
    key,
    name: '',
    enabled: true,
    sortOrder: idx,
    image: null,
    imageUpdatedAt: null
  }))
});

const ensureUserThawbTypesCatalog = async (user) => {
  const hasTypes = user?.thawbTypesCatalog?.types && user.thawbTypesCatalog.types.length > 0;
  if (hasTypes) return user.thawbTypesCatalog;
  user.thawbTypesCatalog = buildDefaultThawbTypesCatalog();
  await user.save();
  return user.thawbTypesCatalog;
};

const buildDefaultFabricColorsCatalog = () => ({
  colors: [
    { key: 'white', name: '', enabled: true, sortOrder: 0, hex: '#FFFFFF' },
    { key: 'cream', name: '', enabled: true, sortOrder: 1, hex: '#FFFDD0' },
    { key: 'offwhite', name: '', enabled: true, sortOrder: 2, hex: '#FAF9F6' },
    { key: 'beige', name: '', enabled: true, sortOrder: 3, hex: '#F5F5DC' },
    { key: 'grey', name: '', enabled: true, sortOrder: 4, hex: '#808080' },
    { key: 'black', name: '', enabled: true, sortOrder: 5, hex: '#000000' },
    { key: 'navy', name: '', enabled: true, sortOrder: 6, hex: '#000080' },
    { key: 'brown', name: '', enabled: true, sortOrder: 7, hex: '#8B4513' }
  ]
});

const ensureUserFabricColorsCatalog = async (user) => {
  const hasColors = user?.fabricColorsCatalog?.colors && user.fabricColorsCatalog.colors.length > 0;
  if (hasColors) return user.fabricColorsCatalog;
  user.fabricColorsCatalog = buildDefaultFabricColorsCatalog();
  await user.save();
  return user.fabricColorsCatalog;
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

const findGroupAndOption = (catalog, groupKey, optionKey) => {
  const group = (catalog?.groups || []).find((g) => g.key === groupKey);
  if (!group) return { group: null, option: null };
  const option = (group.options || []).find((o) => o.key === optionKey);
  return { group, option };
};

// Get settings
router.get('/', async (req, res) => {
  try {
    res.json({
      settings: {
        businessName: req.user.businessName,
        logo: req.user.logo,
        language: req.user.language,
        theme: req.user.theme,
        receiptPrefix: req.user.receiptPrefix,
        receiptCounter: req.user.receiptCounter,
        whatsappEnabled: req.user.whatsappEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/measurements-catalog', async (req, res) => {
  try {
    const catalog = await ensureUserMeasurementsCatalog(req.user);
    res.json({ catalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/measurements-catalog', async (req, res) => {
  try {
    const fields = Array.isArray(req.body?.fields) ? req.body.fields : [];
    const allowed = new Set(ALLOWED_MEASUREMENT_KEYS);

    const nextFields = fields
      .map((f, idx) => {
        const key = sanitizeExactKey(f.key);
        if (!key || !allowed.has(key)) return null;
        return {
          key,
          name: typeof f.name === 'string' ? f.name : '',
          nameI18n: typeof f.nameI18n === 'object' && f.nameI18n ? f.nameI18n : {},
          enabled: f.enabled !== false,
          sortOrder: Number.isFinite(f.sortOrder) ? f.sortOrder : idx,
          image: typeof f.image === 'string' ? f.image : null,
          imageUpdatedAt: typeof f.imageUpdatedAt === 'number' ? f.imageUpdatedAt : null
        };
      })
      .filter(Boolean);

    const entries = nextFields
      .filter((f) => typeof f.name === 'string' && f.name.trim())
      .map((f) => ({ id: `m:${f.key}`, text: f.name.trim() }));
    const translations = entries.length ? await translateMany({ entries }) : {};

    const fieldsWithI18n = nextFields.map((f) => {
      const id = `m:${f.key}`;
      if (typeof f.name === 'string' && f.name.trim()) {
        return { ...f, nameI18n: translations[id] || buildFallbackI18n(f.name.trim()) };
      }
      return { ...f, nameI18n: f.nameI18n || {} };
    });

    req.user.measurementsCatalog = { fields: fieldsWithI18n };
    req.user.markModified('measurementsCatalog');
    await req.user.save();
    res.json({ message: 'Measurements updated', catalog: req.user.measurementsCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/measurements-catalog/image', upload.single('image'), async (req, res) => {
  try {
    const fieldKey = sanitizeExactKey(req.body.fieldKey);
    if (!fieldKey || !ALLOWED_MEASUREMENT_KEYS.includes(fieldKey)) {
      return res.status(400).json({ error: 'Unsupported fieldKey' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const catalog = await ensureUserMeasurementsCatalog(req.user);
    const field = (catalog.fields || []).find((f) => f.key === fieldKey);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const relPath = path.join('measurements', String(req.user._id));
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
    req.user.markModified('measurementsCatalog');
    await req.user.save();

    res.json({ message: 'Measurement image updated', field, catalog: req.user.measurementsCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/measurements-catalog/image', async (req, res) => {
  try {
    const fieldKey = sanitizeExactKey(req.query.fieldKey);
    if (!fieldKey || !ALLOWED_MEASUREMENT_KEYS.includes(fieldKey)) {
      return res.status(400).json({ error: 'Unsupported fieldKey' });
    }

    const catalog = await ensureUserMeasurementsCatalog(req.user);
    const field = (catalog.fields || []).find((f) => f.key === fieldKey);
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
    req.user.markModified('measurementsCatalog');
    await req.user.save();
    res.json({ message: 'Measurement image deleted', field, catalog: req.user.measurementsCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/thawb-types-catalog', async (req, res) => {
  try {
    const catalog = await ensureUserThawbTypesCatalog(req.user);
    res.json({ catalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/thawb-types-catalog', async (req, res) => {
  try {
    const types = Array.isArray(req.body?.types) ? req.body.types : [];
    const allowed = new Set(ALLOWED_THAWB_TYPES);

    const nextTypes = types
      .map((t, idx) => {
        const key = sanitizeKey(t.key);
        if (!key || !allowed.has(key)) return null;
        return {
          key,
          name: typeof t.name === 'string' ? t.name : '',
          nameI18n: typeof t.nameI18n === 'object' && t.nameI18n ? t.nameI18n : {},
          enabled: t.enabled !== false,
          sortOrder: Number.isFinite(t.sortOrder) ? t.sortOrder : idx,
          image: typeof t.image === 'string' ? t.image : null,
          imageUpdatedAt: typeof t.imageUpdatedAt === 'number' ? t.imageUpdatedAt : null
        };
      })
      .filter(Boolean);

    const entries = nextTypes
      .filter((x) => typeof x.name === 'string' && x.name.trim())
      .map((x) => ({ id: `t:${x.key}`, text: x.name.trim() }));
    const translations = entries.length ? await translateMany({ entries }) : {};

    const typesWithI18n = nextTypes.map((x) => {
      const id = `t:${x.key}`;
      if (typeof x.name === 'string' && x.name.trim()) {
        return { ...x, nameI18n: translations[id] || buildFallbackI18n(x.name.trim()) };
      }
      return { ...x, nameI18n: x.nameI18n || {} };
    });

    req.user.thawbTypesCatalog = { types: typesWithI18n };
    req.user.markModified('thawbTypesCatalog');
    await req.user.save();
    res.json({ message: 'Thawb types updated', catalog: req.user.thawbTypesCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/thawb-types-catalog/image', upload.single('image'), async (req, res) => {
  try {
    const typeKey = sanitizeKey(req.body.typeKey);
    if (!typeKey || !ALLOWED_THAWB_TYPES.includes(typeKey)) {
      return res.status(400).json({ error: 'Unsupported typeKey' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const catalog = await ensureUserThawbTypesCatalog(req.user);
    const type = (catalog.types || []).find((t) => t.key === typeKey);
    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }

    const relPath = path.join('thawb-types', String(req.user._id));
    const dirPath = path.join(uploadsBaseDir, relPath);
    ensureDir(dirPath);
    const fileName = `${typeKey}.webp`;
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

    type.image = `/uploads/${path.join(relPath, fileName).replace(/\\/g, '/')}`;
    type.imageUpdatedAt = Date.now();
    req.user.markModified('thawbTypesCatalog');
    await req.user.save();

    res.json({ message: 'Thawb image updated', type, catalog: req.user.thawbTypesCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/thawb-types-catalog/image', async (req, res) => {
  try {
    const typeKey = sanitizeKey(req.query.typeKey);
    if (!typeKey || !ALLOWED_THAWB_TYPES.includes(typeKey)) {
      return res.status(400).json({ error: 'Unsupported typeKey' });
    }

    const catalog = await ensureUserThawbTypesCatalog(req.user);
    const type = (catalog.types || []).find((t) => t.key === typeKey);
    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }

    if (typeof type.image === 'string' && type.image.startsWith('/uploads/')) {
      const rel = type.image.replace(/^\/uploads\//, '');
      const abs = path.join(uploadsBaseDir, rel);
      safeUnlink(abs);
    }

    type.image = null;
    type.imageUpdatedAt = Date.now();
    req.user.markModified('thawbTypesCatalog');
    await req.user.save();
    res.json({ message: 'Thawb image deleted', type, catalog: req.user.thawbTypesCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/fabric-colors-catalog', async (req, res) => {
  try {
    const catalog = await ensureUserFabricColorsCatalog(req.user);
    res.json({ catalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/fabric-colors-catalog', async (req, res) => {
  try {
    const colors = Array.isArray(req.body?.colors) ? req.body.colors : [];
    const allowed = new Set(ALLOWED_FABRIC_COLORS);

    const nextColors = colors
      .map((c, idx) => {
        const key = sanitizeKey(c.key);
        if (!key || !allowed.has(key)) return null;
        const hex = typeof c.hex === 'string' ? c.hex : '';
        return {
          key,
          name: typeof c.name === 'string' ? c.name : '',
          nameI18n: typeof c.nameI18n === 'object' && c.nameI18n ? c.nameI18n : {},
          enabled: c.enabled !== false,
          sortOrder: Number.isFinite(c.sortOrder) ? c.sortOrder : idx,
          hex
        };
      })
      .filter(Boolean);

    const entries = nextColors
      .filter((x) => typeof x.name === 'string' && x.name.trim())
      .map((x) => ({ id: `c:${x.key}`, text: x.name.trim() }));
    const translations = entries.length ? await translateMany({ entries }) : {};

    const colorsWithI18n = nextColors.map((x) => {
      const id = `c:${x.key}`;
      if (typeof x.name === 'string' && x.name.trim()) {
        return { ...x, nameI18n: translations[id] || buildFallbackI18n(x.name.trim()) };
      }
      return { ...x, nameI18n: x.nameI18n || {} };
    });

    req.user.fabricColorsCatalog = { colors: colorsWithI18n };
    req.user.markModified('fabricColorsCatalog');
    await req.user.save();
    res.json({ message: 'Fabric colors updated', catalog: req.user.fabricColorsCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/style-options', async (req, res) => {
  try {
    const catalog = await ensureUserStyleOptionsCatalog(req.user);
    res.json({ catalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/style-options', async (req, res) => {
  try {
    const bodyGroups = Array.isArray(req.body?.groups) ? req.body.groups : [];

    const groups = bodyGroups
      .map((g, groupIdx) => {
        const groupKey = sanitizeKey(g.key);
        if (!groupKey || !ALLOWED_STYLE_GROUPS.has(groupKey)) return null;
        const optionsArr = Array.isArray(g.options) ? g.options : [];
        const options = optionsArr
          .map((o, optIdx) => {
            const optionKey = sanitizeKey(o.key);
            if (!optionKey) return null;
            return {
              key: optionKey,
              name: typeof o.name === 'string' ? o.name : '',
              nameI18n: typeof o.nameI18n === 'object' && o.nameI18n ? o.nameI18n : {},
              image: typeof o.image === 'string' ? o.image : null,
              imageUpdatedAt: typeof o.imageUpdatedAt === 'number' ? o.imageUpdatedAt : null,
              enabled: o.enabled !== false,
              sortOrder: Number.isFinite(o.sortOrder) ? o.sortOrder : optIdx
            };
          })
          .filter(Boolean);

        return {
          key: groupKey,
          name: typeof g.name === 'string' ? g.name : '',
          nameI18n: typeof g.nameI18n === 'object' && g.nameI18n ? g.nameI18n : {},
          enabled: g.enabled !== false,
          sortOrder: Number.isFinite(g.sortOrder) ? g.sortOrder : groupIdx,
          options
        };
      })
      .filter(Boolean);

    const entries = [];
    groups.forEach((g) => {
      if (typeof g.name === 'string' && g.name.trim()) {
        entries.push({ id: `g:${g.key}`, text: g.name.trim() });
      }
      (g.options || []).forEach((o) => {
        if (typeof o.name === 'string' && o.name.trim()) {
          entries.push({ id: `o:${g.key}:${o.key}`, text: o.name.trim() });
        }
      });
    });

    const translations = entries.length ? await translateMany({ entries }) : {};

    const groupsWithI18n = groups.map((g) => {
      const gid = `g:${g.key}`;
      const groupNameI18n = (typeof g.name === 'string' && g.name.trim())
        ? (translations[gid] || buildFallbackI18n(g.name.trim()))
        : (g.nameI18n || {});

      const nextOptions = (g.options || []).map((o) => {
        const oid = `o:${g.key}:${o.key}`;
        const optNameI18n = (typeof o.name === 'string' && o.name.trim())
          ? (translations[oid] || buildFallbackI18n(o.name.trim()))
          : (o.nameI18n || {});
        return { ...o, nameI18n: optNameI18n };
      });

      return { ...g, nameI18n: groupNameI18n, options: nextOptions };
    });

    req.user.styleOptionsCatalog = { groups: groupsWithI18n };
    await req.user.save();
    res.json({ message: 'Style options updated', catalog: req.user.styleOptionsCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/style-options/image', upload.single('image'), async (req, res) => {
  try {
    const groupKey = sanitizeKey(req.body.groupKey);
    const optionKey = sanitizeKey(req.body.optionKey);

    if (!groupKey || !optionKey) {
      return res.status(400).json({ error: 'groupKey and optionKey are required' });
    }
    if (!ALLOWED_STYLE_GROUPS.has(groupKey)) {
      return res.status(400).json({ error: 'Unsupported groupKey' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const catalog = await ensureUserStyleOptionsCatalog(req.user);
    const { group, option } = findGroupAndOption(catalog, groupKey, optionKey);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    let targetOption = option;
    if (!targetOption) {
      group.options = Array.isArray(group.options) ? group.options : [];
      group.options.push({ key: optionKey, name: '', image: null, imageUpdatedAt: null, enabled: true, sortOrder: group.options.length });
      targetOption = group.options.find((o) => o.key === optionKey);
    }

    const relPath = path.join('style-options', String(req.user._id), groupKey);
    const dirPath = path.join(uploadsBaseDir, relPath);
    fs.mkdirSync(dirPath, { recursive: true });
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

    const urlPath = `/uploads/${path.join(relPath, fileName).replace(/\\/g, '/')}`;
    targetOption.image = urlPath;
    targetOption.imageUpdatedAt = Date.now();

    req.user.markModified('styleOptionsCatalog');
    await req.user.save();

    res.json({ message: 'Image updated', option: targetOption, catalog: req.user.styleOptionsCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/style-options/image', async (req, res) => {
  try {
    const groupKey = sanitizeKey(req.query.groupKey);
    const optionKey = sanitizeKey(req.query.optionKey);
    if (!groupKey || !optionKey) {
      return res.status(400).json({ error: 'groupKey and optionKey are required' });
    }
    if (!ALLOWED_STYLE_GROUPS.has(groupKey)) {
      return res.status(400).json({ error: 'Unsupported groupKey' });
    }

    const catalog = await ensureUserStyleOptionsCatalog(req.user);
    const { option } = findGroupAndOption(catalog, groupKey, optionKey);
    if (!option) {
      return res.status(404).json({ error: 'Option not found' });
    }

    const image = option.image;
    if (typeof image === 'string' && image.startsWith('/uploads/')) {
      const rel = image.replace(/^\/uploads\//, '');
      const abs = path.join(uploadsBaseDir, rel);
      if (fs.existsSync(abs)) {
        try {
          fs.unlinkSync(abs);
        } catch (e) {
          null;
        }
      }
    }

    option.image = null;
    option.imageUpdatedAt = Date.now();
    req.user.markModified('styleOptionsCatalog');
    await req.user.save();
    res.json({ message: 'Image deleted', option, catalog: req.user.styleOptionsCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/style-options/option', async (req, res) => {
  try {
    const groupKey = sanitizeKey(req.query.groupKey);
    const optionKey = sanitizeKey(req.query.optionKey);
    if (!groupKey || !optionKey) {
      return res.status(400).json({ error: 'groupKey and optionKey are required' });
    }
    if (!ALLOWED_STYLE_GROUPS.has(groupKey)) {
      return res.status(400).json({ error: 'Unsupported groupKey' });
    }

    const catalog = await ensureUserStyleOptionsCatalog(req.user);
    const group = (catalog?.groups || []).find((g) => g.key === groupKey);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const option = (group.options || []).find((o) => o.key === optionKey);
    if (!option) {
      return res.status(404).json({ error: 'Option not found' });
    }

    const image = option.image;
    if (typeof image === 'string' && image.startsWith('/uploads/')) {
      const rel = image.replace(/^\/uploads\//, '');
      const abs = path.join(uploadsBaseDir, rel);
      if (fs.existsSync(abs)) {
        try {
          fs.unlinkSync(abs);
        } catch (e) {
          null;
        }
      }
    }

    group.options = (group.options || []).filter((o) => o.key !== optionKey);
    req.user.markModified('styleOptionsCatalog');
    await req.user.save();
    res.json({ message: 'Option deleted', catalog: req.user.styleOptionsCatalog });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.put('/', upload.single('logo'), async (req, res) => {
  try {
    const { language, receiptPrefix, businessName, theme } = req.body;
    
    if (language) req.user.language = language;
    if (receiptPrefix) req.user.receiptPrefix = receiptPrefix;
    if (businessName) {
      const oldBusinessName = req.user.businessName;
      const oldBusinessNameAr = req.user.businessNameAr;
      req.user.businessName = businessName;

      if (typeof businessName === 'string' && businessName.trim()) {
        const translations = await translateMany({ entries: [{ id: 'businessName', text: businessName.trim() }] });
        req.user.businessNameI18n = translations.businessName || buildFallbackI18n(businessName.trim());

        if (!oldBusinessNameAr || oldBusinessNameAr === oldBusinessName) {
          const ar = req.user.businessNameI18n?.ar;
          if (typeof ar === 'string' && ar.trim()) {
            req.user.businessNameAr = ar;
          }
        }
      }
    }
    if (theme) req.user.theme = theme;
    if (req.file) req.user.logo = `/uploads/${req.file.filename}`;
    
    await req.user.save();
    
    res.json({ 
      message: 'Settings updated successfully',
      settings: {
        businessName: req.user.businessName,
        logo: req.user.logo,
        language: req.user.language,
        theme: req.user.theme,
        receiptPrefix: req.user.receiptPrefix,
        receiptCounter: req.user.receiptCounter,
        whatsappEnabled: req.user.whatsappEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update receipt settings
router.put('/receipt', async (req, res) => {
  try {
    const { receiptPrefix, receiptCounter } = req.body;
    
    if (receiptPrefix) req.user.receiptPrefix = receiptPrefix;
    if (receiptCounter) req.user.receiptCounter = receiptCounter;
    
    await req.user.save();
    
    res.json({ 
      message: 'Receipt settings updated',
      receiptPrefix: req.user.receiptPrefix,
      receiptCounter: req.user.receiptCounter
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Export user data
router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [workers, customers, stitchings, payments] = await Promise.all([
      Worker.find({ userId }).lean(),
      Customer.find({ userId }).lean(),
      Stitching.find({ userId }).lean(),
      Payment.find({ userId }).lean()
    ]);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      businessName: req.user.businessName,
      data: {
        workers,
        customers,
        stitchings,
        payments
      },
      stats: {
        totalWorkers: workers.length,
        totalCustomers: customers.length,
        totalStitchings: stitchings.length,
        totalPayments: payments.length
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
