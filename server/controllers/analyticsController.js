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

const checkAndAwardBadges = async (user, activityData) => {
    const badges = user.badges || [];
    const newBadges = [];

    const hasBadge = (name) => badges.some(b => b.name === name);

    // 1. Focus Master (2h single session = 7200 seconds)
    if (activityData.seconds >= 7200 && !hasBadge('Focus Master')) {
        newBadges.push({
            name: 'Focus Master',
            icon: '🧠',
            description: 'Completed a single 2-hour focus session.',
            unlockedAt: new Date()
        });
    }

    // 2. Early Bird (Study before 8 AM)
    const hour = new Date().getHours();
    if (hour < 8 && !hasBadge('Early Bird')) {
        newBadges.push({
            name: 'Early Bird',
            icon: '🌅',
            description: 'Started a focus session before 8 AM.',
            unlockedAt: new Date()
        });
    }

    // 3. Streak King (7 Day Streak) - We'll check this against user.bestStreak
    if (user.bestStreak >= 7 && !hasBadge('Streak King')) {
        newBadges.push({
            name: 'Streak King',
            icon: '🔥',
            description: 'Maintained a focus streak for 7 consecutive days.',
            unlockedAt: new Date()
        });
    }

    if (newBadges.length > 0) {
        user.badges = [...badges, ...newBadges];
        return newBadges;
    }
    return [];
};

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

        // Update XP at 10 XP per minute, preserving progress from short pulse updates.
        const xpGained = Math.round((numericSeconds / 6) * 100) / 100;
        const user = await User.findById(userId);
        if (user) {
            user.xp = Math.round((Number(user.xp || 0) + xpGained) * 100) / 100;
            // Level formula: Level = floor(sqrt(xp) / 5) + 1
            const newLevel = Math.floor(Math.sqrt(user.xp) / 5) + 1;
            user.level = newLevel;
            
            // Check for badges
            const newBadges = await checkAndAwardBadges(user, { seconds: activity.seconds });
            
            await user.save();

            if (newBadges.length > 0) {
                for (const badge of newBadges) {
                    await notificationController.createAchievementNotifications({
                        req,
                        sourceUser: user,
                        badge,
                        link: '/profile'
                    });
                }
            }
        }

        res.json(activity);
    } catch (err) {
        console.error(err);
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
        
        // Auto-award starter badges for existing users
        let updated = false;
        if (!user.badges) user.badges = [];
        const hasBadge = (name) => user.badges.some(b => b.name === name);
        
        if (!hasBadge('First Step')) {
            user.badges.push({ name: 'First Step', icon: '🌱', description: 'Created your PlanTube profile and started your journey.', unlockedAt: new Date() });
            updated = true;
        }
        if (!hasBadge('Pioneer')) {
            user.badges.push({ name: 'Pioneer', icon: '🚀', description: 'Early adopter of the PlanTube Social Hub.', unlockedAt: new Date() });
            updated = true;
        }
        
        if (updated) {
            await user.save();
        }

        res.json({
            totalPlaylists: totalSchedules,
            completedVideos: completedSchedules,
            totalFocusHours: activitySummary.length > 0 ? (activitySummary[0].totalSeconds / 3600).toFixed(1) : 0,
            xp: user?.xp || 0,
            level: user?.level || 1,
            badges: user?.badges || [],
            nextLevelXp: Math.pow((user?.level || 1) * 5, 2),
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


