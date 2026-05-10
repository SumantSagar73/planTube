const Achievement = require('../models/Achievement');
const User = require('../models/User');

// A default catalog of achievements (about 25 items). Keys must be stable.
const DEFAULT_ACHIEVEMENTS = [
  // Legacy / Core Badges
  { key: 'legacy_first_step', name: 'First Step', description: 'Created your profile', icon: '🌱', criteria: { type: 'legacy', value: 1 }, xpReward: 0 },
  { key: 'legacy_pioneer', name: 'Pioneer', description: 'Joined the Social Hub', icon: '🚀', criteria: { type: 'legacy', value: 1 }, xpReward: 0 },
  { key: 'legacy_early_bird', name: 'Early Bird', description: 'Study before 8 AM', icon: '🌅', criteria: { type: 'legacy', value: 1 }, xpReward: 0 },
  { key: 'legacy_focus_master', name: 'Focus Master', description: '2h Single Session', icon: '🧠', criteria: { type: 'legacy', value: 1 }, xpReward: 0 },
  { key: 'legacy_midnight_oil', name: 'Midnight Oil', description: 'Study after 10 PM', icon: '🌙', criteria: { type: 'legacy', value: 1 }, xpReward: 0 },
  { key: 'legacy_quick_learner', name: 'Quick Learner', description: '3 Videos in 1 Day', icon: '⚡', criteria: { type: 'legacy', value: 1 }, xpReward: 0 },

  // XP Milestones
  { key: 'xp_100', name: 'Getting Started', description: 'Earn 100 XP', icon: '🏅', criteria: { type: 'xp', value: 100 }, xpReward: 10 },
  { key: 'xp_250', name: 'On Your Way', description: 'Earn 250 XP', icon: '🎯', criteria: { type: 'xp', value: 250 }, xpReward: 25 },
  { key: 'xp_500', name: 'Momentum', description: 'Earn 500 XP', icon: '🚀', criteria: { type: 'xp', value: 500 }, xpReward: 50 },
  { key: 'xp_1000', name: 'Milestone', description: 'Earn 1,000 XP', icon: '🏆', criteria: { type: 'xp', value: 1000 }, xpReward: 100 },
  { key: 'xp_2500', name: 'Veteran', description: 'Earn 2,500 XP', icon: '🌟', criteria: { type: 'xp', value: 2500 }, xpReward: 200 },
  { key: 'xp_5000', name: 'Expert', description: 'Earn 5,000 XP', icon: '💎', criteria: { type: 'xp', value: 5000 }, xpReward: 400 },
  { key: 'xp_10000', name: 'Legend', description: 'Earn 10,000 XP', icon: '👑', criteria: { type: 'xp', value: 10000 }, xpReward: 1000 },
  { key: 'xp_50000', name: 'Mythic', description: 'Earn 50,000 XP', icon: '🌌', criteria: { type: 'xp', value: 50000 }, xpReward: 5000 },

  // Focus Time Milestones
  { key: 'focus_1hour', name: 'First Hour', description: 'Accumulate 1 hour of focus time', icon: '⏱️', criteria: { type: 'focus_minutes', value: 60 }, xpReward: 5 },
  { key: 'focus_10hours', name: '10 Hours', description: 'Accumulate 10 hours of focus time', icon: '🔥', criteria: { type: 'focus_minutes', value: 600 }, xpReward: 50 },
  { key: 'focus_50hours', name: '50 Hours', description: '50 hours focused', icon: '💪', criteria: { type: 'focus_minutes', value: 3000 }, xpReward: 200 },
  { key: 'focus_100hours', name: 'Dedicated', description: '100 hours focused', icon: '🧠', criteria: { type: 'focus_minutes', value: 6000 }, xpReward: 500 },
  { key: 'focus_500hours', name: 'Mastery', description: '500 hours focused', icon: '🧘', criteria: { type: 'focus_minutes', value: 30000 }, xpReward: 2500 },
  { key: 'focus_1000hours', name: 'Grandmaster', description: '1,000 hours focused', icon: '👁️', criteria: { type: 'focus_minutes', value: 60000 }, xpReward: 5000 },

  // Streak Milestones
  { key: 'streak_3', name: '3-Day Streak', description: 'Focus 3 days in a row', icon: '🔁', criteria: { type: 'streak_days', value: 3 }, xpReward: 10 },
  { key: 'streak_7', name: 'Streak King', description: 'Focus 7 days in a row', icon: '🔥', criteria: { type: 'streak_days', value: 7 }, xpReward: 30 },
  { key: 'streak_14', name: 'Fortnight', description: '14-day streak', icon: '🏅', criteria: { type: 'streak_days', value: 14 }, xpReward: 75 },
  { key: 'streak_30', name: 'Monthly Streak', description: '30-day streak', icon: '🏆', criteria: { type: 'streak_days', value: 30 }, xpReward: 200 },
  { key: 'streak_50', name: 'Half-Century', description: '50-day streak', icon: '🌋', criteria: { type: 'streak_days', value: 50 }, xpReward: 400 },
  { key: 'streak_66', name: 'Habit Former', description: '66-day streak (Science says it takes 66 days to build a habit)', icon: '🧬', criteria: { type: 'streak_days', value: 66 }, xpReward: 600 },
  { key: 'streak_100', name: 'Centurion', description: '100-day streak', icon: '💯', criteria: { type: 'streak_days', value: 100 }, xpReward: 1000 },
  { key: 'streak_365', name: 'Unstoppable', description: '365-day streak (A full year!)', icon: '🌞', criteria: { type: 'streak_days', value: 365 }, xpReward: 5000 },

  // Playlist Creation
  { key: 'playlist_create_1', name: 'First Playlist', description: 'Create your first playlist', icon: '📁', criteria: { type: 'playlists_created', value: 1 }, xpReward: 10 },
  { key: 'playlist_create_5', name: 'Playlist Pro', description: 'Create 5 playlists', icon: '🗂️', criteria: { type: 'playlists_created', value: 5 }, xpReward: 35 },
  { key: 'playlist_create_10', name: 'Library Builder', description: 'Create 10 playlists', icon: '📚', criteria: { type: 'playlists_created', value: 10 }, xpReward: 100 },
  { key: 'playlist_create_50', name: 'Archivist', description: 'Create 50 playlists', icon: '🏛️', criteria: { type: 'playlists_created', value: 50 }, xpReward: 500 },

  // Playlist Following
  { key: 'playlist_follow_1', name: 'First Follow', description: 'Follow your first playlist', icon: '⭐', criteria: { type: 'playlists_followed', value: 1 }, xpReward: 5 },

  // Feedback
  { key: 'feedback_1', name: 'First Feedback', description: 'Submit your first feedback', icon: '✉️', criteria: { type: 'feedbacks_submitted', value: 1 }, xpReward: 5 },
  { key: 'feedback_10', name: 'Active Contributor', description: 'Submit 10 feedback items', icon: '💬', criteria: { type: 'feedbacks_submitted', value: 10 }, xpReward: 25 },

  // Social / Community
  { key: 'groups_1', name: 'Group Starter', description: 'Create a group', icon: '👥', criteria: { type: 'groups_created', value: 1 }, xpReward: 20 },
  { key: 'followers_10', name: 'Popular', description: 'Gain 10 followers', icon: '📣', criteria: { type: 'followers', value: 10 }, xpReward: 30 },
  { key: 'followers_50', name: 'Influencer', description: 'Gain 50 followers', icon: '🎙️', criteria: { type: 'followers', value: 50 }, xpReward: 150 },
  { key: 'followers_100', name: 'Thought Leader', description: 'Gain 100 followers', icon: '🌍', criteria: { type: 'followers', value: 100 }, xpReward: 400 },
  { key: 'social_1', name: 'First Friend', description: 'Add a friend', icon: '🤝', criteria: { type: 'friends_added', value: 1 }, xpReward: 5 },

  // Sessions
  { key: 'session_5', name: 'Five Sessions', description: 'Complete 5 focused sessions', icon: '🎧', criteria: { type: 'sessions_completed', value: 5 }, xpReward: 15 },
  { key: 'session_50', name: 'Session Veteran', description: 'Complete 50 sessions', icon: '🏅', criteria: { type: 'sessions_completed', value: 50 }, xpReward: 150 },
  { key: 'session_100', name: 'Century Club', description: 'Complete 100 sessions', icon: '🎰', criteria: { type: 'sessions_completed', value: 100 }, xpReward: 400 },
  { key: 'session_500', name: 'Marathoner', description: 'Complete 500 sessions', icon: '🏃', criteria: { type: 'sessions_completed', value: 500 }, xpReward: 2000 },
  { key: 'session_1000', name: 'Legendary', description: 'Complete 1,000 sessions', icon: '🦄', criteria: { type: 'sessions_completed', value: 1000 }, xpReward: 5000 },

  // AI & Smart Features
  { key: 'ai_first_summary', name: 'AI Explorer', description: 'Generate your first AI video summary', icon: '🤖', criteria: { type: 'ai_summary', value: 1 }, xpReward: 20 },
  { key: 'ai_chat_10', name: 'Curious Mind', description: 'Ask the AI 10 questions', icon: '💬', criteria: { type: 'ai_chat', value: 10 }, xpReward: 50 },
  { key: 'ai_brainstorm_5', name: 'Strategist', description: 'Use AI Brainstorming 5 times', icon: '🧠', criteria: { type: 'ai_brainstorm', value: 5 }, xpReward: 100 },

  // Learning Depth
  { key: 'notes_10', name: 'Note Taker', description: 'Write 10 timestamped notes', icon: '📝', criteria: { type: 'notes_taken', value: 10 }, xpReward: 30 },
  { key: 'notes_50', name: 'Scholar', description: 'Write 50 timestamped notes', icon: '📜', criteria: { type: 'notes_taken', value: 50 }, xpReward: 150 },
  { key: 'focus_long_60', name: 'Deep Dive', description: 'Complete a video longer than 60 minutes', icon: '🌊', criteria: { type: 'long_video', value: 60 }, xpReward: 100 },

  // Personalization
  { key: 'theme_change', name: 'Interior Designer', description: 'Change your profile theme color', icon: '🎨', criteria: { type: 'theme_customization', value: 1 }, xpReward: 10 },

  // Mastery
  { key: 'mastery_100', name: 'Perfect Score', description: 'Complete 100% of a playlist', icon: '💯', criteria: { type: 'playlist_completion', value: 100 }, xpReward: 500 }
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

exports.createAchievement = async (req, res) => {
  try {
    const data = req.body;
    const existing = await Achievement.findOne({ key: data.key });
    if (existing) return res.status(400).json({ error: 'Achievement with this key already exists.' });
    
    const achievement = new Achievement(data);
    await achievement.save();
    return res.json(achievement);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const achievement = await Achievement.findByIdAndUpdate(id, data, { new: true });
    if (!achievement) return res.status(404).json({ error: 'Achievement not found.' });
    return res.json(achievement);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const achievement = await Achievement.findByIdAndDelete(id);
    if (!achievement) return res.status(404).json({ error: 'Achievement not found.' });
    return res.json({ success: true, message: 'Achievement deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Export the default catalog for scripts
exports.DEFAULT_ACHIEVEMENTS = DEFAULT_ACHIEVEMENTS;

