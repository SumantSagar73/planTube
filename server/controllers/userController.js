const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Schedule = require('../models/Schedule');
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const Activity = require('../models/Activity');

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
        const { dailyStudyTime, videosPerDay, maxWatchTimePerDay, timezone } = req.body;

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
        if (typeof timezone === 'string') {
            user.preferences.timezone = timezone.trim();
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
        const { name, username, themeColor, motto, isPublic } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (username && username !== user.username) {
            const existing = await User.findOne({ username });
            if (existing) return res.status(400).json({ msg: 'Username already taken' });
            user.username = username;
        }

        if (name) user.name = name;
        if (themeColor) user.themeColor = themeColor;
        if (typeof motto === 'string') user.motto = motto;
        if (typeof isPublic === 'boolean') user.isPublic = isPublic;

        await user.save();
        res.json({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            themeColor: user.themeColor,
            motto: user.motto,
            isPublic: user.isPublic
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ msg: 'Both fields are required' });
        if (newPassword.length < 6) return res.status(400).json({ msg: 'New password must be at least 6 characters' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });

        user.password = newPassword; // pre-save hook will hash it
        await user.save();
        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.requestWipe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.wipeRequested = true;
        user.wipeRequestedAt = new Date();
        await user.save();

        res.json({ msg: 'Account deletion requested successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

