const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: ['admin', 'achievement', 'social', 'reminder', 'system'],
        default: 'system',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal',
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    link: {
        type: String,
        default: ''
    },
    metadata: {
        type: Object,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    },
    archivedAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    dedupeKey: {
        type: String,
        index: true
    }
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1, recipientId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);
