const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
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
    },
    goal: {
        targetDate: Date,
        createdAt: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Playlist', playlistSchema);
