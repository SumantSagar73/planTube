const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contentType: { type: String, enum: ['playlist', 'user', 'video'], required: true },
    contentId: { type: String, required: true },
    contentTitle: String,
    reason: {
        type: String,
        enum: ['spam', 'inappropriate', 'copyright', 'harassment', 'misinformation', 'other'],
        required: true
    },
    details: String,
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolution: String,
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
