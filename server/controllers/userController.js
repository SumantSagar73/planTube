const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Schedule = require('../models/Schedule');
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const Activity = require('../models/Activity');
const UserPlaylist = require('../models/UserPlaylist');

/**
 * Returns an array of YYYY-MM-DD strings from Monday of the current ISO week up to today (inclusive).
 */
const getCurrentWeekDatesUpToNow = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const dates = [];
    const cursor = new Date(monday);
    while (cursor <= now) {
        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, '0');
        const dd = String(cursor.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
        cursor.setDate(cursor.getDate() + 1);
    }
    return { dates, monday };
};

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

exports.exportMyData = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user, userPlaylists, schedules, activities] = await Promise.all([
            User.findById(userId).select('-password').lean(),
            UserPlaylist.find({ userId }).populate({ path: 'playlistId', populate: { path: 'videos' } }).lean(),
            Schedule.find({ userId }).lean(),
            Activity.find({ userId }).lean()
        ]);

        if (!user) return res.status(404).json({ msg: 'User not found' });

        const exportPayload = {
            exportedAt: new Date().toISOString(),
            profile: user,
            playlists: userPlaylists,
            schedules,
            activities
        };

        res.setHeader('Content-Disposition', 'attachment; filename="plantube-data-export.json"');
        res.setHeader('Content-Type', 'application/json');
        res.json(exportPayload);
    } catch (err) {
        console.error('ExportMyData Error:', err);
        res.status(500).json({ msg: 'Server error' });
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

/**
 * PUT /api/users/weekly-goal
 * Update the user's weekly learning goal.
 */
exports.updateWeeklyGoal = async (req, res) => {
    try {
        const { type, target } = req.body;

        if (!['videos', 'hours'].includes(type)) {
            return res.status(400).json({ msg: "type must be 'videos' or 'hours'" });
        }

        const parsedTarget = Number(target);
        if (!Number.isFinite(parsedTarget) || parsedTarget < 1 || parsedTarget > 168) {
            return res.status(400).json({ msg: 'target must be a number between 1 and 168' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.weeklyGoal = { type, target: parsedTarget };
        await user.save();

        res.json({ msg: 'Weekly goal updated', weeklyGoal: user.weeklyGoal });
    } catch (err) {
        console.error('updateWeeklyGoal Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

/**
 * GET /api/users/weekly-progress
 * Returns progress toward the user's weekly goal.
 */
exports.getWeeklyProgress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('weeklyGoal');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const goal = user.weeklyGoal || { type: 'hours', target: 5 };
        const { dates, monday } = getCurrentWeekDatesUpToNow();

        let current = 0;

        if (goal.type === 'hours') {
            // Sum Activity seconds for this week and convert to hours
            const activities = await Activity.find({
                userId: req.user.id,
                date: { $in: dates }
            }).select('seconds');

            const totalSeconds = activities.reduce((sum, a) => sum + (a.seconds || 0), 0);
            current = parseFloat((totalSeconds / 3600).toFixed(2));
        } else {
            // Count completed Schedule docs updated this week
            const weekEnd = new Date();
            const completed = await Schedule.countDocuments({
                userId: req.user.id,
                status: 'completed',
                updatedAt: { $gte: monday, $lte: weekEnd }
            });
            current = completed;
        }

        const percent = Math.min(100, Math.round((current / goal.target) * 100));

        res.json({ goal, current, percent });
    } catch (err) {
        console.error('getWeeklyProgress Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

