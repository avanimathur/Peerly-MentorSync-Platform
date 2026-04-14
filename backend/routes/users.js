const router = require('express').Router();
const User = require('../models/User');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const fields = ['name', 'bio', 'department', 'year', 'skills', 'interests',
      'linkedIn', 'github', 'availability', 'timezone', 'notifPrefs', 'profileVisibility', 'onboardingComplete'];
    const update = {};
    fields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List all mentors with filters
router.get('/mentors', protect, async (req, res) => {
  try {
    const { department, skills, search, available } = req.query;
    const filter = { role: 'mentor', isActive: true, isBanned: false };
    if (department) filter.department = department;
    if (skills) filter.skills = { $in: skills.split(',') };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
    let mentors = await User.find(filter).select('-password -notifPrefs').lean();

    // Attach average ratings
    for (let m of mentors) {
      const reviews = await Review.find({ mentor: m._id });
      m.avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
      m.reviewCount = reviews.length;
    }

    res.json(mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user profile by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -notifPrefs');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const reviews = await Review.find({ mentor: user._id }).populate('mentee', 'name avatar').limit(5);
    res.json({ user, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save/unsave mentor
router.post('/save/:mentorId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.savedMentors.indexOf(req.params.mentorId);
    if (idx === -1) user.savedMentors.push(req.params.mentorId);
    else user.savedMentors.splice(idx, 1);
    await user.save();
    res.json({ savedMentors: user.savedMentors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get saved mentors
router.get('/saved/list', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedMentors', '-password -notifPrefs');
    res.json(user.savedMentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Report user
router.post('/report/:id', protect, async (req, res) => {
  try {
    // In production, this would create a report record
    res.json({ message: 'Report submitted. Admin will review shortly.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
