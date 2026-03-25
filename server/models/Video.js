const mongoose = require('mongoose');

/**
 * Video now serves as a junction table linking Playlists to SharedVideos
 * It stores playlist-specific data (position, pinned status) 
 * while video metadata is stored once in SharedVideo
 */
const videoSchema = new mongoose.Schema({
    playlistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
        required: true,
    },
    sharedVideoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SharedVideo',
        required: true,
        index: true
    },
    // DEPRECATED: Keep for backward compatibility during migration
    videoId: {
        type: String,
    },
    title: {
        type: String,
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
    // END DEPRECATED FIELDS

    // Playlist-specific fields
    position: {
        type: Number,
    },
    isPinned: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Virtual to populate shared video data
videoSchema.virtual('sharedVideo', {
    ref: 'SharedVideo',
    localField: 'sharedVideoId',
    foreignField: '_id',
    justOne: true
});

// Make sure virtuals are included in JSON
videoSchema.set('toJSON', { virtuals: true });
videoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Video', videoSchema);
