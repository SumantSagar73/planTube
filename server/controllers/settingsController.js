const SystemSettings = require('../models/SystemSettings');

// Get all public feature flags
exports.getFeatureFlags = async (req, res) => {
    try {
        const settings = await SystemSettings.find({ category: { $in: ['features', 'maintenance'] } });
        const flags = {};
        settings.forEach(s => {
            flags[s.key] = s.value;
        });
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
        { key: 'feat_ai_brainstorm', value: true, category: 'features', description: 'Enable AI Brainstorming roadmap generation' },
        { key: 'feat_ai_chat', value: true, category: 'features', description: 'Enable Interactive AI Tutor Chat' },
        { key: 'feat_notes', value: true, category: 'features', description: 'Enable video notes and timestamps' },
        { key: 'feat_heatmap', value: true, category: 'features', description: 'Enable FocusPulse Heatmap on dashboard' },
        { key: 'feat_lock_mode', value: true, category: 'features', description: 'Enable VLC-style distraction-free lock mode' },
        { key: 'maintenance_mode', value: false, category: 'maintenance', description: 'Put the platform in maintenance mode' }
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
