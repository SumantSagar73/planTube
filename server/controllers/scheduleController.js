const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Video = require('../models/Video');
const Activity = require('../models/Activity');

exports.createSchedule = async (req, res) => {
    let { videoId, scheduledDate, scheduledTime, status } = req.body;
    try {
        // If it's a YouTube ID (not a valid MongoDB ObjectId), find the DB document
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            const video = await Video.findOne({ videoId: videoId });
            if (!video) return res.status(404).json({ msg: 'Video not found' });
            videoId = video._id;
        }

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

exports.getResumeSchedule = async (req, res) => {
    try {
        const resumeWithProgress = await Schedule.find({
            userId: req.user.id,
            status: 'pending',
            lastWatchedSecond: { $gt: 0 }
        })
            .populate({
                path: 'videoId',
                populate: [{ path: 'playlistId' }, { path: 'sharedVideoId' }]
            })
            .sort('-updatedAt')
            .limit(3);

        let resumeSchedule = resumeWithProgress;

        if (resumeSchedule.length < 3) {
            const extraPending = await Schedule.find({
                userId: req.user.id,
                status: 'pending'
            })
                .populate({
                    path: 'videoId',
                    populate: [{ path: 'playlistId' }, { path: 'sharedVideoId' }]
                })
                .sort('-updatedAt')
                .limit(3);

            const seenIds = new Set(resumeSchedule.map((item) => String(item._id)));
            extraPending.forEach((item) => {
                if (resumeSchedule.length >= 3) return;
                if (!seenIds.has(String(item._id))) {
                    resumeSchedule.push(item);
                    seenIds.add(String(item._id));
                }
            });
        }

        const filtered = resumeSchedule.filter((item) => item && item.videoId);
        res.json(filtered.length > 0 ? filtered : null);
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
        const activitySummary = await Activity.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, totalSeconds: { $sum: '$seconds' } } }
        ]);

        // Total Completed Videos
        const totalCompleted = completedSchedules.length;

        // Total completed-video duration (kept for legacy completeness)
        let totalSeconds = 0;
        completedSchedules.forEach(s => {
            if (s.videoId && s.videoId.duration) {
                totalSeconds += parseDurationToSeconds(s.videoId.duration);
            }
        });
        const totalFocusSeconds = activitySummary.length > 0 ? activitySummary[0].totalSeconds : 0;
        const totalFocusTime = formatSecondsToTime(totalFocusSeconds);
        const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);

        // Weekly Completed (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyCompleted = completedSchedules.filter(s => new Date(s.updatedAt) >= sevenDaysAgo).length;

        // Current Streak
        const completionDates = completedSchedules
            .map(s => {
                // Return YYYY-MM-DD
                return new Date(s.updatedAt).toISOString().split('T')[0];
            })
            .sort((a, b) => new Date(b) - new Date(a)); // Sort newest first

        const uniqueDates = [...new Set(completionDates)];

        let streak = 0;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        let yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Start streak check either from today or yesterday
        let expectedDate = null;
        if (uniqueDates.includes(todayStr)) {
            streak++;
            expectedDate = new Date(yesterday); // next expected is yesterday for counting backwards
        } else if (uniqueDates.includes(yesterdayStr)) {
            // Streak is alive from yesterday, but today isn't done yet
            streak++;
            expectedDate = new Date(yesterday);
            expectedDate.setDate(expectedDate.getDate() - 1); // next expected is day before yesterday
        }

        if (expectedDate) {
            while (true) {
                const qStr = expectedDate.toISOString().split('T')[0];
                if (uniqueDates.includes(qStr)) {
                    streak++;
                    expectedDate.setDate(expectedDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        const User = require('../models/User');
        const user = await User.findById(userId);
        if (user && streak > (user.bestStreak || 0)) {
            user.bestStreak = streak;
            await user.save();
        }

        res.json({
            totalCompleted,
            totalTime: totalFocusTime,
            totalCompletedTime: formatSecondsToTime(totalSeconds),
            totalFocusSeconds,
            totalFocusTime,
            totalFocusHours,
            weeklyCompleted,
            streak,
            bestStreak: user?.bestStreak || streak,
            completionHistory: uniqueDates // Array of YYYY-MM-DD strings
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


exports.updateStatus = async (req, res) => {
    const { status, scheduledDate, scheduledTime } = req.body;
    try {
        let schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });

        if (schedule.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        if (status) schedule.status = status;
        if (scheduledDate !== undefined) schedule.scheduledDate = scheduledDate;
        if (scheduledTime !== undefined) schedule.scheduledTime = scheduledTime;
        if (req.body.completedChapters !== undefined) schedule.completedChapters = req.body.completedChapters;
        if (req.body.lastWatchedSecond !== undefined) schedule.lastWatchedSecond = req.body.lastWatchedSecond;

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

