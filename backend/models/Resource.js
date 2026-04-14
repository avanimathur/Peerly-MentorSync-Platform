const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['link', 'file', 'doc'], default: 'link' },
  url: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  category: { type: String, default: 'general' },
  tags: [{ type: String }],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  department: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
