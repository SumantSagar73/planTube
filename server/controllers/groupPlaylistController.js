const GroupPlaylist = require('../models/GroupPlaylist');
const Group = require('../models/Group');
const Playlist = require('../models/Playlist');
const Schedule = require('../models/Schedule');
const Video = require('../models/Video');

// Share a playlist with a group
exports.sharePlaylist = async (req, res) => {
    try {
        const { groupId, playlistId } = req.body;

        // Check if group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });
        if (!group.members.includes(req.user.id)) {
            return res.status(403).json({ msg: 'You are not a member of this group' });
        }

        // Check if playlist exists and user owns it
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });
        if (playlist.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'You can only share your own playlists' });
        }

        // Create group playlist connection
        const groupPlaylist = new GroupPlaylist({
            groupId,
            playlistId,
            sharedBy: req.user.id
        });

        await groupPlaylist.save();
        res.json(groupPlaylist);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Playlist already shared with this group' });
        }
        console.error('Share playlist error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all playlists shared in a group
exports.getGroupPlaylists = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // If logged in, check membership. If guest, allow read-only access.
        if (req.user) {
            const isMember = group.members.some(m => m.toString() === String(req.user.id));
            const isOwner = group.ownerId.toString() === String(req.user.id);
        }

        const sharedPlaylists = await GroupPlaylist.find({ groupId })
            .populate('playlistId')
            .populate('sharedBy', 'name')
            .sort({ priority: -1, sharedAt: -1 });

        res.json(sharedPlaylists);
    } catch (err) {
        console.error('Get group playlists error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get progress of all members for a shared playlist
exports.getGroupPlaylistProgress = async (req, res) => {
    try {
        const { groupId, playlistId } = req.params;

        // Check membership
        const group = await Group.findById(groupId).populate('members', 'name email');
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // If guest or non-member, they can still view progress if they have the link
        // but let's at least ensure we don't crash on req.user.id

        // Get all videos in this playlist
        const videos = await Video.find({ playlistId });
        const videoIds = videos.map(v => v._id);
        const totalVideos = videos.length;

        const progressData = await Promise.all(group.members.map(async (member) => {
            // Get completed schedules for this user and these videos
            const completedCount = await Schedule.countDocuments({
                userId: member._id,
                videoId: { $in: videoIds },
                status: 'completed'
            });

            // Get last activity
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
        console.error('Get group progress error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get schedules of all members for a shared playlist (View Only)
exports.getGroupPlaylistSchedules = async (req, res) => {
    try {
        const { groupId, playlistId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // Safety check for guest access
        if (req.user) {
            const isMember = group.members.some(m => m.toString() === String(req.user.id));
            const isOwner = group.ownerId.toString() === String(req.user.id);
        }

        const videos = await Video.find({ playlistId });
        const videoIds = videos.map(v => v._id);

        const schedules = await Schedule.find({
            videoId: { $in: videoIds },
            userId: { $in: group.members }
        }).populate('videoId', 'title').populate('userId', 'name');

        // Organize by user
        const organizedSchedules = {};
        group.members.forEach(memberId => {
            organizedSchedules[memberId] = schedules.filter(s => s.userId._id.toString() === memberId.toString());
        });

        res.json(organizedSchedules);
    } catch (err) {
        console.error('Get group schedules error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Unshare playlist
exports.unsharePlaylist = async (req, res) => {
    try {
        const { groupId, playlistId } = req.params;

        const shared = await GroupPlaylist.findOne({ groupId, playlistId });
        if (!shared) return res.status(404).json({ msg: 'Shared playlist not found' });

        const group = await Group.findById(groupId);

        // Only owner of group or person who shared it can remove
        if (group.ownerId.toString() !== req.user.id && shared.sharedBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Permission denied' });
        }

        await GroupPlaylist.deleteOne({ _id: shared._id });
        res.json({ msg: 'Playlist removed from group' });
    } catch (err) {
        console.error('Unshare error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update playlist priority
exports.updatePlaylistPriority = async (req, res) => {
    try {
        const { groupId, playlistId } = req.params;
        const { priority } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // Only owner can update priority
        if (group.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Only group owner can set priority' });
        }

        const shared = await GroupPlaylist.findOne({ groupId, playlistId });
        if (!shared) return res.status(404).json({ msg: 'Shared playlist not found' });

        shared.priority = priority;
        await shared.save();

        res.json(shared);
    } catch (err) {
        console.error('Update priority error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
