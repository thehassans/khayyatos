const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}

const EmbroideryDesign = require('../models/EmbroideryDesign');
const { verifyToken, isUser } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { translateMany, buildFallbackI18n } = require('../utils/geminiTranslate');

router.use(verifyToken, isUser);

const uploadsBaseDir = path.join(__dirname, '..', 'uploads');

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

router.get('/', async (req, res) => {
  try {
    const designs = await EmbroideryDesign.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ designs });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const design = await EmbroideryDesign.findOne({ _id: req.params.id, userId: req.user._id });
    if (!design) return res.status(404).json({ error: 'Design not found' });
    res.json({ design });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const design = new EmbroideryDesign({
      userId: req.user._id,
      name,
      nameI18n: {},
      image: null,
      imageUpdatedAt: null
    });

    {
      const translations = await translateMany({ entries: [{ id: 'name', text: name }] });
      design.nameI18n = translations.name || buildFallbackI18n(name);
    }

    await design.save();

    if (req.file) {
      if (!sharp) {
        return res.status(500).json({ error: 'Image processing is not available on this server' });
      }

      const relPath = path.join('embroidery-designs', String(req.user._id));
      const dirPath = path.join(uploadsBaseDir, relPath);
      ensureDir(dirPath);

      const fileName = `${String(design._id)}.webp`;
      const absTarget = path.join(dirPath, fileName);

      await sharp(req.file.path)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(absTarget);

      safeUnlink(req.file.path);

      design.image = `/uploads/${path.join(relPath, fileName).replace(/\\/g, '/')}`;
      design.imageUpdatedAt = Date.now();
      await design.save();
    }

    res.status(201).json({ message: 'Design created', design });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const design = await EmbroideryDesign.findOne({ _id: req.params.id, userId: req.user._id });
    if (!design) return res.status(404).json({ error: 'Design not found' });

    if (typeof req.body?.name === 'string') {
      const n = req.body.name.trim();
      if (n) {
        design.name = n;
        const translations = await translateMany({ entries: [{ id: 'name', text: n }] });
        design.nameI18n = translations.name || buildFallbackI18n(n);
      }
    }

    if (req.file) {
      if (!sharp) {
        return res.status(500).json({ error: 'Image processing is not available on this server' });
      }

      const relPath = path.join('embroidery-designs', String(req.user._id));
      const dirPath = path.join(uploadsBaseDir, relPath);
      ensureDir(dirPath);

      const fileName = `${String(design._id)}.webp`;
      const absTarget = path.join(dirPath, fileName);

      await sharp(req.file.path)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(absTarget);

      safeUnlink(req.file.path);

      design.image = `/uploads/${path.join(relPath, fileName).replace(/\\/g, '/')}`;
      design.imageUpdatedAt = Date.now();
    }

    await design.save();
    res.json({ message: 'Design updated', design });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const design = await EmbroideryDesign.findOne({ _id: req.params.id, userId: req.user._id });
    if (!design) return res.status(404).json({ error: 'Design not found' });

    if (typeof design.image === 'string' && design.image.startsWith('/uploads/')) {
      const rel = design.image.replace(/^\/uploads\//, '');
      const abs = path.join(uploadsBaseDir, rel);
      safeUnlink(abs);
    }

    await EmbroideryDesign.deleteOne({ _id: design._id });
    res.json({ message: 'Design deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
