const mongoose = require('mongoose');

/**
 * SharedVideo stores video metadata once per YouTube video
 * Multiple playlists/users can reference the same SharedVideo
 * This enables consistent presence tracking across all users watching the same video
 */
const sharedVideoSchema = new mongoose.Schema({
    youtubeId: {
        type: String,
        required: true,
        unique: true, // Ensures one record per YouTube video
        index: true
    },
    title: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
    },
    duration: {
        type: String,
    },
    description: {
        type: String
    },
    chapters: [{
        title: String,
        timestamp: String,
        seconds: Number
    }],
    // Metadata
    lastSyncedAt: {
        type: Date,
        default: Date.now
    },
    brainstormPlan: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('SharedVideo', sharedVideoSchema);
