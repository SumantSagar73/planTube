const Video = require('../models/Video');
const SharedVideo = require('../models/SharedVideo');
const axios = require('axios');
const { parseDuration, formatDuration, parseChapters } = require('../utils/videoUtils');

// Helper to fetch single video data from YouTube
const fetchYouTubeData = async (videoId) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YouTube API Key is missing');

    const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
            part: 'snippet,contentDetails',
            id: videoId,
            key: apiKey
        }
    });

    if (!res.data.items.length) throw new Error('Video not found on YouTube');

    const item = res.data.items[0];
    const description = item.snippet.description || '';
    const durationSecs = parseDuration(item.contentDetails.duration);

    return {
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        duration: formatDuration(item.contentDetails.duration),
        description,
        chapters: parseChapters(description, durationSecs)
    };
};

exports.getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};

        // Check if id is a valid MongoDB ObjectId
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            // Assume it's a YouTube ID
            query = { videoId: id };
        }

        const video = await Video.findOne(query).populate('sharedVideoId');
        if (!video) return res.status(404).json({ msg: 'Video not found' });
        res.json(video);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.togglePin = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        const isPinned = !video.isPinned;
        
        // Use findOneAndUpdate to avoid triggering validation for all fields
        const updatedVideo = await Video.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { isPinned } },
            { new: true }
        );

        res.json(updatedVideo);
    } catch (err) {
        console.error('Toggle Pin Error:', err.message);
        res.status(500).send('Server error: ' + err.message);
    }
};

exports.syncVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        // Only sync if we have a valid YouTube video ID
        if (!video.videoId) return res.status(400).json({ msg: 'No YouTube ID found for this video' });

        const newData = await fetchYouTubeData(video.videoId);

        video.title = newData.title;
        video.thumbnail = newData.thumbnail;
        video.duration = newData.duration;
        video.description = newData.description;
        video.chapters = newData.chapters;

        await video.save();
        res.json({ msg: 'Synced', video });
    } catch (err) {
        console.error('Sync Error:', err.message);
        res.status(500).json({ msg: 'Sync Failed: ' + err.message });
    }
};
exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        // Check if video belongs to user's SINGLES playlist or is allowed to be deleted
        // For now, allow deletion if it belongs to a SINGLES playlist owned by user
        const Playlist = require('../models/Playlist');
        const playlist = await Playlist.findById(video.playlistId);

        if (playlist && playlist.userId && playlist.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Delete associated schedules
        const Schedule = require('../models/Schedule');
        await Schedule.deleteMany({ videoId: video._id });

        await Video.findByIdAndDelete(video._id);
        res.json({ msg: 'Video deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
