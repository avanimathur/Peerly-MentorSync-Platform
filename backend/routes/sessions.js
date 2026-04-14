const router = require('express').Router();
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Create session — only mentees initiate booking requests
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentee') {
      return res.status(403).json({ message: 'Only mentees can request sessions' });
    }
    const { mentor, title, description, scheduledAt, duration, isRecurring, recurringDays, meetLink } = req.body;
    if (!mentor) return res.status(400).json({ message: 'Mentor is required' });

    const mentorUser = await User.findById(mentor);
    if (!mentorUser || mentorUser.role !== 'mentor') {
      return res.status(400).json({ message: 'Invalid mentor' });
    }
    const session = await Session.create({
      mentor, mentee: req.user._id, title, description,
      scheduledAt: new Date(scheduledAt), duration: duration || 60,
      isRecurring: isRecurring || false, recurringDays: recurringDays || [],
      meetLink: meetLink || ''
    });
    await Notification.create({
      user: mentor, type: 'session_request',
      title: 'New Session Request',
      message: `${req.user.name} wants to schedule: "${title}"`,
      link: 'sessions.html'
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my sessions
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { $or: [{ mentor: req.user._id }, { mentee: req.user._id }] };
    if (status) filter.status = status;
    const sessions = await Session.find(filter)
      .populate('mentor', 'name avatar department')
      .populate('mentee', 'name avatar department')
      .sort({ scheduledAt: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update session status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, meetLink } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isMentor = session.mentor.equals(req.user._id);
    const isMentee = session.mentee.equals(req.user._id);
    if (!isMentor && !isMentee) return res.status(403).json({ message: 'Unauthorized' });

    // Only mentor can confirm; only mentee or mentor can cancel; only mentor can complete
    if (status === 'confirmed' && !isMentor) {
      return res.status(403).json({ message: 'Only the mentor can confirm sessions' });
    }
    if (status === 'completed' && !isMentor) {
      return res.status(403).json({ message: 'Only the mentor can mark sessions complete' });
    }

    session.status = status;
    if (meetLink) session.meetLink = meetLink;

    if (status === 'confirmed') {
      await Notification.create({
        user: session.mentee, type: 'session_confirmed',
        title: 'Session Confirmed ✅',
        message: `Your session "${session.title}" has been confirmed`,
        link: 'sessions.html'
      });
    }
    if (status === 'completed') {
      const hours = session.duration / 60;
      await User.findByIdAndUpdate(session.mentor, { $inc: { totalSessions: 1, totalSessionHours: hours } });
      await User.findByIdAndUpdate(session.mentee, { $inc: { totalSessions: 1 } });
      await Notification.create({
        user: session.mentee, type: 'session_completed',
        title: 'Session Complete',
        message: `"${session.title}" is marked complete. Leave a review!`,
        link: 'sessions.html'
      });
    }
    if (status === 'cancelled') {
      const otherUser = isMentor ? session.mentee : session.mentor;
      await Notification.create({
        user: otherUser, type: 'session_cancelled',
        title: 'Session Cancelled',
        message: `"${session.title}" has been cancelled`,
        link: 'sessions.html'
      });
    }

    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add notes/action items — both parties can add notes
router.put('/:id/notes', protect, async (req, res) => {
  try {
    const { notes, actionItems } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    const isParty = session.mentor.equals(req.user._id) || session.mentee.equals(req.user._id);
    if (!isParty) return res.status(403).json({ message: 'Unauthorized' });
    session.notes = notes;
    session.actionItems = actionItems;
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit feedback — mentee rates mentor only
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentee') {
      return res.status(403).json({ message: 'Only mentees can rate sessions' });
    }
    const { rating, comment } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!session.mentee.equals(req.user._id)) return res.status(403).json({ message: 'Not your session' });
    if (session.status !== 'completed') return res.status(400).json({ message: 'Session must be completed first' });

    session.feedbackMentee = { rating, comment, submittedAt: new Date() };
    await session.save();

    const Review = require('../models/Review');
    const existing = await Review.findOne({ session: session._id });
    if (!existing) {
      await Review.create({ mentor: session.mentor, mentee: req.user._id, session: session._id, rating, comment });
      const reviews = await Review.find({ mentor: session.mentor });
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await User.findByIdAndUpdate(session.mentor, { reputationScore: Math.round(avg * 20) });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
