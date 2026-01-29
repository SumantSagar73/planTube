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

// Helper function to parse duration string (MM:SS or HH:MM:SS) to minutes
const parseDurationToMinutes = (duration) => {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
        return parts[0] + parts[1] / 60; // MM:SS
    } else if (parts.length === 3) {
        return parts[0] * 60 + parts[1] + parts[2] / 60; // HH:MM:SS
    }
    return 0;
};

exports.autoSchedulePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const User = require('../models/User');
        const Playlist = require('../models/Playlist');

        // Get user preferences
        const user = await User.findById(req.user.id);
        const prefs = user.preferences || {};
        const videosPerDay = prefs.videosPerDay || 3;
        const maxWatchTimePerDay = prefs.maxWatchTimePerDay || 120; // minutes

        // Get all videos in playlist
        const videos = await Video.find({ playlistId }).sort('position');

        // Get already scheduled videos
        const existingSchedules = await Schedule.find({
            userId: req.user.id,
            videoId: { $in: videos.map(v => v._id) }
        });
        const scheduledVideoIds = new Set(existingSchedules.map(s => s.videoId.toString()));

        // Filter unscheduled videos
        const unscheduledVideos = videos.filter(v => !scheduledVideoIds.has(v._id.toString()));

        if (unscheduledVideos.length === 0) {
            return res.json({ msg: 'All videos already scheduled', scheduled: 0 });
        }

        // Start scheduling from tomorrow
        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);

        const schedulesToCreate = [];
        let dailyVideoCount = 0;
        let dailyWatchTime = 0;

        for (const video of unscheduledVideos) {
            const videoDuration = parseDurationToMinutes(video.duration);

            // Check if adding this video exceeds daily limits
            if (dailyVideoCount >= videosPerDay || (dailyWatchTime + videoDuration) > maxWatchTimePerDay) {
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
                dailyVideoCount = 0;
                dailyWatchTime = 0;
            }

            schedulesToCreate.push({
                userId: req.user.id,
                videoId: video._id,
                scheduledDate: new Date(currentDate),
                scheduledTime: prefs.dailyStudyTime?.start || '18:00',
                status: 'pending'
            });

            dailyVideoCount++;
            dailyWatchTime += videoDuration;
        }

        // Bulk insert schedules
        await Schedule.insertMany(schedulesToCreate);

        res.json({
            msg: 'Auto-scheduling complete',
            scheduled: schedulesToCreate.length,
            days: Math.ceil(schedulesToCreate.length / videosPerDay)
        });
    } catch (err) {
        console.error('Auto-schedule error:', err.message);
        res.status(500).json({ msg: 'Auto-schedule failed: ' + err.message });
    }
};

exports.setPlaylistGoal = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { targetDate } = req.body;
        const Playlist = require('../models/Playlist');
        const User = require('../models/User');

        const playlist = await Playlist.findOne({ _id: playlistId, userId: req.user.id });
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        // Set goal
        playlist.goal = {
            targetDate: new Date(targetDate),
            createdAt: new Date()
        };
        await playlist.save();

        // Auto-schedule based on goal
        const videos = await Video.find({ playlistId }).sort('position');
        const existingSchedules = await Schedule.find({
            userId: req.user.id,
            videoId: { $in: videos.map(v => v._id) }
        });
        const scheduledVideoIds = new Set(existingSchedules.map(s => s.videoId.toString()));
        const unscheduledVideos = videos.filter(v => !scheduledVideoIds.has(v._id.toString()));

        if (unscheduledVideos.length === 0) {
            return res.json({ msg: 'Goal set, all videos already scheduled', playlist });
        }

        // Calculate days available
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        const daysAvailable = Math.max(1, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));

        // Calculate videos per day needed
        const videosPerDay = Math.ceil(unscheduledVideos.length / daysAvailable);

        // Get user preferences for time
        const user = await User.findById(req.user.id);
        const startTime = user.preferences?.dailyStudyTime?.start || '18:00';

        // Create schedule
        const schedulesToCreate = [];
        let currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() + 1);
        let dailyCount = 0;

        for (const video of unscheduledVideos) {
            if (dailyCount >= videosPerDay) {
                currentDate.setDate(currentDate.getDate() + 1);
                dailyCount = 0;
            }

            if (currentDate > target) break; // Don't schedule beyond goal date

            schedulesToCreate.push({
                userId: req.user.id,
                videoId: video._id,
                scheduledDate: new Date(currentDate),
                scheduledTime: startTime,
                status: 'pending'
            });

            dailyCount++;
        }

        await Schedule.insertMany(schedulesToCreate);

        res.json({
            msg: 'Goal set and schedule created',
            playlist,
            scheduled: schedulesToCreate.length,
            videosPerDay,
            daysAvailable
        });
    } catch (err) {
        console.error('Set goal error:', err.message);
        res.status(500).json({ msg: 'Failed to set goal: ' + err.message });
    }
};

exports.previewAutoSchedule = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const User = require('../models/User');

        const user = await User.findById(req.user.id);
        const prefs = user.preferences || {};
        const videosPerDay = prefs.videosPerDay || 3;
        const maxWatchTimePerDay = prefs.maxWatchTimePerDay || 120;

        const videos = await Video.find({ playlistId }).sort('position');
        const existingSchedules = await Schedule.find({
            userId: req.user.id,
            videoId: { $in: videos.map(v => v._id) }
        });
        const scheduledVideoIds = new Set(existingSchedules.map(s => s.videoId.toString()));
        const unscheduledVideos = videos.filter(v => !scheduledVideoIds.has(v._id.toString()));

        if (unscheduledVideos.length === 0) {
            return res.json({ canSchedule: false, reason: 'All videos already scheduled', preview: [] });
        }

        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);

        const preview = [];
        let dailyVideoCount = 0;
        let dailyWatchTime = 0;
        let currentDayVideos = [];

        for (const video of unscheduledVideos) {
            const videoDuration = parseDurationToMinutes(video.duration);
            if (dailyVideoCount >= videosPerDay || (dailyWatchTime + videoDuration) > maxWatchTimePerDay) {
                if (currentDayVideos.length > 0) {
                    preview.push({
                        date: new Date(currentDate).toISOString(),
                        videos: currentDayVideos,
                        videoCount: currentDayVideos.length,
                        totalDuration: Math.round(dailyWatchTime)
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
                dailyVideoCount = 0;
                dailyWatchTime = 0;
                currentDayVideos = [];
            }
            currentDayVideos.push({ _id: video._id, title: video.title, duration: video.duration, position: video.position });
            dailyVideoCount++;
            dailyWatchTime += videoDuration;
        }
        if (currentDayVideos.length > 0) {
            preview.push({ date: new Date(currentDate).toISOString(), videos: currentDayVideos, videoCount: currentDayVideos.length, totalDuration: Math.round(dailyWatchTime) });
        }

        res.json({ canSchedule: true, totalVideos: unscheduledVideos.length, totalDays: preview.length, videosPerDay, maxWatchTimePerDay, preview: preview.slice(0, 5), hasMore: preview.length > 5 });
    } catch (err) {
        console.error('Preview error:', err.message);
        res.status(500).json({ msg: 'Preview failed: ' + err.message });
    }
};

exports.previewGoal = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { targetDate } = req.body;
        const User = require('../models/User');

        const videos = await Video.find({ playlistId }).sort('position');
        const existingSchedules = await Schedule.find({
            userId: req.user.id,
            videoId: { $in: videos.map(v => v._id) }
        });

        const scheduledVideoIds = new Set(existingSchedules.map(s => s.videoId.toString()));
        const completedVideoIds = new Set(existingSchedules.filter(s => s.status === 'completed').map(s => s.videoId.toString()));
        const unscheduledVideos = videos.filter(v => !scheduledVideoIds.has(v._id.toString()));

        // Validation 1: All complete
        if (videos.length === completedVideoIds.size) {
            return res.json({ canSchedule: false, reason: 'Playlist already complete! 🎉' });
        }

        // Validation 2: All scheduled
        if (unscheduledVideos.length === 0) {
            return res.json({ canSchedule: false, reason: 'All videos already scheduled. Want to reschedule?' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        const daysAvailable = Math.max(1, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
        const videosPerDay = Math.ceil(unscheduledVideos.length / daysAvailable);

        const user = await User.findById(req.user.id);
        const maxVideosPerDay = user.preferences?.videosPerDay || 3;

        // Validation 3: Too soon
        if (videosPerDay > maxVideosPerDay) {
            return res.json({
                canSchedule: false,
                reason: `Not enough time! You'd need ${videosPerDay} videos/day, but your limit is ${maxVideosPerDay}. Try a later deadline.`
            });
        }

        res.json({ canSchedule: true, totalVideos: unscheduledVideos.length, daysAvailable, videosPerDay, deadline: target });
    } catch (err) {
        console.error('Preview goal error:', err.message);
        res.status(500).json({ msg: 'Preview failed: ' + err.message });
    }
};

