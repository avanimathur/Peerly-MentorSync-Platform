const router = require('express').Router();
const Goal = require('../models/Goal');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Create goal
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, dueDate, milestones, mentor } = req.body;
    const goal = await Goal.create({
      mentee: req.user._id, mentor, title, description,
      category, dueDate, milestones: milestones?.map(m => ({ text: m, done: false }))
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my goals
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'mentor'
      ? { mentor: req.user._id }
      : { mentee: req.user._id };
    const goals = await Goal.find(filter)
      .populate('mentor', 'name avatar department')
      .populate('mentee', 'name avatar department');
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update goal
router.put('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle milestone
router.put('/:id/milestone/:mIdx', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    const m = goal.milestones[req.params.mIdx];
    if (!m) return res.status(404).json({ message: 'Milestone not found' });
    m.done = !m.done;
    m.completedAt = m.done ? new Date() : null;
    await goal.save();

    // Check if all milestones done
    if (goal.milestones.every(ms => ms.done) && goal.status !== 'completed') {
      goal.status = 'completed';
      goal.completedAt = new Date();
      await goal.save();
      await User.findByIdAndUpdate(goal.mentee, { $inc: { totalGoalsCompleted: 1 } });
      // Award badge
      await User.findByIdAndUpdate(goal.mentee, {
        $push: { badges: { name: 'Goal Crusher', icon: 'trophy', earnedAt: new Date() } }
      });
    }
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete goal
router.delete('/:id', protect, async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
