const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const Schedule = require('../models/Schedule');
const axios = require('axios');

const formatDuration = (isoDuration) => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const fetchSingleVideoData = async (videoId) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YouTube API Key is missing');

    const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
            part: 'snippet,contentDetails',
            id: videoId,
            key: apiKey
        }
    });

    if (!res.data.items.length) throw new Error('Video not found');

    const item = res.data.items[0];
    return {
        videoId: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        duration: formatDuration(item.contentDetails.duration),
        position: 0
    };
};

const fetchPlaylistData = async (playlistId) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YouTube API Key is missing');

    const playlistResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlists`, {
        params: {
            part: 'snippet',
            id: playlistId,
            key: apiKey,
        }
    });

    if (!playlistResponse.data.items.length) {
        throw new Error('Playlist not found');
    }

    const snippet = playlistResponse.data.items[0].snippet;
    const playlistTitle = snippet.title;
    const thumbnail = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '';

    let videos = [];
    let nextPageToken = '';

    do {
        const videoResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
            params: {
                part: 'snippet,contentDetails',
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken,
                key: apiKey,
            }
        });

        const items = videoResponse.data.items;
        const videoIds = items.map(item => item.snippet.resourceId.videoId).join(',');

        const detailsResponse = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'contentDetails',
                id: videoIds,
                key: apiKey
            }
        });

        const durationMap = {};
        detailsResponse.data.items.forEach(item => {
            durationMap[item.id] = formatDuration(item.contentDetails.duration);
        });

        const mappedItems = items.map(item => ({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            position: item.snippet.position,
            duration: durationMap[item.snippet.resourceId.videoId] || '0:00'
        }));

        videos = [...videos, ...mappedItems];
        nextPageToken = videoResponse.data.nextPageToken;
    } while (nextPageToken);

    return { playlistTitle, thumbnail, videos };
};

exports.importPlaylist = async (req, res) => {
    const { playlistUrl } = req.body;
    try {
        const url = new URL(playlistUrl);
        const playlistId = url.searchParams.get('list');
        const videoId = url.searchParams.get('v') || url.pathname.slice(1);

        // Case 1: Playlist
        if (playlistId) {
            let query = { playlistId };
            if (req.user) query.userId = req.user.id;
            else query.userId = { $exists: false };

            let playlist = await Playlist.findOne(query);
            if (playlist && req.user) return res.status(400).json({ msg: 'Playlist already imported' });
            if (playlist) {
                const videos = await Video.find({ playlistId: playlist._id }).sort('position');
                return res.json({ playlist, videos });
            }

            const data = await fetchPlaylistData(playlistId);
            playlist = new Playlist({
                userId: req.user?.id,
                playlistTitle: data.playlistTitle,
                playlistId,
                thumbnail: data.thumbnail,
            });
            await playlist.save();

            const videoDocs = data.videos.map(v => ({ ...v, playlistId: playlist._id }));
            await Video.insertMany(videoDocs);
            return res.json({ playlist, videos: videoDocs });
        }

        // Case 2: Single Video
        if (videoId && (playlistUrl.includes('youtube.com') || playlistUrl.includes('youtu.be'))) {
            const cleanVideoId = videoId.includes('/') ? videoId.split('/').pop() : videoId;

            // Look for a "Single Videos" playlist container or create one
            let query = { playlistId: 'SINGLES' };
            if (req.user) query.userId = req.user.id;
            else query.userId = { $exists: false };

            let container = await Playlist.findOne(query);
            if (!container) {
                container = new Playlist({
                    userId: req.user?.id,
                    playlistTitle: 'Single Lectures',
                    playlistId: 'SINGLES',
                    thumbnail: 'https://images.unsplash.com/photo-1611162617474-53a479261899?auto=format&fit=crop&q=80&w=400',
                });
                await container.save();
            }

            // Check if video already exists in this container
            const existing = await Video.findOne({ playlistId: container._id, videoId: cleanVideoId });
            if (existing) return res.status(400).json({ msg: 'Video already in your Library' });

            const videoData = await fetchSingleVideoData(cleanVideoId);
            const video = new Video({ ...videoData, playlistId: container._id });
            await video.save();

            return res.json({ playlist: container, video });
        }

        res.status(400).json({ msg: 'Could not identify a YouTube Playlist or Video' });
    } catch (err) {
        console.error('Import Error:', err.message);
        res.status(500).json({ msg: 'Import Error: ' + err.message });
    }
};



exports.togglePin = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user.id });
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        playlist.isPinned = !playlist.isPinned;
        await playlist.save();
        res.json(playlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getPlaylistById = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        if (!req.user) {
            return res.json(playlist);
        }

        // If owner, allow access
        if (playlist.userId && playlist.userId.toString() === req.user.id) {
            return res.json(playlist);
        }

        // If generic/guest playlist (no userId), allow access
        if (!playlist.userId) {
            return res.json(playlist);
        }

        // If not owner, check if shared in any of user's groups
        const Group = require('../models/Group');
        const GroupPlaylist = require('../models/GroupPlaylist');

        const userGroups = await Group.find({ members: req.user.id }).select('_id');
        const groupIds = userGroups.map(g => g._id);

        const isShared = await GroupPlaylist.findOne({
            playlistId: playlist._id,
            groupId: { $in: groupIds }
        });

        if (isShared) {
            return res.json(playlist);
        }

        return res.status(403).json({ msg: 'Access denied' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getUserPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ userId: req.user.id }).sort({ isPinned: -1, createdAt: -1 });
        res.json(playlists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getPlaylistVideos = async (req, res) => {
    try {
        const videos = await Video.find({ playlistId: req.params.id }).sort('position');
        res.json(videos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deletePlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user.id });
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        // 1. Find all videos in this playlist
        const videos = await Video.find({ playlistId: playlist._id });
        const videoIds = videos.map(v => v._id);

        // 2. Delete all schedules associated with these videos
        await Schedule.deleteMany({ videoId: { $in: videoIds } });

        // 3. Delete all videos
        await Video.deleteMany({ playlistId: playlist._id });

        // 4. Delete the playlist itself
        await Playlist.findByIdAndDelete(playlist._id);

        res.json({ msg: 'Playlist removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.syncPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user.id });
        if (!playlist) return res.status(404).json({ msg: 'Playlist not found' });

        // Cannot sync single video 'playlists' as they have no source ID
        if (playlist.playlistId === 'SINGLES') {
            return res.json({ msg: 'Synced', added: 0 });
        }

        // 1. Fetch latest from YouTube
        const latestData = await fetchPlaylistData(playlist.playlistId);

        // 2. Get existing video IDs (YouTube IDs) in DB
        const existingVideos = await Video.find({ playlistId: playlist._id });
        const existingYoutubeIds = new Set(existingVideos.map(v => v.videoId));

        // 3. Filter for new videos
        const newVideos = latestData.videos.filter(v => !existingYoutubeIds.has(v.videoId));

        if (newVideos.length > 0) {
            const videoDocs = newVideos.map(v => ({ ...v, playlistId: playlist._id }));
            await Video.insertMany(videoDocs);
        }

        res.json({ msg: 'Synced', added: newVideos.length, total: existingVideos.length + newVideos.length });
    } catch (err) {
        console.error('Sync Error:', err.message);
        res.status(500).json({ msg: 'Sync Failed: ' + err.message });
    }
};

