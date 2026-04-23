const User = require('../models/User');
const Group = require('../models/Group');
const GroupPlaylist = require('../models/GroupPlaylist');
const Playlist = require('../models/Playlist');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Create a new group
exports.createGroup = async (req, res) => {
    try {
        const { groupName, description } = req.body;
        if (!groupName) return res.status(400).json({ msg: 'Group name is required' });

        const group = new Group({
            groupName,
            description: description || '',
            ownerId: req.user.id,
            members: [req.user.id],
            joinCode: crypto.randomBytes(4).toString('hex').toUpperCase()
        });

        await group.save();
        await group.populate('members', 'name email');
        await group.populate('ownerId', 'name email');
        res.json(group);
    } catch (err) {
        console.error('CreateGroup Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all groups user is part of
exports.getMyGroups = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ msg: 'Auth token missing id' });

        const groups = await Group.find({
            members: req.user.id
        })
            .populate('ownerId', 'name email')
            .populate('members', 'name email')
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (err) {
        console.error('GetMyGroups Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get single group by ID
exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('ownerId', 'name email')
            .populate('members', 'name email');

        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // Access Control
        if (req.user && req.user.id) {
            const userIdStr = req.user.id.toString();
            
            const isOwner = group.ownerId && group.ownerId._id && group.ownerId._id.toString() === userIdStr;
            const isMember = group.members.some(m => m && m._id && m._id.toString() === userIdStr);
            const isAdmin = req.user.isAdmin; // Flag from auth middleware

            if (!isMember && !isOwner && !isAdmin) {
                const groupObj = group.toObject();
                delete groupObj.joinCode;
                return res.json({ ...groupObj, isPublicView: true });
            }
        } else {
            const groupObj = group.toObject();
            delete groupObj.joinCode;
            return res.json({ ...groupObj, isPublicView: true });
        }

        res.json(group);
    } catch (err) {
        console.error('GetGroupById Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update group
exports.updateGroup = async (req, res) => {
    try {
        const { groupName, description } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (group.ownerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ msg: 'Only group owner can update' });
        }

        if (groupName) group.groupName = groupName;
        if (description !== undefined) group.description = description;

        await group.save();
        await group.populate('ownerId', 'name email');
        await group.populate('members', 'name email');
        res.json(group);
    } catch (err) {
        console.error('UpdateGroup Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete group
exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (group.ownerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ msg: 'Only group owner can delete' });
        }

        await Group.findByIdAndDelete(req.params.id);
        await GroupPlaylist.deleteMany({ groupId: req.params.id });
        res.json({ msg: 'Group deleted successfully' });
    } catch (err) {
        console.error('DeleteGroup Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Add member to group
exports.addMember = async (req, res) => {
    try {
        const { email } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        const requesterId = req.user?.id ? req.user.id.toString() : null;
        const isOwner = group.ownerId.toString() === requesterId;
        const isMember = group.members.some(m => m.toString() === requesterId);

        if (!isMember && !isOwner) {
            return res.status(403).json({ msg: 'Only group members can add others' });
        }

        const user = await User.findOne({ $or: [{ email: email }, { name: email }] });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (group.members.some(m => m.toString() === user._id.toString())) {
            return res.status(400).json({ msg: 'User is already a member' });
        }

        group.members.push(user._id);
        await group.save();
        await group.populate('members', 'name email');
        await group.populate('ownerId', 'name email');
        res.json(group);
    } catch (err) {
        console.error('AddMember Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Remove member
exports.removeMember = async (req, res) => {
    try {
        const { userId } = req.params;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (group.ownerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ msg: 'Only group owner can remove members' });
        }

        if (userId === group.ownerId.toString()) {
            return res.status(400).json({ msg: 'Cannot remove group owner' });
        }

        group.members = group.members.filter(m => m.toString() !== userId);
        await group.save();
        await group.populate('members', 'name email');
        await group.populate('ownerId', 'name email');
        res.json(group);
    } catch (err) {
        console.error('RemoveMember Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Leave group
exports.leaveGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (group.ownerId.toString() === req.user.id.toString()) {
            return res.status(400).json({ msg: 'Owner cannot leave. Delete the group instead.' });
        }

        if (!group.members.some(m => m.toString() === req.user.id.toString())) {
            return res.status(400).json({ msg: 'You are not a member of this group' });
        }

        group.members = group.members.filter(m => m.toString() !== req.user.id.toString());
        await group.save();
        res.json({ msg: 'Left group successfully' });
    } catch (err) {
        console.error('LeaveGroup Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Join group
exports.joinGroup = async (req, res) => {
    try {
        const { email, name } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        let user;
        if (req.user) {
            user = await User.findById(req.user.id);
        } else {
           const guestEmail = email || `guest_${Date.now()}@plantube.guest`;
           user = await User.findOne({ email: guestEmail });
           if (!user) {
               user = new User({
                   name: name || 'Guest Member',
                   username: `guest_${Math.random().toString(36).slice(-6)}`,
                   email: guestEmail,
                   password: Math.random().toString(36).slice(-8),
                   isGuest: true
               });
               await user.save();
           }
        }

        if (group.members.some(m => m.toString() === user._id.toString())) {
            return res.status(400).json({ msg: 'Already a member' });
        }

        group.members.push(user._id);
        await group.save();

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ msg: 'Joined successfully', token, user: { id: user._id, name: user.name, username: user.username, email: user.email } });
    } catch (err) {
        console.error('JoinGroup Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Join by code
exports.joinGroupByCode = async (req, res) => {
    try {
        const { code, email, name } = req.body;
        if (!code) return res.status(400).json({ msg: 'Join code is required' });

        const group = await Group.findOne({ joinCode: code.toUpperCase() });
        if (!group) return res.status(404).json({ msg: 'Invalid join code' });

        let user;
        if (req.user) {
            user = await User.findById(req.user.id);
        } else {
            const guestEmail = email || `guest_${Date.now()}@plantube.guest`;
            user = await User.findOne({ email: guestEmail });
            if (!user) {
                user = new User({
                    name: name || 'Guest Member',
                    username: `guest_${Math.random().toString(36).slice(-6)}`,
                    email: guestEmail,
                    password: Math.random().toString(36).slice(-8),
                    isGuest: true
                });
                await user.save();
            }
        }

        if (group.members.some(m => m.toString() === user._id.toString())) {
            return res.status(400).json({ msg: 'Already a member' });
        }

        group.members.push(user._id);
        await group.save();

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ msg: 'Joined successfully', group, token, user: { id: user._id, name: user.name, username: user.username, email: user.email } });
    } catch (err) {
        console.error('JoinByCode Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};
