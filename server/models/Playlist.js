const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    playlistTitle: {
        type: String,
        required: true,
    },
    playlistId: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
    },
    isPinned: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Playlist', playlistSchema);
