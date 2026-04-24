const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: ['bug', 'feature', 'ux', 'performance', 'other'],
        required: true,
        default: 'other',
        index: true
    },
    impact: {
        type: String,
        enum: ['blocking', 'annoying', 'nice_to_have'],
        required: true,
        default: 'annoying',
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 140
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    pagePath: {
        type: String,
        default: ''
    },
    contactAllowed: {
        type: Boolean,
        default: true
    },
    contactEmail: {
        type: String,
        default: ''
    },
    metadata: {
        type: Object,
        default: {}
    },
    status: {
        type: String,
        enum: ['new', 'in_review', 'planned', 'resolved', 'rejected'],
        default: 'new',
        index: true
    },
    adminNotes: {
        type: String,
        default: ''
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
