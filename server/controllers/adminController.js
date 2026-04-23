const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const Video = require('../models/Video');
const SharedVideo = require('../models/SharedVideo');
const UserPlaylist = require('../models/UserPlaylist');

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPlaylists = await Playlist.countDocuments();
        const totalGroups = await Group.countDocuments();
        const totalVideos = await SharedVideo.countDocuments();

        let totalStudyHours = 0;
        try {
            const activityData = await Activity.aggregate([
                { $group: { _id: null, totalSeconds: { $sum: "$seconds" } } }
            ]);
            totalStudyHours = activityData.length > 0 ? Math.round(activityData[0].totalSeconds / 3600) : 0;
        } catch (aggErr) {
            console.error('Aggregation error:', aggErr);
        }

        res.json({
            totalUsers,
            totalPlaylists,
            totalGroups,
            totalVideos,
            totalStudyHours
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// @desc    Get all users with basic stats
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        
        // Enrich with counts
        const enrichedUsers = await Promise.all(users.map(async (u) => {
            const playlistCount = await UserPlaylist.countDocuments({ userId: u._id });
            const groupCount = await Group.countDocuments({ members: u._id });
            return {
                ...u.toObject(),
                playlistCount,
                groupCount
            };
        }));

        res.json(enrichedUsers);
    } catch (err) {
        console.error('GetUsers Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get detailed user info
// @route   GET /api/admin/users/:id
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const playlists = await UserPlaylist.find({ userId: user._id }).populate('playlistId');
        const groups = await Group.find({ members: user._id });
        const activity = await Activity.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10);

        res.json({
            user,
            playlists,
            groups,
            activity
        });
    } catch (err) {
        console.error('GetUserDetails Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get all global playlists
// @route   GET /api/admin/playlists
exports.getAllPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        
        const enriched = await Promise.all(playlists.map(async (p) => {
            const videoCount = await Video.countDocuments({ playlistId: p._id });
            const userCount = await UserPlaylist.countDocuments({ playlistId: p._id });
            return {
                ...p.toObject(),
                videoCount,
                userCount
            };
        }));

        res.json(enriched);
    } catch (err) {
        console.error('GetAllPlaylists Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get all unique videos (SharedVideo)
// @route   GET /api/admin/videos
exports.getAllVideos = async (req, res) => {
    try {
        // Find single videos by checking Schedules that don't belong to a playlist
        const singleSchedules = await require('../models/Schedule').find({
            $or: [{ playlistId: null }, { playlistId: { $exists: false } }]
        }).populate('videoId').populate('userId', 'name email');

        // Extract unique videos from those schedules
        const uniqueVideosMap = new Map();
        singleSchedules.forEach(schedule => {
            if (schedule.videoId) {
                if (!uniqueVideosMap.has(schedule.videoId._id.toString())) {
                    // Enrich with the first user who added it as a single video
                    uniqueVideosMap.set(schedule.videoId._id.toString(), {
                        ...schedule.videoId.toObject(),
                        addedBy: schedule.userId
                    });
                }
            }
        });

        res.json(Array.from(uniqueVideosMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
        console.error('GetAllVideos Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
    const { role } = req.body;
    try {
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ msg: 'Invalid role' });
        }
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const requesterId = req.user.id || req.user._id;
        if (user._id.toString() === requesterId.toString() && role !== 'admin') {
            return res.status(400).json({ msg: 'You cannot demote your own admin account.' });
        }

        user.role = role;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete a user completely
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const requesterId = req.user.id || req.user._id;
        if (user._id.toString() === requesterId.toString()) {
            return res.status(400).json({ msg: 'You cannot delete your own admin account.' });
        }

        // Drop related collections
        const Schedule = require('../models/Schedule');
        await Schedule.deleteMany({ userId: user._id });
        await Activity.deleteMany({ userId: user._id });

        const playlists = await Playlist.find({ userId: user._id });
        for (const pl of playlists) {
            await Video.deleteMany({ playlistId: pl._id });
        }
        await Playlist.deleteMany({ userId: user._id });

        await User.findByIdAndDelete(user._id);

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error('DeleteUser Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Toggle freeze status of a user
// @route   PUT /api/admin/users/:id/freeze
exports.toggleFreeze = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const requesterId = req.user.id || req.user._id;
        if (user._id.toString() === requesterId.toString()) {
            return res.status(400).json({ msg: 'You cannot freeze your own admin account.' });
        }

        user.isFrozen = !user.isFrozen;
        await user.save();
        res.json({ msg: user.isFrozen ? 'Account frozen' : 'Account unfrozen', isFrozen: user.isFrozen });
    } catch (err) {
        console.error('ToggleFreeze Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get 7-day chart data — real study activity + new signups
// @route   GET /api/admin/chart-data
exports.getChartData = async (req, res) => {
    try {
        const days = 7;
        const now = new Date();
        const result = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = days - 1; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(now.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);

            const [activityAgg, newUsers] = await Promise.all([
                Activity.aggregate([
                    { $match: { date: { $gte: start, $lte: end } } },
                    { $group: { _id: null, totalSeconds: { $sum: '$seconds' }, uniqueUsers: { $addToSet: '$userId' } } }
                ]),
                User.countDocuments({ createdAt: { $gte: start, $lte: end } })
            ]);

            const studyMins = activityAgg.length > 0 ? Math.round(activityAgg[0].totalSeconds / 60) : 0;
            const activeUsers = activityAgg.length > 0 ? activityAgg[0].uniqueUsers.length : 0;

            result.push({
                name: dayNames[start.getDay()],
                studyMins,
                activeUsers,
                newUsers
            });
        }

        // Top playlist categories based on title keywords
        const playlists = await Playlist.find().select('playlistTitle');
        const categories = { 'Development': 0, 'Math': 0, 'Design': 0, 'Science': 0, 'Business': 0, 'Language': 0, 'Other': 0 };
        const keywords = {
            'Development': ['javascript', 'python', 'react', 'node', 'coding', 'programming', 'dev', 'web', 'api', 'code', 'html', 'css', 'java', 'flutter', 'angular', 'vue', 'backend', 'frontend'],
            'Math': ['math', 'calculus', 'algebra', 'statistics', 'linear', 'discrete', 'geometry'],
            'Design': ['design', 'ui', 'ux', 'figma', 'sketch', 'photoshop', 'illustrator', 'canva', 'graphic'],
            'Science': ['physics', 'chemistry', 'biology', 'science', 'machine learning', 'ai', 'data', 'ml', 'deep learning'],
            'Business': ['business', 'marketing', 'finance', 'startup', 'entrepreneur', 'management', 'economics'],
            'Language': ['english', 'spanish', 'hindi', 'french', 'german', 'japanese', 'chinese', 'language', 'grammar'],
        };

        playlists.forEach(p => {
            const title = (p.playlistTitle || '').toLowerCase();
            let matched = false;
            for (const [cat, words] of Object.entries(keywords)) {
                if (words.some(w => title.includes(w))) {
                    categories[cat]++;
                    matched = true;
                    break;
                }
            }
            if (!matched) categories['Other']++;
        });

        const topTopics = Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .filter(t => t.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        res.json({ weeklyActivity: result, topTopics });
    } catch (err) {
        console.error('ChartData Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// @desc    Approve wipe request
// @route   POST /api/admin/users/:id/approve-wipe
exports.approveWipe = exports.deleteUser; // Just reuse the deleteUser logic
