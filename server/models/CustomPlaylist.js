const mongoose = require('mongoose');

const customPlaylistSchema = new mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    thumbnail: {
        type: String
    },
    visibility: {
        type: String,
        enum: ['private', 'link'],
        default: 'private'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CustomPlaylist', customPlaylistSchema);
