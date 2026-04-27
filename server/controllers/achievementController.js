const Achievement = require('../models/Achievement');
const User = require('../models/User');

// A default catalog of achievements (about 25 items). Keys must be stable.
const DEFAULT_ACHIEVEMENTS = [
  { key: 'xp_100', name: 'Getting Started', description: 'Earn 100 XP', icon: '🏅', criteria: { type: 'xp', value: 100 }, xpReward: 10 },
  { key: 'xp_250', name: 'On Your Way', description: 'Earn 250 XP', icon: '🎯', criteria: { type: 'xp', value: 250 }, xpReward: 25 },
  { key: 'xp_500', name: 'Momentum', description: 'Earn 500 XP', icon: '🚀', criteria: { type: 'xp', value: 500 }, xpReward: 50 },
  { key: 'xp_1000', name: 'Milestone', description: 'Earn 1,000 XP', icon: '🏆', criteria: { type: 'xp', value: 1000 }, xpReward: 100 },
  { key: 'xp_2500', name: 'Veteran', description: 'Earn 2,500 XP', icon: '🌟', criteria: { type: 'xp', value: 2500 }, xpReward: 200 },

  { key: 'focus_1hour', name: 'First Hour', description: 'Accumulate 1 hour of focus time', icon: '⏱️', criteria: { type: 'focus_minutes', value: 60 }, xpReward: 5 },
  { key: 'focus_10hours', name: '10 Hours', description: 'Accumulate 10 hours of focus time', icon: '🔥', criteria: { type: 'focus_minutes', value: 600 }, xpReward: 50 },
  { key: 'focus_50hours', name: '50 Hours', description: '50 hours focused', icon: '💪', criteria: { type: 'focus_minutes', value: 3000 }, xpReward: 200 },

  { key: 'streak_3', name: '3-Day Streak', description: 'Focus 3 days in a row', icon: '🔁', criteria: { type: 'streak_days', value: 3 }, xpReward: 10 },
  { key: 'streak_7', name: '7-Day Streak', description: 'Focus 7 days in a row', icon: '🔥', criteria: { type: 'streak_days', value: 7 }, xpReward: 30 },
  { key: 'streak_14', name: 'Fortnight', description: '14-day streak', icon: '🏅', criteria: { type: 'streak_days', value: 14 }, xpReward: 75 },
  { key: 'streak_30', name: 'Monthly Streak', description: '30-day streak', icon: '🏆', criteria: { type: 'streak_days', value: 30 }, xpReward: 200 },

  { key: 'playlist_create_1', name: 'First Playlist', description: 'Create your first playlist', icon: '📁', criteria: { type: 'playlists_created', value: 1 }, xpReward: 10 },
  { key: 'playlist_create_5', name: 'Curator', description: 'Create 5 playlists', icon: '🗂️', criteria: { type: 'playlists_created', value: 5 }, xpReward: 35 },

  { key: 'playlist_follow_1', name: 'First Follow', description: 'Follow your first playlist', icon: '⭐', criteria: { type: 'playlists_followed', value: 1 }, xpReward: 5 },

  { key: 'feedback_1', name: 'First Feedback', description: 'Submit your first feedback', icon: '✉️', criteria: { type: 'feedbacks_submitted', value: 1 }, xpReward: 5 },
  { key: 'feedback_10', name: 'Active Contributor', description: 'Submit 10 feedback items', icon: '💬', criteria: { type: 'feedbacks_submitted', value: 10 }, xpReward: 25 },

  { key: 'groups_1', name: 'Group Starter', description: 'Create a group', icon: '👥', criteria: { type: 'groups_created', value: 1 }, xpReward: 20 },

  { key: 'followers_10', name: 'Popular', description: 'Gain 10 followers', icon: '📣', criteria: { type: 'followers', value: 10 }, xpReward: 30 },

  { key: 'session_5', name: 'Five Sessions', description: 'Complete 5 focused sessions', icon: '🎧', criteria: { type: 'sessions_completed', value: 5 }, xpReward: 15 },
  { key: 'session_50', name: 'Session Veteran', description: 'Complete 50 sessions', icon: '🏅', criteria: { type: 'sessions_completed', value: 50 }, xpReward: 150 },

  { key: 'social_1', name: 'First Friend', description: 'Add a friend', icon: '🤝', criteria: { type: 'friends_added', value: 1 }, xpReward: 5 }
];

exports.seedDefaultAchievements = async (req, res) => {
  try {
    const created = [];
    for (const a of DEFAULT_ACHIEVEMENTS) {
      const exists = await Achievement.findOne({ key: a.key });
      if (!exists) {
        const doc = await Achievement.create(a);
        created.push(doc);
      }
    }
    return res.json({ createdCount: created.length, created });
  } catch (err) {
    console.error('seedDefaultAchievements error:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.listAdminAchievements = async (req, res) => {
  try {
    const items = await Achievement.find().sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listPublicAchievements = async (req, res) => {
  try {
    const items = await Achievement.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Admin: award an achievement to a user manually by key
exports.awardAchievementToUser = async (req, res) => {
  try {
    const { key } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const achievement = await Achievement.findOne({ key });
    if (!achievement) return res.status(404).json({ error: 'Achievement not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.achievements = user.achievements || [];
    if (user.achievements.find(a => a.key === key)) {
      return res.status(409).json({ error: 'User already has this achievement' });
    }

    user.achievements.push({ key: achievement.key, name: achievement.name, icon: achievement.icon, description: achievement.description, unlockedAt: new Date() });
    if (achievement.xpReward) {
      user.xp = (user.xp || 0) + achievement.xpReward;
    }
    await user.save();

    return res.json({ success: true, achievement: { key: achievement.key, name: achievement.name } });
  } catch (err) {
    console.error('awardAchievementToUser error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// Export the default catalog for scripts
exports.DEFAULT_ACHIEVEMENTS = DEFAULT_ACHIEVEMENTS;

