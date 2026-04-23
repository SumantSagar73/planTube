const GroupPlaylist = require('../models/GroupPlaylist');
const Group = require('../models/Group');
const Playlist = require('../models/Playlist');
const Schedule = require('../models/Schedule');
const Video = require('../models/Video');

// Share a playlist or video with a group
exports.sharePlaylist = async (req, res) => {
    try {
        const { groupId, playlistId, videoId } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });
        
        // Safety check for req.user
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'User authentication failed' });
        }

        const isMember = group.members.some(m => m && m.toString() === req.user.id.toString());
        const isAdmin = req.user.isAdmin;
        if (!isMember && !isAdmin) {
            return res.status(403).json({ msg: 'You are not a member of this group' });
        }

        const sharedData = {
            groupId,
            sharedBy: req.user.id
        };

        if (playlistId) {
            const playlist = await Playlist.findById(playlistId);
            if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });
            if (playlist.userId && playlist.userId.toString() !== req.user.id.toString()) {
                return res.status(403).json({ msg: 'You can only share your own playlists' });
            }
            sharedData.playlistId = playlistId;
        } else if (videoId) {
            const video = await Video.findById(videoId);
            if (!video) return res.status(404).json({ msg: 'Video not found' });
            const playlist = await Playlist.findById(video.playlistId);
            if (playlist && playlist.userId && playlist.userId.toString() !== req.user.id.toString()) {
                return res.status(403).json({ msg: 'You can only share your own videos' });
            }
            sharedData.videoId = videoId;
        }

        const groupPlaylist = new GroupPlaylist(sharedData);
        await groupPlaylist.save();
        res.json(groupPlaylist);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'This item is already shared with this group' });
        }
        console.error('Share error:', err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};

// Get all playlists shared in a group
exports.getGroupPlaylists = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // Optional membership logic check (informative only)
        if (req.user && req.user.id) {
            const userIdStr = req.user.id.toString();
            const isMember = group.members.some(m => m && m.toString() === userIdStr);
            console.log(`Checking membership for user ${userIdStr} in group ${groupId}: ${isMember}`);
        }

        const sharedPlaylists = await GroupPlaylist.find({ groupId })
            .populate('playlistId')
            .populate('videoId')
            .populate('sharedBy', 'name')
            .sort({ priority: -1, sharedAt: -1 });

        res.json(sharedPlaylists);
    } catch (err) {
        console.error('GetGroupPlaylists Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// Get progress of all members for a shared playlist
exports.getGroupPlaylistProgress = async (req, res) => {
    try {
        const { groupId, playlistId } = req.params;
        const group = await Group.findById(groupId).populate('members', 'name email');
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        const videos = await Video.find({ playlistId });
        const videoIds = videos.map(v => v._id);
        const totalVideos = videos.length;

        const progressData = await Promise.all(group.members.map(async (member) => {
            const completedCount = await Schedule.countDocuments({
                userId: member._id,
                videoId: { $in: videoIds },
                status: 'completed'
            });

            const lastActivity = await Schedule.findOne({
                userId: member._id,
                videoId: { $in: videoIds }
            }).sort({ updatedAt: -1 });

            return {
                userId: member._id,
                name: member.name,
                completedVideos: completedCount,
                totalVideos,
                percentage: totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0,
                lastActive: lastActivity ? lastActivity.updatedAt : null
            };
        }));

        res.json(progressData);
    } catch (err) {
        console.error('GetGroupPlaylistProgress Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// Get schedules of all members for a shared playlist
exports.getGroupPlaylistSchedules = async (req, res) => {
    try {
        const { groupId, playlistId } = req.params;
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        const videos = await Video.find({ playlistId });
        const videoIds = videos.map(v => v._id);

        const schedules = await Schedule.find({
            videoId: { $in: videoIds },
            userId: { $in: group.members }
        }).populate('videoId', 'title').populate('userId', 'name');

        const organizedSchedules = {};
        group.members.forEach(memberId => {
            organizedSchedules[memberId] = schedules.filter(s => s.userId && s.userId._id.toString() === memberId.toString());
        });

        res.json(organizedSchedules);
    } catch (err) {
        console.error('GetGroupPlaylistSchedules Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// Unshare playlist
exports.unsharePlaylist = async (req, res) => {
    try {
        const { groupId, playlistId } = req.params;
        const shared = await GroupPlaylist.findOne({
            groupId,
            $or: [{ playlistId }, { videoId: playlistId }]
        });
        if (!shared) return res.status(404).json({ msg: 'Shared item not found' });

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });
        
        if (!req.user || !req.user.id) return res.status(401).json({ msg: 'Auth failed' });

        const requesterId = req.user.id.toString();
        const isAdmin = req.user.isAdmin;
        if (group.ownerId.toString() !== requesterId && shared.sharedBy.toString() !== requesterId && !isAdmin) {
            return res.status(403).json({ msg: 'Permission denied' });
        }

        await GroupPlaylist.deleteOne({ _id: shared._id });
        res.json({ msg: 'Item removed from group' });
    } catch (err) {
        console.error('Unshare Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// Update playlist priority
exports.updatePlaylistPriority = async (req, res) => {
    try {
        const { groupId, playlistId } = req.params;
        const { priority } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (!req.user || !req.user.id) return res.status(401).json({ msg: 'Auth failed' });

        if (group.ownerId.toString() !== req.user.id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ msg: 'Only group owner can set priority' });
        }

        const shared = await GroupPlaylist.findOne({ groupId, playlistId });
        if (!shared) return res.status(404).json({ msg: 'Shared playlist not found' });

        shared.priority = priority;
        await shared.save();
        res.json(shared);
    } catch (err) {
        console.error('UpdatePriority Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};
