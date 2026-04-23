const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
    actorAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true
    },
    targetType: {
        type: String,
        enum: ['user', 'playlist', 'video', 'system', 'session', 'other'],
        default: 'other'
    },
    metadata: {
        type: Object,
        default: {}
    },
    ip: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
