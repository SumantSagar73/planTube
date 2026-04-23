const User = require('../models/User');
const Friendship = require('../models/Friendship');
const Activity = require('../models/Activity');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');

exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } }
            ],
            _id: { $ne: req.user.id }
        }).select('name username motto isPublic level xp');

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.sendFriendRequest = async (req, res) => {
    try {
        const recipientId = req.params.userId;
        if (recipientId === req.user.id) return res.status(400).json({ msg: 'Cannot friend yourself' });

        const existing = await Friendship.findOne({
            $or: [
                { requester: req.user.id, recipient: recipientId },
                { requester: recipientId, recipient: req.user.id }
            ]
        });

        if (existing) return res.status(400).json({ msg: 'Friendship already exists or is pending' });

        const request = new Friendship({
            requester: req.user.id,
            recipient: recipientId,
            status: 'pending'
        });

        await request.save();
        res.json({ msg: 'Request sent' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.respondToRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // 'accepted' or 'declined' (delete)

        const friendship = await Friendship.findById(requestId);
        if (!friendship) return res.status(404).json({ msg: 'Request not found' });
        if (friendship.recipient.toString() !== req.user.id) return res.status(401).json({ msg: 'Unauthorized' });

        if (status === 'accepted') {
            friendship.status = 'accepted';
            await friendship.save();
            res.json(friendship);
        } else {
            await Friendship.findByIdAndDelete(requestId);
            res.json({ msg: 'Request declined' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getSocialStats = async (req, res) => {
    try {
        const friends = await Friendship.find({
            $or: [{ requester: req.user.id }, { recipient: req.user.id }],
            status: 'accepted'
        }).populate('requester recipient', 'name username level xp motto');

        const pending = await Friendship.find({
            recipient: req.user.id,
            status: 'pending'
        }).populate('requester', 'name username level motto');

        const friendList = friends.map(f => {
            return f.requester._id.toString() === req.user.id ? f.recipient : f.requester;
        });

        res.json({ friends: friendList, pending });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select('name username motto isPublic level xp badges bestStreak createdAt');

        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        // If profile is private, only show limited info unless they are friends
        const isMe = req.user && req.user.id === user._id.toString();
        let areFriends = false;
        
        if (req.user && !isMe) {
            const friendship = await Friendship.findOne({
                $or: [
                    { requester: req.user.id, recipient: user._id },
                    { requester: user._id, recipient: req.user.id }
                ],
                status: 'accepted'
            });
            areFriends = !!friendship;
        }

        if (!user.isPublic && !isMe && !areFriends) {
            return res.json({ 
                user: { username: user.username, name: user.name, isPublic: false },
                isPrivate: true 
            });
        }

        // Fetch stats for the public profile
        const totalCompleted = await Schedule.countDocuments({ userId: user._id, status: 'completed' });
        
        const activitySummary = await Activity.aggregate([
            { $match: { userId: user._id } },
            { $group: { _id: null, totalSeconds: { $sum: "$seconds" } } }
        ]);

        const heatmapData = await Activity.find({ userId: user._id }).sort({ date: -1 }).limit(100);

        // Check relationship status for the viewer
        let relationship = null;
        if (req.user && !isMe) {
             const rel = await Friendship.findOne({
                $or: [
                    { requester: req.user.id, recipient: user._id },
                    { requester: user._id, recipient: req.user.id }
                ]
            });
            if (rel) {
                relationship = {
                    status: rel.status,
                    isRequester: rel.requester.toString() === req.user.id,
                    requestId: rel._id
                };
            }
        }

        res.json({
            user,
            stats: {
                totalCompleted,
                totalFocusHours: activitySummary.length > 0 ? (activitySummary[0].totalSeconds / 3600).toFixed(1) : 0,
                streak: user.streak || 0, // Should probably calculate this properly
                bestStreak: user.bestStreak || 0
            },
            heatmapData,
            relationship,
            isMe
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
