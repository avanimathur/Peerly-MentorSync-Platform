const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['mentor', 'mentee', 'admin'], default: 'mentee' },
  avatar: { type: String, default: '' },
  department: { type: String, default: '' },
  year: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  interests: [{ type: String }],
  linkedIn: { type: String, default: '' },
  github: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },

  // Availability
  availability: [{
    day: { type: String },
    startTime: { type: String },
    endTime: { type: String }
  }],
  timezone: { type: String, default: 'UTC' },

  // Gamification
  badges: [{ name: String, icon: String, earnedAt: Date }],
  streakCount: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  totalSessionHours: { type: Number, default: 0 },
  reputationScore: { type: Number, default: 0 },

  // Stats
  totalSessions: { type: Number, default: 0 },
  totalGoalsCompleted: { type: Number, default: 0 },
  savedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  menteeCount: { type: Number, default: 0 },

  // Notifications preferences
  notifPrefs: {
    email: { type: Boolean, default: true },
    sessionReminder: { type: Boolean, default: true },
    messageAlerts: { type: Boolean, default: true },
    requestAlerts: { type: Boolean, default: true }
  },

  // Privacy
  profileVisibility: { type: String, enum: ['public', 'mentees', 'private'], default: 'public' },

  onboardingComplete: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (pass) {
  return bcrypt.compare(pass, this.password);
};

module.exports = mongoose.model('User', userSchema);
