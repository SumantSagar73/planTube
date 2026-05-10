const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const notificationController = require('./notificationController');

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AchievementService = require('../services/achievementService');

exports.updateActivity = async (req, res) => {
    const { seconds, date } = req.body;
    const userId = req.user.id;
    const activityDate = date || getLocalDateString();
    const numericSeconds = Math.max(0, Math.floor(Number(seconds) || 0));

    try {
        let activity = await Activity.findOne({ userId, date: activityDate });

        if (activity) {
            activity.seconds += numericSeconds;
            await activity.save();
        } else {
            activity = new Activity({ userId, seconds: numericSeconds, date: activityDate });
            await activity.save();
        }

        const user = await User.findById(userId);
        if (user) {
            // Update XP at 10 XP per minute (standardized)
            const xpGained = (numericSeconds / 60) * 10;
            user.xp = Math.round((Number(user.xp || 0) + xpGained) * 100) / 100;
            
            // Update total focus time
            user.totalFocusMinutes = (user.totalFocusMinutes || 0) + (numericSeconds / 60);

            // Level formula: Level = floor(sqrt(xp / 100)) + 1
            const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
            user.level = newLevel;
            
            await user.save();

            // Check for achievements automatically
            await AchievementService.checkAchievements(user._id, 'xp');
            await AchievementService.checkAchievements(user._id, 'focus_minutes');
            
            // Special checks for 'Legacy' style badges (time-based)
            const hour = new Date().getHours();
            if (hour < 8) await AchievementService.checkAchievements(user._id, 'legacy', { value: 1 }); // Early Bird
            if (numericSeconds >= 7200) await AchievementService.checkAchievements(user._id, 'legacy', { value: 1 }); // Focus Master
        }

        res.json(activity);
    } catch (err) {
        console.error('updateActivity error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getHeatmapData = async (req, res) => {
    try {
        // Get activity for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const startDate = sixMonthsAgo.toISOString().split('T')[0];

        const activities = await Activity.find({
            userId: req.user.id,
            date: { $gte: startDate }
        }).sort({ date: 1 });

        res.json(activities);
    } catch (err) {
        console.error('Error fetching heatmap data:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getLibraryStats = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        
        const totalSchedules = await Schedule.countDocuments({ userId: req.user.id });
        const completedSchedules = await Schedule.countDocuments({
            userId: req.user.id,
            status: 'completed'
        });

        const activitySummary = await Activity.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: null, totalSeconds: { $sum: "$seconds" } } }
        ]);

        let user = await User.findById(req.user.id);
        
        // Auto-award starter achievements if not present
        if (user && user.achievements.length === 0) {
            await AchievementService.checkAchievements(user._id, 'legacy', { value: 1 });
            // Re-fetch user to get updated achievements
            user = await User.findById(req.user.id);
        }

        res.json({
            totalPlaylists: totalSchedules,
            completedVideos: completedSchedules,
            totalFocusHours: activitySummary.length > 0 ? (activitySummary[0].totalSeconds / 3600).toFixed(1) : 0,
            xp: user?.xp || 0,
            level: user?.level || 1,
            badges: user?.badges || [],
            achievements: user?.achievements || [],
            nextLevelXp: 100 * Math.pow(user?.level || 1, 2),
            motto: user?.motto || 'Keep focusing, keep growing.',
            themeColor: user?.themeColor || '#6366f1',
            bestStreak: user?.bestStreak || 0,
            isPublic: user?.isPublic || false
        });

    } catch (err) {
        console.error('Error fetching library stats:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};


