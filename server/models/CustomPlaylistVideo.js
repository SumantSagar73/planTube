const mongoose = require('mongoose');

const customPlaylistVideoSchema = new mongoose.Schema({
    playlistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomPlaylist',
        required: true
    },
    youtubeVideoId: {
        type: String,
        required: true
    },
    title: {
        type: String
    },
    thumbnail: {
        type: String
    },
    duration: {
        type: Number // in seconds
    },
    orderIndex: {
        type: Number
    },
    description: {
        type: String
    },
    chapters: [{
        title: String,
        timestamp: String,
        seconds: Number
    }]
});

module.exports = mongoose.model('CustomPlaylistVideo', customPlaylistVideoSchema);
