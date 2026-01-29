const User = require('../models/User');

exports.getPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('preferences');
        res.json(user.preferences || {});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const { dailyStudyTime, videosPerDay, maxWatchTimePerDay } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update preferences
        if (dailyStudyTime) {
            user.preferences.dailyStudyTime = dailyStudyTime;
        }
        if (videosPerDay !== undefined) {
            user.preferences.videosPerDay = videosPerDay;
        }
        if (maxWatchTimePerDay !== undefined) {
            user.preferences.maxWatchTimePerDay = maxWatchTimePerDay;
        }

        await user.save();
        res.json({ msg: 'Preferences updated', preferences: user.preferences });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, username } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (username && username !== user.username) {
            const existing = await User.findOne({ username });
            if (existing) return res.status(400).json({ msg: 'Username already taken' });
            user.username = username;
        }

        if (name) user.name = name;

        await user.save();
        res.json({ id: user._id, name: user.name, username: user.username, email: user.email });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
