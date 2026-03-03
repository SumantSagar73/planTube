const mongoose = require('mongoose');

const userPlaylistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    playlistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
        required: true,
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    goal: {
        targetDate: Date,
        createdAt: Date
    }
}, { timestamps: true });

// Ensure a user can only have one link to a specific playlist
userPlaylistSchema.index({ userId: 1, playlistId: 1 }, { unique: true });

module.exports = mongoose.model('UserPlaylist', userPlaylistSchema);
