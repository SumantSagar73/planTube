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

        if (!groupName) {
            return res.status(400).json({ msg: 'Group name is required' });
        }

        const group = new Group({
            groupName,
            description: description || '',
            ownerId: req.user.id,
            members: [req.user.id], // Owner is automatically a member
            joinCode: crypto.randomBytes(4).toString('hex').toUpperCase() // Generate 8-char hex code
        });

        await group.save();
        await group.populate('members', 'name email');
        await group.populate('ownerId', 'name email');

        res.json(group);
    } catch (err) {
        console.error('Create group error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all groups user is part of
exports.getMyGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            members: req.user.id
        })
            .populate('ownerId', 'name email')
            .populate('members', 'name email')
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (err) {
        console.error('Get groups error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get single group by ID
exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('ownerId', 'name email')
            .populate('members', 'name email');

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // If user is logged in, verify membership
        if (req.user) {
            const isOwner = group.ownerId._id && String(group.ownerId._id) === String(req.user.id);
            const isMember = group.members.some(m => m._id && String(m._id) === String(req.user.id));

            if (!isMember && !isOwner) {
                // Return read-only data but mark as not member. Hide joinCode.
                const groupObj = group.toObject();
                delete groupObj.joinCode;
                return res.json({ ...groupObj, isPublicView: true });
            }
        } else {
            // Guest access: read-only. Hide joinCode.
            const groupObj = group.toObject();
            delete groupObj.joinCode;
            return res.json({ ...groupObj, isPublicView: true });
        }

        res.json(group);
    } catch (err) {
        console.error('Get group error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update group (owner only)
exports.updateGroup = async (req, res) => {
    try {
        const { groupName, description } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Only owner can update
        if (group.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Only group owner can update' });
        }

        if (groupName) group.groupName = groupName;
        if (description !== undefined) group.description = description;

        await group.save();
        await group.populate('ownerId', 'name email');
        await group.populate('members', 'name email');

        res.json(group);
    } catch (err) {
        console.error('Update group error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete group (owner only)
exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        if (group.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Only group owner can delete' });
        }

        await Group.findByIdAndDelete(req.params.id);

        // Also delete associated GroupPlaylists
        await GroupPlaylist.deleteMany({ groupId: req.params.id });

        res.json({ msg: 'Group deleted successfully' });
    } catch (err) {
        console.error('Delete group error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Add member to group (owner only)
exports.addMember = async (req, res) => {
    try {
        const { email } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        const isOwner = group.ownerId.toString() === req.user.id;
        const isMember = group.members.some(m => m.toString() === req.user.id);

        if (!isMember && !isOwner) {
            return res.status(403).json({ msg: 'Only group members or the owner can add others' });
        }

        // Find user by email or name
        const user = await User.findOne({
            $or: [
                { email: email },
                { name: email } // 'email' variable here is the input from client
            ]
        });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if already a member
        if (group.members.some(m => m.toString() === user._id.toString())) {
            return res.status(400).json({ msg: 'User is already a member' });
        }

        group.members.push(user._id);
        await group.save();
        await group.populate('members', 'name email');
        await group.populate('ownerId', 'name email');

        res.json(group);
    } catch (err) {
        console.error('Add member error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Remove member from group (owner only)
exports.removeMember = async (req, res) => {
    try {
        const { userId } = req.params;
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        if (group.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Only group owner can remove members' });
        }

        // Cannot remove owner
        if (userId === group.ownerId.toString()) {
            return res.status(400).json({ msg: 'Cannot remove group owner' });
        }

        group.members = group.members.filter(m => m.toString() !== userId);
        await group.save();
        await group.populate('members', 'name email');
        await group.populate('ownerId', 'name email');

        res.json(group);
    } catch (err) {
        console.error('Remove member error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Leave group (non-owners only)
exports.leaveGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Owner cannot leave, must delete or transfer ownership
        if (group.ownerId.toString() === req.user.id) {
            return res.status(400).json({ msg: 'Owner cannot leave. Delete the group instead.' });
        }

        // Check if user is a member
        if (!group.members.some(m => m.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'You are not a member of this group' });
        }

        group.members = group.members.filter(m => m.toString() !== req.user.id);
        await group.save();

        res.json({ msg: 'Left group successfully' });
    } catch (err) {
        console.error('Leave group error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
// Join group (Public/Guest)
exports.joinGroup = async (req, res) => {
    try {
        const { email, name } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        const guestEmail = email || `guest_${Date.now()}_${Math.random().toString(36).slice(-4)}@plantube.guest`;
        const guestUsername = `guest_${Math.random().toString(36).slice(-6)}`;

        // Find or create user
        let user = await User.findOne({ email: guestEmail });
        if (!user) {
            // Create a ghost user
            user = new User({
                name: name || 'Guest Member',
                username: guestUsername,
                email: guestEmail,
                password: Math.random().toString(36).slice(-8), // Temporary password
                isGuest: true
            });
            await user.save();
        }

        // Check if already a member
        if (group.members.some(m => m.toString() === user._id.toString())) {
            return res.status(400).json({ msg: 'Already a member' });
        }

        group.members.push(user._id);
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            msg: 'Joined successfully',
            token,
            user: { id: user._id, name: user.name, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error('Join group error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Join group by Code (Public/Guest)
exports.joinGroupByCode = async (req, res) => {
    try {
        const { code, email, name } = req.body;

        if (!code) {
            return res.status(400).json({ msg: 'Join code is required' });
        }

        const group = await Group.findOne({ joinCode: code.toUpperCase() })
            .populate('ownerId', 'name email')
            .populate('members', 'name email');

        if (!group) {
            return res.status(404).json({ msg: 'Invalid join code' });
        }

        let userId = req.user?.id;
        let userData = null;

        if (!userId) {
            // Guest mode: Find or create ghost user
            const guestEmail = email || `guest_${Date.now()}_${Math.random().toString(36).slice(-4)}@plantube.guest`;
            const guestUsername = `guest_${Math.random().toString(36).slice(-6)}`;

            let user = await User.findOne({ email: guestEmail });
            if (!user) {
                user = new User({
                    name: name || 'Guest Member',
                    username: guestUsername,
                    email: guestEmail,
                    password: Math.random().toString(36).slice(-8), // Temp password
                    isGuest: true
                });
                await user.save();
            }
            userId = user._id;
            const payload = { user: { id: user.id } };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
            userData = { id: user._id, name: user.name, username: user.username, email: user.email, token };
        }

        // Check if already a member
        if (group.members.some(m => m._id.toString() === userId.toString())) {
            return res.status(400).json({ msg: 'Already a member' });
        }

        group.members.push(userId);
        await group.save();

        res.json({ msg: 'Joined successfully', group, user: userData });
    } catch (err) {
        console.error('Join group by code error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
