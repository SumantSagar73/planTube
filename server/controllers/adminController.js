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
        const videos = await SharedVideo.find().sort({ createdAt: -1 });
        res.json(videos);
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

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const requesterId = req.user.id || req.user._id;
        if (user._id.toString() === requesterId.toString()) {
            return res.status(400).json({ msg: 'You cannot delete your own admin account.' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User removed' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};
