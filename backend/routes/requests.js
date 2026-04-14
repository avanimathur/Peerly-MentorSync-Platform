const router = require('express').Router();
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Send request — only mentees can send mentorship requests
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentee') {
      return res.status(403).json({ message: 'Only mentees can send mentorship requests' });
    }
    const { to, message, goals } = req.body;
    // Verify target is a mentor
    const target = await User.findById(to);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role !== 'mentor') {
      return res.status(400).json({ message: 'You can only send requests to mentors' });
    }
    const existing = await Request.findOne({ from: req.user._id, to, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'Request already sent to this mentor' });

    const request = await Request.create({ from: req.user._id, to, message, goals });
    await Notification.create({
      user: to, type: 'mentor_request',
      title: 'New Mentorship Request',
      message: `${req.user.name} wants you as their mentor`,
      link: 'requests.html'
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sent requests — mentees only (they are the ones who send)
router.get('/sent', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentee') {
      return res.status(403).json({ message: 'Only mentees have sent requests' });
    }
    const requests = await Request.find({ from: req.user._id })
      .populate('to', 'name avatar department role reputationScore isVerified');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Incoming requests — mentors only (they are the ones who receive)
router.get('/incoming', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: 'Only mentors receive requests' });
    }
    const requests = await Request.find({ to: req.user._id })
      .populate('from', 'name avatar department year bio skills interests');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept / reject — only the mentor who received it
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: 'Only mentors can respond to requests' });
    }
    const { status } = req.body;
    const request = await Request.findById(req.params.id).populate('from', 'name');
    if (!request) return res.status(404).json({ message: 'Not found' });
    if (!request.to.equals(req.user._id)) return res.status(403).json({ message: 'Not your request' });
    request.status = status;
    await request.save();
    if (status === 'accepted') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { menteeCount: 1 } });
      await Notification.create({
        user: request.from._id, type: 'request_accepted',
        title: 'Request Accepted! 🎉',
        message: `${req.user.name} accepted your mentorship request`,
        link: 'messages.html'
      });
    } else {
      await Notification.create({
        user: request.from._id, type: 'request_rejected',
        title: 'Request Update',
        message: `${req.user.name} has declined your request`,
        link: 'mentors.html'
      });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
