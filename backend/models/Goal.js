const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'general' },
  dueDate: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  milestones: [{
    text: { type: String },
    done: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
