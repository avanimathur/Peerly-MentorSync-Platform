const router = require('express').Router();
const Resource = require('../models/Resource');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resources');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, description, type, url, category, tags, department } = req.body;
    const resource = await Resource.create({
      uploadedBy: req.user._id, title, description, type,
      url: url || '', fileUrl: req.file ? `/uploads/resources/${req.file.filename}` : '',
      category, tags: tags ? tags.split(',').map(t => t.trim()) : [], department
    });
    res.status(201).json(await resource.populate('uploadedBy', 'name avatar'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { category, department, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/save', protect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    const idx = resource.saves.indexOf(req.user._id);
    if (idx === -1) resource.saves.push(req.user._id);
    else resource.saves.splice(idx, 1);
    await resource.save();
    res.json({ saves: resource.saves.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const r = await Resource.findById(req.params.id);
    if (!r.uploadedBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
