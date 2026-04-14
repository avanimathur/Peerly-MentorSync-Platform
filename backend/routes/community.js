const router = require('express').Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// Create post
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, category, department, tags, kudosTo } = req.body;
    const post = await Post.create({
      author: req.user._id, title, content, category, department,
      tags: tags || [], kudosTo
    });
    res.status(201).json(await post.populate('author', 'name avatar department'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get posts
router.get('/', protect, async (req, res) => {
  try {
    const { category, department, search, page = 1 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
    const posts = await Post.find(filter)
      .populate('author', 'name avatar department role')
      .populate('kudosTo', 'name avatar')
      .populate('comments.author', 'name avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(20).skip((page - 1) * 20);
    const total = await Post.countDocuments(filter);
    res.json({ posts, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like/unlike post
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const idx = post.likes.indexOf(req.user._id);
    if (idx === -1) post.likes.push(req.user._id);
    else post.likes.splice(idx, 1);
    await post.save();
    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({ author: req.user._id, content: req.body.content });
    await post.save();
    await post.populate('comments.author', 'name avatar');
    res.json(post.comments[post.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Report post
router.post('/:id/report', protect, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { isReported: true });
    res.json({ message: 'Post reported' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
