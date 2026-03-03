const Activity = require('../models/Activity');
const Schedule = require('../models/Schedule');

exports.updateActivity = async (req, res) => {
    try {
        const { seconds } = req.body;
        const date = new Date().toISOString().split('T')[0];

        // Update or create daily activity
        const activity = await Activity.findOneAndUpdate(
            { userId: req.user.id, date },
            { $inc: { seconds: seconds } },
            { upsert: true, new: true }
        );

        res.json(activity);
    } catch (err) {
        console.error('Error updating activity:', err);
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
        const totalSchedules = await Schedule.countDocuments({ userId: req.user.id });
        const completedSchedules = await Schedule.countDocuments({
            userId: req.user.id,
            status: 'completed'
        });

        const activitySummary = await Activity.aggregate([
            { $match: { userId: new require('mongoose').Types.ObjectId(req.user.id) } },
            { $group: { _id: null, totalSeconds: { $sum: "$seconds" } } }
        ]);

        res.json({
            totalPlaylists: totalSchedules, // This might need refinement if you want unique playlists
            completedVideos: completedSchedules,
            totalFocusHours: activitySummary.length > 0 ? (activitySummary[0].totalSeconds / 3600).toFixed(1) : 0
        });
    } catch (err) {
        console.error('Error fetching library stats:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};
