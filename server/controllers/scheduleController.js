const Schedule = require('../models/Schedule');
const Video = require('../models/Video');

exports.createSchedule = async (req, res) => {
    const { videoId, scheduledDate, scheduledTime, status } = req.body;
    try {
        const schedule = new Schedule({
            userId: req.user.id,
            videoId,
            scheduledDate: scheduledDate || null,
            scheduledTime: scheduledTime || null,
            status: status || 'pending'
        });
        await schedule.save();
        res.json(schedule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getTodaySchedules = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const schedules = await Schedule.find({
            userId: req.user.id,
            scheduledDate: {
                $ne: null,
                $gte: today,
                $lt: tomorrow,
            }
        }).populate({
            path: 'videoId',
            populate: { path: 'playlistId' }
        });

        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getUpcomingSchedules = async (req, res) => {
    try {
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const schedules = await Schedule.find({
            userId: req.user.id,
            scheduledDate: { $ne: null, $gte: tomorrow },
            status: 'pending'
        }).populate('videoId').sort('scheduledDate scheduledTime');

        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getMissedSchedules = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const schedules = await Schedule.find({
            userId: req.user.id,
            scheduledDate: { $ne: null, $lt: today },
            status: 'pending'
        }).populate('videoId').sort('scheduledDate scheduledTime');

        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getCompletedSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find({
            userId: req.user.id,
            status: 'completed'
        }).populate('videoId').sort('-updatedAt');

        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const parseDurationToSeconds = (durationStr) => {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
};

const formatSecondsToTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
};

exports.getAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const completedSchedules = await Schedule.find({ userId, status: 'completed' }).populate('videoId');

        // Total Completed Videos
        const totalCompleted = completedSchedules.length;

        // Total Watch Time
        let totalSeconds = 0;
        completedSchedules.forEach(s => {
            if (s.videoId && s.videoId.duration) {
                totalSeconds += parseDurationToSeconds(s.videoId.duration);
            }
        });
        const totalTime = formatSecondsToTime(totalSeconds);

        // Weekly Completed (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyCompleted = completedSchedules.filter(s => new Date(s.updatedAt) >= sevenDaysAgo).length;

        // Current Streak
        // Get all completion dates (just dates, no time)
        const completionDates = completedSchedules
            .map(s => {
                const d = new Date(s.updatedAt);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            })
            .sort((a, b) => b - a); // Sort newest first

        const uniqueDates = [...new Set(completionDates)];

        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        // If nothing today, check yesterday for streak maintenance
        if (uniqueDates[0] !== checkDate.getTime()) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        for (let i = 0; i < uniqueDates.length; i++) {
            if (uniqueDates[i] === checkDate.getTime()) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        res.json({
            totalCompleted,
            totalTime,
            weeklyCompleted,
            streak,
            completionHistory: uniqueDates // Array of timestamps
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateStatus = async (req, res) => {
    const { status } = req.body;
    try {
        let schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });

        if (schedule.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        schedule.status = status;
        await schedule.save();
        res.json(schedule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getProgress = async (req, res) => {
    try {
        const playlistId = req.query.playlistId;
        if (!playlistId) return res.status(400).json({ msg: 'Playlist ID required' });

        const videoIds = await Video.find({ playlistId }).select('_id');
        const videoIdList = videoIds.map(v => v._id);

        const totalVideos = videoIdList.length;
        const completedVideos = await Schedule.countDocuments({
            userId: req.user.id,
            status: 'completed',
            videoId: { $in: videoIdList }
        });

        res.json({
            total: totalVideos,
            completed: completedVideos,
            percent: totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findOne({
            userId: req.user.id,
            videoId: req.params.videoId
        });

        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });

        await Schedule.findByIdAndDelete(schedule._id);
        res.json({ msg: 'Schedule removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getPlaylistSchedules = async (req, res) => {
    try {
        const playlistId = req.params.playlistId;
        const videoIds = await Video.find({ playlistId }).select('_id');
        const videoIdList = videoIds.map(v => v._id);

        const schedules = await Schedule.find({
            userId: req.user.id,
            videoId: { $in: videoIdList }
        });

        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

