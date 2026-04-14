const router = require('express').Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/files');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const convId = (a, b) => [a, b].sort().join('_');

// Get conversation
router.get('/:userId', protect, async (req, res) => {
  try {
    const cid = convId(req.user._id.toString(), req.params.userId);
    const messages = await Message.find({ conversationId: cid })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    // Mark as read
    await Message.updateMany({ conversationId: cid, receiver: req.user._id, read: false },
      { read: true, readAt: new Date() });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message
router.post('/:userId', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const cid = convId(req.user._id.toString(), req.params.userId);
    const msg = await Message.create({
      conversationId: cid, sender: req.user._id,
      receiver: req.params.userId, content
    });
    res.status(201).json(await msg.populate('sender', 'name avatar'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload file in chat
router.post('/:userId/file', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const cid = convId(req.user._id.toString(), req.params.userId);
    const msg = await Message.create({
      conversationId: cid, sender: req.user._id, receiver: req.params.userId,
      content: '', fileUrl: `/uploads/files/${req.file.filename}`,
      fileName: req.file.originalname, fileType: req.file.mimetype
    });
    res.status(201).json(await msg.populate('sender', 'name avatar'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get conversations list
router.get('/', protect, async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    }).sort({ createdAt: -1 }).populate('sender', 'name avatar').populate('receiver', 'name avatar');

    const convMap = {};
    for (const m of msgs) {
      if (!convMap[m.conversationId]) convMap[m.conversationId] = m;
    }
    res.json(Object.values(convMap));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unread count
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
