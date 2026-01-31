const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    playlistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
        required: true,
    },
    videoId: {
        type: String,
        required: true,
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
    position: {
        type: Number,
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    description: {
        type: String
    },
    chapters: [{
        title: String,
        timestamp: String,
        seconds: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
