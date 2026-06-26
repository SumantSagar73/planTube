const SystemSettings = require('../models/SystemSettings');
const jwt = require('jsonwebtoken');

// Get feature flags — merges global flags with per-user overrides if user is authenticated
exports.getFeatureFlags = async (req, res) => {
    try {
        const settings = await SystemSettings.find({ category: { $in: ['features', 'maintenance'] } });
        const flags = {};
        settings.forEach(s => { flags[s.key] = s.value; });

        // If request carries a valid JWT, merge the user's per-feature overrides on top
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const User = require('../models/User');
                const user = await User.findById(decoded.id).select('featureOverrides');
                if (user?.featureOverrides?.size > 0) {
                    user.featureOverrides.forEach((value, key) => {
                        flags[key] = value;
                    });
                }
            } catch (_) { /* invalid token — just return global flags */ }
        }

        res.json(flags);
    } catch (err) {
        console.error('Get Feature Flags Error:', err.message);
        res.status(500).send('Server error');
    }
};

// Admin: Get all settings
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.find().sort({ category: 1, key: 1 });
        res.json(settings);
    } catch (err) {
        console.error('Get All Settings Error:', err.message);
        res.status(500).send('Server error');
    }
};

// Admin: Update a setting
exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        const result = await SystemSettings.updateMany({ key }, { $set: { value } });
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ msg: 'Setting not found' });
        }
        
        // Fetch the updated setting to return
        const setting = await SystemSettings.findOne({ key });
        
        res.json(setting);
    } catch (err) {
        console.error('Update Setting Error:', err.message);
        res.status(500).send('Server error');
    }
};

// Initialize default settings if they don't exist
exports.initializeSettings = async () => {
    const defaults = [
        // AI features
        { key: 'feat_ai_brainstorm', value: true, category: 'features', description: 'Enable AI Brainstorming roadmap generation' },
        { key: 'feat_ai_chat', value: true, category: 'features', description: 'Enable Interactive AI Tutor Chat in Focus Mode' },
        { key: 'feat_ai_questions', value: true, category: 'features', description: 'Enable AI-generated quiz questions for videos' },
        { key: 'feat_ai_flashcards', value: true, category: 'features', description: 'Enable AI-generated flashcards for spaced repetition' },
        // Focus & study
        { key: 'feat_notes', value: true, category: 'features', description: 'Enable video notes and timestamp linking' },
        { key: 'feat_heatmap', value: true, category: 'features', description: 'Enable FocusPulse activity heatmap on dashboard' },
        { key: 'feat_lock_mode', value: true, category: 'features', description: 'Enable distraction-free lock/focus mode' },
        { key: 'feat_spaced_repetition', value: true, category: 'features', description: 'Enable SM-2 spaced repetition scheduling' },
        { key: 'feat_pomodoro', value: true, category: 'features', description: 'Enable Pomodoro timer in Focus Mode' },
        // Social & collaboration
        { key: 'feat_watch_party', value: true, category: 'features', description: 'Enable synchronized Watch Party for groups' },
        { key: 'feat_groups', value: true, category: 'features', description: 'Enable Study Groups creation and joining' },
        { key: 'feat_social', value: true, category: 'features', description: 'Enable social features: friend requests, follows' },
        { key: 'feat_public_profiles', value: true, category: 'features', description: 'Allow users to make their profiles public' },
        // Gamification
        { key: 'feat_achievements', value: true, category: 'features', description: 'Enable achievement badges and XP rewards' },
        { key: 'feat_leaderboard', value: true, category: 'features', description: 'Enable the global leaderboard rankings' },
        { key: 'feat_streaks', value: true, category: 'features', description: 'Enable daily streak tracking and rewards' },
        // Content
        { key: 'feat_custom_playlists', value: true, category: 'features', description: 'Enable user-created custom playlists' },
        { key: 'feat_playlist_sync', value: true, category: 'features', description: 'Enable re-syncing playlists from YouTube' },
        // Maintenance
        { key: 'maintenance_mode', value: false, category: 'maintenance', description: 'Put the platform in maintenance mode for all non-admin users' }
    ];

    for (const item of defaults) {
        try {
            await SystemSettings.findOneAndUpdate(
                { key: item.key },
                { $setOnInsert: item },
                { upsert: true, new: true, runValidators: true }
            );
        } catch (err) {
            console.error(`Error initializing setting ${item.key}:`, err.message);
        }
    }
    console.log('System settings initialized.');
};
