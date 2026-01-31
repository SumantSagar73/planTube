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
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
