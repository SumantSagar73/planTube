const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
    },
    scheduledDate: {
        type: Date,
        required: false,
    },
    scheduledTime: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending',
    },
    completedChapters: {
        type: [Number], // Array of chapter indices
        default: []
    },
    lastWatchedSecond: {
        type: Number,
        default: 0
    },
    // Spaced Repetition (SM-2 algorithm)
    nextReviewDate: {
        type: Date,
        default: null
    },
    reviewInterval: {
        type: Number,
        default: 1    // days
    },
    reviewEaseFactor: {
        type: Number,
        default: 2.5
    },
    reviewRepetitions: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
