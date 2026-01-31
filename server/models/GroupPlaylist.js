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
        required: false // Now optional to support single videos
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: false
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
// Ensure a playlist or video can only be shared once per group
groupPlaylistSchema.index({ groupId: 1, playlistId: 1, videoId: 1 }, { unique: true });


module.exports = mongoose.model('GroupPlaylist', groupPlaylistSchema);
