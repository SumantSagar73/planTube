const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String, // format: YYYY-MM-DD for easy grouping and indexing
        required: true,
    },
    seconds: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure unique index per user per day
activitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Activity', activitySchema);
