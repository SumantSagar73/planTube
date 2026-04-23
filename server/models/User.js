const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  motto: {
    type: String,
    default: 'Keep focusing, keep growing.'
  },
  themeColor: {
    type: String,
    default: '#6366f1' // Default primary
  },
  bestStreak: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    icon: String,
    description: String,
    unlockedAt: { type: Date, default: Date.now }
  }],
  wipeRequested: {
    type: Boolean,
    default: false
  },
  wipeRequestedAt: {
    type: Date
  },
  isFrozen: {
    type: Boolean,
    default: false
  },


  preferences: {
    dailyStudyTime: {
      start: { type: String, default: '18:00' },
      end: { type: String, default: '20:00' }
    },
    videosPerDay: { type: Number, default: 3 },
    maxWatchTimePerDay: { type: Number, default: 120 } // minutes
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    icon: String,
    description: String,
    earnedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });


userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
