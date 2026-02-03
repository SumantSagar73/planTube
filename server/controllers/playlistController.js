const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const Schedule = require('../models/Schedule');
const axios = require('axios');

const { parseDuration, parseChapters } = require('../utils/videoUtils');

const formatDuration = (isoDuration) => {
    // Keep for legacy or display purposes if needed, strictly we might just use the seconds now
    // But existing frontend might expect string. Let's keep consistent.
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    const description = item.snippet.description || '';

    return {
        videoId: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        duration: formatDuration(item.contentDetails.duration),
        position: 0,
        description,
        chapters: parseChapters(description)
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
                part: 'snippet,contentDetails',
                id: videoIds,
                key: apiKey
            }
        });

        const detailsMap = {};
        detailsResponse.data.items.forEach(item => {
            const desc = item.snippet.description || '';
            detailsMap[item.id] = {
                duration: formatDuration(item.contentDetails.duration),
                description: desc,
                chapters: parseChapters(desc)
            };
        });

        const mappedItems = items.map(item => {
            const vid = item.snippet.resourceId.videoId;
            const details = detailsMap[vid] || {};

            return {
                videoId: vid,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
                position: item.snippet.position,
                duration: details.duration || '0:00',
                description: details.description || '',
                chapters: details.chapters || []
            };
        });

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
        // 1. Try finding in Imported Playlists (Legacy/Standard)
        const playlist = await Playlist.findById(req.params.id);

        if (playlist) {
            // --- Existing Logic for Imported Playlists ---
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
            // --- End Existing Logic ---
        }

        // 2. If not found, try Custom Playlists
        const CustomPlaylist = require('../models/CustomPlaylist');
        const CustomPlaylistVideo = require('../models/CustomPlaylistVideo');

        const customPlaylist = await CustomPlaylist.findById(req.params.id)
            .populate('creatorId', 'name');

        if (!customPlaylist) {
            return res.status(404).json({ msg: 'Playlist not found' });
        }

        // Access Control for Custom Playlist
        // Visibility: 'private' (owner only) or 'link' (public)
        if (customPlaylist.visibility === 'private') {
            if (!req.user || (customPlaylist.creatorId._id || customPlaylist.creatorId).toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Access denied (Private)' });
            }
        }

        // Fetch videos for custom playlist (as requested in reqs: return playlist + videos)
        const videos = await CustomPlaylistVideo.find({ playlistId: customPlaylist._id })
            .sort('orderIndex');

        return res.json({ playlist: customPlaylist, videos });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Playlist not found' });
        }
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
        // 1. Try Imported Playlist
        const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user.id });

        if (playlist) {
            const videos = await Video.find({ playlistId: playlist._id });
            const videoIds = videos.map(v => v._id);
            await Schedule.deleteMany({ videoId: { $in: videoIds } });
            await Video.deleteMany({ playlistId: playlist._id });
            await Playlist.findByIdAndDelete(playlist._id);
            return res.json({ msg: 'Playlist removed' });
        }

        // 2. Try Custom Playlist
        const CustomPlaylist = require('../models/CustomPlaylist');
        const CustomPlaylistVideo = require('../models/CustomPlaylistVideo');

        const customPlaylist = await CustomPlaylist.findOne({ _id: req.params.id, creatorId: req.user.id });

        if (customPlaylist) {
            await CustomPlaylistVideo.deleteMany({ playlistId: customPlaylist._id });
            await CustomPlaylist.findByIdAndDelete(customPlaylist._id);
            return res.json({ msg: 'Playlist removed' });
        }

        return res.status(404).json({ msg: 'Playlist not found' });
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

exports.getLibraryStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch Imported Playlists (Standard) - Exclude SINGLES container
        const importedPlaylists = await Playlist.find({
            userId,
            playlistId: { $ne: 'SINGLES' }
        }).sort({ isPinned: -1, createdAt: -1 });

        // 1b. Fetch SINGLES Container & Videos
        const singlesPlaylist = await Playlist.findOne({ userId, playlistId: 'SINGLES' });
        let singleVideos = [];
        if (singlesPlaylist) {
            singleVideos = await Video.find({ playlistId: singlesPlaylist._id }).sort({ _id: -1 });
        }

        // 2. Fetch Custom Playlists
        const CustomPlaylist = require('../models/CustomPlaylist');
        const customPlaylists = await CustomPlaylist.find({ creatorId: userId }).sort({ createdAt: -1 });

        // 3. Get Video Counts for Imported
        const importedIds = importedPlaylists.map(p => p._id);
        const importedVideoCounts = await Video.aggregate([
            { $match: { playlistId: { $in: importedIds } } },
            { $group: { _id: '$playlistId', count: { $sum: 1 } } }
        ]);
        const importedCountMap = {};
        importedVideoCounts.forEach(c => importedCountMap[c._id.toString()] = c.count);

        // 4. Get Video Counts for Custom
        const CustomPlaylistVideo = require('../models/CustomPlaylistVideo');
        const customIds = customPlaylists.map(p => p._id);
        const customVideoCounts = await CustomPlaylistVideo.aggregate([
            { $match: { playlistId: { $in: customIds } } },
            { $group: { _id: '$playlistId', count: { $sum: 1 } } }
        ]);
        const customCountMap = {};
        customVideoCounts.forEach(c => customCountMap[c._id.toString()] = c.count);

        // 5. Merge and Format
        const unifiedLibrary = [
            ...importedPlaylists.map(p => ({
                _id: p._id,
                title: p.playlistTitle,
                thumbnail: p.thumbnail,
                type: 'imported',
                isPinned: p.isPinned,
                videoCount: importedCountMap[p._id.toString()] || 0,
                createdAt: p.createdAt,
                originalId: p._id
            })),
            ...customPlaylists.map(p => ({
                _id: p._id,
                title: p.title,
                thumbnail: 'https://images.unsplash.com/photo-1611162617474-53a479261899?auto=format&fit=crop&q=80&w=400',
                type: 'custom',
                isPinned: false,
                videoCount: customCountMap[p._id.toString()] || 0,
                createdAt: p.createdAt,
                originalId: p._id
            })),
            ...singleVideos.map(v => ({
                _id: v.videoId, // Use YouTube ID for frontend routing if needed, or v._id for DB
                dbId: v._id,
                title: v.title,
                thumbnail: v.thumbnail,
                type: 'video',
                isPinned: v.isPinned,
                videoCount: v.duration, // Reusing field for duration string
                createdAt: v._id.getTimestamp(), // ObjectId has timestamp
                originalId: v._id
            }))
        ];

        // Sort: Pinned first, then Newest
        unifiedLibrary.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(unifiedLibrary);


    } catch (err) {
        console.error('Library Stats Error:', err);
        res.status(500).send('Server Error');
    }
};

exports.syncVideo = async (req, res) => {
    try {
        const { id, videoId } = req.params;
        const CustomPlaylist = require('../models/CustomPlaylist');
        const CustomPlaylistVideo = require('../models/CustomPlaylistVideo');

        // Check if it's a Custom Playlist Video first
        // We can tell by checking if the video exists in the CustomPlaylistVideo collection
        const customVideo = await CustomPlaylistVideo.findOne({ _id: videoId, playlistId: id });

        if (customVideo) {
            // Verify ownership
            const playlist = await CustomPlaylist.findOne({ _id: id, creatorId: req.user.id });
            if (!playlist) return res.status(403).json({ msg: 'Not authorized' });

            // Fetch new details
            const newData = await fetchSingleVideoData(customVideo.youtubeVideoId);

            // Update in place
            customVideo.title = newData.title;
            customVideo.thumbnail = newData.thumbnail;
            customVideo.duration = newData.duration;
            customVideo.description = newData.description;
            customVideo.chapters = newData.chapters;

            await customVideo.save();
            return res.json(customVideo);
        }

        // Check Imported Playlist Video
        const Video = require('../models/Video');
        const Playlist = require('../models/Playlist');

        const importedPlaylist = await Playlist.findOne({ _id: id });

        // If not found at all
        if (!importedPlaylist) return res.status(404).json({ msg: 'Playlist/Video not found' });

        // Access Check for Imported
        // For now, allow sync if user owns it OR if it's a public/group one?
        // Let's stick to owner for safety, or just loose for now if it helps fixes.
        // Assuming owner or general user for now (if simple app).
        // Stricter: Only owner can sync.
        if (importedPlaylist.userId && importedPlaylist.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to sync this playlist' });
        }

        const video = await Video.findOne({ _id: videoId, playlistId: id });
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        // Fetch new details
        const newData = await fetchSingleVideoData(video.videoId);

        // Update in place
        video.title = newData.title;
        video.thumbnail = newData.thumbnail;
        video.duration = newData.duration;
        video.description = newData.description;
        video.chapters = newData.chapters;

        await video.save();
        res.json(video);

    } catch (err) {
        console.error('Sync Video Error:', err);
        res.status(500).json({ msg: 'Sync Failed' });
    }
};
