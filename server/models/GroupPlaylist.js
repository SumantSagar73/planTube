const mongoose = require('mongoose');

const groupPlaylistSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    playlistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
        required: true
    },
    sharedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sharedAt: {
        type: Date,
        default: Date.now
    },
    priority: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure a playlist can only be shared once per group
groupPlaylistSchema.index({ groupId: 1, playlistId: 1 }, { unique: true });

module.exports = mongoose.model('GroupPlaylist', groupPlaylistSchema);
