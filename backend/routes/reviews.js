const router = require('express').Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/mentor/:mentorId', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ mentor: req.params.mentorId })
      .populate('mentee', 'name avatar department')
      .sort({ createdAt: -1 });
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
    res.json({ reviews, avgRating: avg, count: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { mentor, rating, comment, session } = req.body;
    const existing = await Review.findOne({ mentor, mentee: req.user._id, session });
    if (existing) return res.status(400).json({ message: 'Review already submitted' });
    const review = await Review.create({ mentor, mentee: req.user._id, rating, comment, session });
    const reviews = await Review.find({ mentor });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(mentor, { reputationScore: Math.round(avg * 20) });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
