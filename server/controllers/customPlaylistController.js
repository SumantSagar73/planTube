const CustomPlaylist = require('../models/CustomPlaylist');
const CustomPlaylistVideo = require('../models/CustomPlaylistVideo');
const Video = require('../models/Video'); // For importing/duplicating videos if needed
const axios = require('axios');

const { fetchSingleVideoData, fetchPlaylistData } = require('../utils/youtubeUtils');

// Update to use the correct helper name internally if needed, or just use the imported one
const fetchVideoDetails = fetchSingleVideoData;

exports.createPlaylist = async (req, res) => {
    try {
        const { title, description, thumbnail } = req.body;

        const newPlaylist = new CustomPlaylist({
            creatorId: req.user.id,
            title,
            description,
            thumbnail
        });

        const playlist = await newPlaylist.save();
        res.json(playlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getMyPlaylists = async (req, res) => {
    try {
        const playlists = await CustomPlaylist.find({ creatorId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(playlists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getPlaylistById = async (req, res) => {
    try {
        const playlist = await CustomPlaylist.findById(req.params.id)
            .populate('creatorId', 'name'); // Assuming User model has 'name'

        if (!playlist) {
            return res.status(404).json({ msg: 'Playlist not found' });
        }

        // Access Control
        if (playlist.visibility === 'private') {
            if (!req.user || playlist.creatorId._id.toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Access denied' });
            }
        }

        // Fetch videos
        const videos = await CustomPlaylistVideo.find({ playlistId: playlist._id })
            .sort('orderIndex');

        res.json({ playlist, videos });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Playlist not found' });
        }
        res.status(500).send('Server error');
    }
};

exports.getPublicPlaylist = async (req, res) => {
    try {
        const playlist = await CustomPlaylist.findById(req.params.id)
            .populate('creatorId', 'name');

        if (!playlist) {
            return res.status(404).json({ msg: 'Playlist not found' });
        }

        

        if (playlist.visibility !== 'link') {
            // If caller is the creator, allow it? 
            // Requirement says: "if visibility === 'link', anyone can fetch it"
            // But for public view, we force it to be link.
            // If creator is viewing their own private playlist via public link, maybe check auth?
            // For now, adhere to strict requirement: access only if 'link'
            return res.status(403).json({ msg: 'This playlist is private' });
        }

        const videos = await CustomPlaylistVideo.find({ playlistId: playlist._id })
            .sort('orderIndex');

        res.json({ playlist, videos });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Playlist not found' });
        }
        res.status(500).send('Server error');
    }
}

exports.updateVisibility = async (req, res) => {
    try {
        const playlist = await CustomPlaylist.findOne({
            _id: req.params.id,
            creatorId: req.user.id
        });

        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        const { visibility } = req.body;
        if (!['private', 'link'].includes(visibility)) {
            return res.status(400).json({ msg: 'Invalid visibility option' });
        }

        playlist.visibility = visibility;
        await playlist.save();
        res.json(playlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.addVideoToPlaylist = async (req, res) => {
    try {
        const playlist = await CustomPlaylist.findOne({
            _id: req.params.id,
            creatorId: req.user.id
        });

        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        const { youtubeVideoId } = req.body; // or url

        // Extract ID if URL is passed
        let videoId = youtubeVideoId;
        if (youtubeVideoId.includes('youtube.com') || youtubeVideoId.includes('youtu.be')) {
            const url = new URL(youtubeVideoId);
            if (youtubeVideoId.includes('youtu.be')) {
                videoId = url.pathname.slice(1);
            } else {
                videoId = url.searchParams.get('v');
            }
        }

        if (!videoId) return res.status(400).json({ msg: 'Invalid YouTube Video ID' });

        // Check if already exists in this playlist?
        // Let's allow duplicates like real playlists, or block them?
        // Usually playlists allow duplicates. But let's check basic sanity.
        // Requirement doesn't specify. I'll allow.

        // Fetch details
        const videoData = await fetchVideoDetails(videoId);

        // Find existing max order to append
        const lastVideo = await CustomPlaylistVideo.findOne({ playlistId: playlist._id })
            .sort('-orderIndex');
        const newOrder = lastVideo ? lastVideo.orderIndex + 1 : 0;

        const newVideo = new CustomPlaylistVideo({
            playlistId: playlist._id,
            youtubeVideoId: videoId,
            title: videoData.title,
            thumbnail: videoData.thumbnail,
            duration: videoData.duration,
            orderIndex: newOrder,
            description: videoData.description,
            chapters: videoData.chapters
        });

        await newVideo.save();
        res.json(newVideo);

    } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
    }
};

exports.reorderVideos = async (req, res) => {
    try {
        const playlist = await CustomPlaylist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        if (playlist.creatorId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { videoIds } = req.body; // Array of CustomPlaylistVideo _ids in new order

        if (!Array.isArray(videoIds)) {
            return res.status(400).json({ msg: 'videoIds must be an array' });
        }

        // Bulk write for efficiency
        const operations = videoIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, playlistId: playlist._id }, // Ensure video belongs to playlist
                update: { orderIndex: index }
            }
        }));

        if (operations.length > 0) {
            await CustomPlaylistVideo.bulkWrite(operations);
        }

        res.json({ msg: 'Reordered successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.removeVideo = async (req, res) => {
    try {
        const playlist = await CustomPlaylist.findOne({
            _id: req.params.playlistId,
            creatorId: req.user.id
        });

        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        await CustomPlaylistVideo.findOneAndDelete({
            _id: req.params.videoId,
            playlistId: playlist._id
        });

        res.json({ msg: 'Video removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
exports.syncCustomVideo = async (req, res) => {
    try {
        const video = await CustomPlaylistVideo.findOne({
            _id: req.params.videoId,
            playlistId: req.params.id
        });

        if (!video) return res.status(404).json({ msg: 'Video not found' });

        // Verify ownership via playlist
        const playlist = await CustomPlaylist.findOne({
            _id: req.params.id,
            creatorId: req.user.id
        });
        if (!playlist) return res.status(403).json({ msg: 'Not authorized' });

        const newData = await fetchVideoDetails(video.youtubeVideoId);

        video.title = newData.title;
        video.thumbnail = newData.thumbnail;
        video.duration = newData.duration;
        video.description = newData.description;
        video.chapters = newData.chapters;

        await video.save();
        res.json(video);
    } catch (err) {
        console.error('Sync Error:', err.message);
        res.status(500).json({ msg: 'Sync Failed: ' + err.message });
    }
};

exports.importYoutubePlaylistToCustom = async (req, res) => {
    try {
        const { id } = req.params;
        const { playlistUrl } = req.body;

        const playlist = await CustomPlaylist.findOne({ _id: id, creatorId: req.user.id });
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        const url = new URL(playlistUrl);
        const youtubePlaylistId = url.searchParams.get('list');
        if (!youtubePlaylistId) return res.status(400).json({ msg: 'Invalid YouTube Playlist URL' });

        const data = await fetchPlaylistData(youtubePlaylistId);
        if (!data || !data.videos || !data.videos.length) {
            return res.status(400).json({ msg: 'No videos found in this YouTube playlist' });
        }

        // Find current last order
        const lastVideo = await CustomPlaylistVideo.findOne({ playlistId: playlist._id }).sort('-orderIndex');
        let currentOrder = lastVideo ? lastVideo.orderIndex + 1 : 0;

        const newVideos = data.videos.map((v, index) => ({
            playlistId: playlist._id,
            youtubeVideoId: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail,
            duration: v.durationSecs || 0,
            orderIndex: currentOrder + index,
            description: v.description,
            chapters: v.chapters
        }));

        await CustomPlaylistVideo.insertMany(newVideos);
        res.json({ msg: `Successfully imported ${newVideos.length} videos`, count: newVideos.length });

    } catch (err) {
        console.error('YT Playlist Import Error:', err.message);
        res.status(500).json({ msg: 'Import Failed: ' + err.message });
    }
};

exports.addPlanTubePlaylistToCustom = async (req, res) => {
    try {
        const { id } = req.params; // Custom Playlist ID
        const { sourcePlaylistId } = req.body; // Internal Playlist ID

        const targetPlaylist = await CustomPlaylist.findOne({ _id: id, creatorId: req.user.id });
        if (!targetPlaylist) return res.status(404).json({ msg: 'Target custom playlist not found' });

        // Find videos from the source playlist
        // Note: These are 'Video' documents which might refer to 'SharedVideo'
        const sourceVideos = await Video.find({ playlistId: sourcePlaylistId }).populate('sharedVideoId').sort('position');
        if (!sourceVideos.length) return res.status(404).json({ msg: 'Source playlist is empty or not found' });

        // Find current last order
        const lastVideo = await CustomPlaylistVideo.findOne({ playlistId: targetPlaylist._id }).sort('-orderIndex');
        let currentOrder = lastVideo ? lastVideo.orderIndex + 1 : 0;

        const newVideos = sourceVideos.map((v, index) => {
            const vidData = v.sharedVideoId || v;
            return {
                playlistId: targetPlaylist._id,
                youtubeVideoId: vidData.youtubeId || vidData.videoId,
                title: vidData.title,
                thumbnail: vidData.thumbnail,
                duration: vidData.durationSecs || 0, // Need to be careful with string vs number durations
                orderIndex: currentOrder + index,
                description: vidData.description,
                chapters: vidData.chapters
            };
        });

        await CustomPlaylistVideo.insertMany(newVideos);
        res.json({ msg: `Successfully added ${newVideos.length} videos from library`, count: newVideos.length });

    } catch (err) {
        console.error('Library Import Error:', err.message);
        res.status(500).json({ msg: 'Import Failed: ' + err.message });
    }
};
