const router = require('express').Router();
const User = require('../models/User');
const Session = require('../models/Session');
const Request = require('../models/Request');
const Post = require('../models/Post');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, mentors, mentees, sessions, requests, posts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'mentor' }),
      User.countDocuments({ role: 'mentee' }),
      Session.countDocuments(),
      Request.countDocuments({ status: 'accepted' }),
      Post.countDocuments()
    ]);
    const completedSessions = await Session.countDocuments({ status: 'completed' });
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt avatar');
    res.json({ totalUsers, mentors, mentees, sessions, completedSessions, requests, posts, recentUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All users
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(filter).select('-password')
      .sort({ createdAt: -1 }).limit(20).skip((page - 1) * 20);
    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ban / unban
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify mentor
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reported posts
router.get('/reports', async (req, res) => {
  try {
    const posts = await Post.find({ isReported: true })
      .populate('author', 'name email avatar');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pin post
router.put('/posts/:id/pin', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ isPinned: post.isPinned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
