const router = require('express').Router();
const User = require('../models/User');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

router.get('/mentors', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const mentors = await User.find({ role: 'mentor', isActive: true, isBanned: false, _id: { $ne: me._id } })
      .select('-password -notifPrefs').lean();

    const scored = await Promise.all(mentors.map(async (m) => {
      let score = 0;
      // Shared skills
      const sharedSkills = (me.skills || []).filter(s => (m.skills || []).includes(s));
      score += sharedSkills.length * 3;
      // Shared interests
      const sharedInterests = (me.interests || []).filter(i => (m.interests || []).includes(i));
      score += sharedInterests.length * 2;
      // Same department
      if (me.department && m.department === me.department) score += 2;
      // Reputation
      score += Math.min(m.reputationScore / 20, 5);
      // Recent activity
      const daysSinceActive = m.lastActiveDate
        ? (Date.now() - new Date(m.lastActiveDate)) / (1000 * 60 * 60 * 24) : 999;
      if (daysSinceActive < 3) score += 3;
      else if (daysSinceActive < 7) score += 1;
      // Review data
      const reviews = await Review.find({ mentor: m._id });
      m.avgRating = reviews.length ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
      m.reviewCount = reviews.length;
      return { ...m, matchScore: Math.round(score), sharedSkills, sharedInterests };
    }));

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
