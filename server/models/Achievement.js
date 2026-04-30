const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  iconType: { type: String, enum: ['emoji', 'image'], default: 'emoji' },
  category: { type: String, default: 'Uncategorized' },
  criteria: { type: mongoose.Schema.Types.Mixed, default: {} },
  xpReward: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
