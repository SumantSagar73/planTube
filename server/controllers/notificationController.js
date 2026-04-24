const Notification = require('../models/Notification');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const Group = require('../models/Group');

const emitNotification = (req, notification) => {
    const io = req.app.get('io');
    if (!io) return;
    io.to(`user_${notification.recipientId}`).emit('notification:new', notification);
};

const buildNotificationPayload = (notificationDoc) => ({
    _id: notificationDoc._id,
    recipientId: notificationDoc.recipientId,
    actorId: notificationDoc.actorId,
    adminId: notificationDoc.adminId,
    type: notificationDoc.type,
    category: notificationDoc.category,
    priority: notificationDoc.priority,
    title: notificationDoc.title,
    message: notificationDoc.message,
    link: notificationDoc.link,
    metadata: notificationDoc.metadata,
    isRead: notificationDoc.isRead,
    readAt: notificationDoc.readAt,
    archivedAt: notificationDoc.archivedAt,
    createdAt: notificationDoc.createdAt,
    updatedAt: notificationDoc.updatedAt
});

const createNotificationForUser = async ({ req, recipientId, actorId = null, adminId = null, type, category, priority = 'normal', title, message, link = '', metadata = {}, dedupeKey = null, expiresAt = null }) => {
    try {
        const doc = await Notification.create({
            recipientId,
            actorId,
            adminId,
            type,
            category,
            priority,
            title,
            message,
            link,
            metadata,
            dedupeKey,
            expiresAt
        });
        const payload = buildNotificationPayload(doc);
        emitNotification(req, payload);
        return payload;
    } catch (err) {
        if (err.code === 11000 && dedupeKey) {
            return null;
        }
        throw err;
    }
};

const resolveAudienceForPublicAchievement = async (userId) => {
    const [friendships, groups] = await Promise.all([
        Friendship.find({
            $or: [
                { requester: userId },
                { recipient: userId }
            ],
            status: 'accepted'
        }).select('requester recipient'),
        Group.find({ members: userId }).select('members')
    ]);

    const recipients = new Set([String(userId)]);

    friendships.forEach((friendship) => {
        const requester = friendship.requester?.toString();
        const recipient = friendship.recipient?.toString();
        if (requester) recipients.add(requester);
        if (recipient) recipients.add(recipient);
    });

    groups.forEach((group) => {
        (group.members || []).forEach((memberId) => {
            if (memberId) recipients.add(memberId.toString());
        });
    });

    return [...recipients];
};

exports.getMyNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, category = '', unreadOnly = 'false' } = req.query;
        const numericPage = Math.max(parseInt(page, 10) || 1, 1);
        const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (numericPage - 1) * numericLimit;

        const filter = { recipientId: req.user.id };
        if (category) filter.category = category;
        if (unreadOnly === 'true') filter.isRead = false;

        const [items, total, unreadCount] = await Promise.all([
            Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(numericLimit),
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipientId: req.user.id, isRead: false })
        ]);

        res.json({
            items: items.map(buildNotificationPayload),
            unreadCount,
            pagination: {
                page: numericPage,
                limit: numericLimit,
                total,
                totalPages: Math.max(Math.ceil(total / numericLimit), 1)
            }
        });
    } catch (err) {
        console.error('GetNotifications Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({ recipientId: req.user.id, isRead: false });
        res.json({ unreadCount });
    } catch (err) {
        console.error('UnreadCount Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user.id },
            { $set: { isRead: true, readAt: new Date() } },
            { new: true }
        );

        if (!notification) return res.status(404).json({ msg: 'Notification not found' });
        res.json(buildNotificationPayload(notification));
    } catch (err) {
        console.error('MarkNotificationRead Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user.id, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );
        res.json({ msg: 'All notifications marked as read' });
    } catch (err) {
        console.error('MarkAllNotificationsRead Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.archiveNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user.id },
            { $set: { archivedAt: new Date() } },
            { new: true }
        );

        if (!notification) return res.status(404).json({ msg: 'Notification not found' });
        res.json(buildNotificationPayload(notification));
    } catch (err) {
        console.error('ArchiveNotification Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.createAdminBroadcast = async (req, res) => {
    try {
        const adminId = req.user.originalAdminId || req.user.id || req.user._id;
        const {
            title,
            message,
            category = 'admin',
            priority = 'high',
            audience = 'all',
            userId = '',
            userIds = [],
            link = '',
            metadata = {}
        } = req.body || {};

        if (!title || !message) {
            return res.status(400).json({ msg: 'Title and message are required' });
        }

        let recipients = [];
        if (audience === 'all') {
            recipients = await User.find({}).select('_id');
        } else if (audience === 'single' && userId) {
            recipients = await User.find({ _id: userId }).select('_id');
        } else if (audience === 'users' && Array.isArray(userIds) && userIds.length) {
            recipients = await User.find({ _id: { $in: userIds } }).select('_id');
        } else {
            return res.status(400).json({ msg: 'Invalid audience selection' });
        }

        const dedupeKeyBase = `admin:${String(adminId)}:${title}:${message}`;
        const docs = await Notification.insertMany(
            recipients.map((user) => ({
                recipientId: user._id,
                adminId,
                type: 'admin_broadcast',
                category,
                priority,
                title,
                message,
                link,
                metadata,
                dedupeKey: `${dedupeKeyBase}:${user._id.toString()}`
            })),
            { ordered: false }
        );

        const io = req.app.get('io');
        if (io) {
            docs.forEach((doc) => io.to(`user_${doc.recipientId}`).emit('notification:new', buildNotificationPayload(doc)));
        }

        res.json({ msg: 'Broadcast sent', sentCount: docs.length });
    } catch (err) {
        console.error('AdminBroadcast Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.createAchievementNotifications = async ({ req, sourceUser, badge, link = '', category = 'achievement' }) => {
    const isPublic = !!sourceUser.isPublic;
    const recipients = isPublic
        ? await resolveAudienceForPublicAchievement(sourceUser._id)
        : [String(sourceUser._id)];

    const uniqueRecipients = [...new Set(recipients)];
    const docs = [];

    for (const recipientId of uniqueRecipients) {
        const isSelf = recipientId === String(sourceUser._id);
        const title = isSelf ? `Achievement unlocked: ${badge.name}` : `${sourceUser.name} unlocked ${badge.name}`;
        const message = isSelf
            ? badge.description
            : `${sourceUser.name} earned the ${badge.name} achievement.`;

        const payload = await createNotificationForUser({
            req,
            recipientId,
            actorId: sourceUser._id,
            type: 'achievement_unlocked',
            category,
            priority: isSelf ? 'normal' : 'low',
            title,
            message,
            link: isSelf ? '/profile' : link,
            metadata: {
                badge,
                sourceUserId: sourceUser._id,
                public: isPublic
            },
            dedupeKey: `achievement:${sourceUser._id}:${badge.name}:${recipientId}`
        });

        if (payload) docs.push(payload);
    }

    return docs;
};

exports.createSystemReminderNotification = async ({ req, recipientId, title, message, link = '', metadata = {} }) => {
    return createNotificationForUser({
        req,
        recipientId,
        type: 'system_reminder',
        category: 'reminder',
        priority: 'low',
        title,
        message,
        link,
        metadata
    });
};

exports.createSocialNotification = async ({ req, recipientId, actorId, title, message, link = '', metadata = {}, priority = 'normal', dedupeKey = null }) => {
    return createNotificationForUser({
        req,
        recipientId,
        actorId,
        type: 'social_event',
        category: 'social',
        priority,
        title,
        message,
        link,
        metadata,
        dedupeKey
    });
};
