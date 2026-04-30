require('dotenv').config();
const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');

const PATCH = [
  // Legacy
  { key: 'legacy_first_step', icon: '🌱', category: 'Legacy / Core Badges' },
  { key: 'legacy_pioneer', icon: '🚀', category: 'Legacy / Core Badges' },
  { key: 'legacy_early_bird', icon: '🌅', category: 'Legacy / Core Badges' },
  { key: 'legacy_focus_master', icon: '🧠', category: 'Legacy / Core Badges' },
  { key: 'legacy_midnight_oil', icon: '🌙', category: 'Legacy / Core Badges' },
  { key: 'legacy_quick_learner', icon: '⚡', category: 'Legacy / Core Badges' },
  // XP
  { key: 'xp_100', icon: '🏅', category: 'XP Milestones' },
  { key: 'xp_250', icon: '🎯', category: 'XP Milestones' },
  { key: 'xp_500', icon: '🚀', category: 'XP Milestones' },
  { key: 'xp_1000', icon: '🏆', category: 'XP Milestones' },
  { key: 'xp_2500', icon: '🌟', category: 'XP Milestones' },
  { key: 'xp_5000', icon: '💎', category: 'XP Milestones' },
  { key: 'xp_10000', icon: '👑', category: 'XP Milestones' },
  { key: 'xp_50000', icon: '🌌', category: 'XP Milestones' },
  // Focus
  { key: 'focus_1hour', icon: '⏱️', category: 'Focus Time Milestones' },
  { key: 'focus_10hours', icon: '🔥', category: 'Focus Time Milestones' },
  { key: 'focus_50hours', icon: '💪', category: 'Focus Time Milestones' },
  { key: 'focus_100hours', icon: '🧠', category: 'Focus Time Milestones' },
  { key: 'focus_500hours', icon: '🧘', category: 'Focus Time Milestones' },
  { key: 'focus_1000hours', icon: '👁️', category: 'Focus Time Milestones' },
  // Streaks
  { key: 'streak_3', icon: '🔁', category: 'Streak Milestones' },
  { key: 'streak_7', icon: '🔥', name: 'Streak King', category: 'Streak Milestones' },
  { key: 'streak_14', icon: '🏅', category: 'Streak Milestones' },
  { key: 'streak_30', icon: '🏆', category: 'Streak Milestones' },
  { key: 'streak_50', icon: '🌋', category: 'Streak Milestones' },
  { key: 'streak_66', icon: '🧬', category: 'Streak Milestones' },
  { key: 'streak_100', icon: '💯', category: 'Streak Milestones' },
  { key: 'streak_365', icon: '🌞', category: 'Streak Milestones' },
  // Playlists
  { key: 'playlist_create_1', icon: '📁', category: 'Playlist Creation' },
  { key: 'playlist_create_5', icon: '🗂️', name: 'Playlist Pro', category: 'Playlist Creation' },
  { key: 'playlist_create_10', icon: '📚', category: 'Playlist Creation' },
  { key: 'playlist_create_50', icon: '🏛️', category: 'Playlist Creation' },
  { key: 'playlist_follow_1', icon: '⭐', category: 'Playlist Following' },
  // Feedback
  { key: 'feedback_1', icon: '✉️', category: 'Feedback' },
  { key: 'feedback_10', icon: '💬', category: 'Feedback' },
  // Social
  { key: 'groups_1', icon: '👥', category: 'Social / Community' },
  { key: 'followers_10', icon: '📣', category: 'Social / Community' },
  { key: 'followers_50', icon: '🎙️', category: 'Social / Community' },
  { key: 'followers_100', icon: '🌍', category: 'Social / Community' },
  { key: 'social_1', icon: '🤝', category: 'Social / Community' },
  // Sessions
  { key: 'session_5', icon: '🎧', category: 'Sessions' },
  { key: 'session_50', icon: '🏅', category: 'Sessions' },
  { key: 'session_100', icon: '🎰', category: 'Sessions' },
  { key: 'session_500', icon: '🏃', category: 'Sessions' },
  { key: 'session_1000', icon: '🦄', category: 'Sessions' },
];

async function patch() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to:', uri ? uri.substring(0, 30) + '...' : 'NOT FOUND');
  await mongoose.connect(uri);
  let updated = 0;
  for (const p of PATCH) {
    const update = { category: p.category, iconType: 'emoji', icon: p.icon };
    if (p.name) update.name = p.name;
    const r = await Achievement.updateOne({ key: p.key }, { $set: update });
    if (r.modifiedCount) updated++;
  }
  console.log('Patched', updated, 'achievements with correct icons and categories');
  process.exit(0);
}
patch().catch(e => { console.error(e); process.exit(1); });
