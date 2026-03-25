const Playlist = require('../models/Playlist');
const UserPlaylist = require('../models/UserPlaylist');
const Video = require('../models/Video');
const SharedVideo = require('../models/SharedVideo');
const Schedule = require('../models/Schedule');
const axios = require('axios');

const { parseDuration, formatDuration, parseChapters } = require('../utils/videoUtils');

const { fetchSingleVideoData, fetchPlaylistData } = require('../utils/youtubeUtils');

exports.importPlaylist = async (req, res) => {
    const { playlistUrl } = req.body;
    try {
        const url = new URL(playlistUrl);
        const playlistId = url.searchParams.get('list');
        const videoId = url.searchParams.get('v') || url.pathname.slice(1);

        // Case 1: Playlist
        if (playlistId) {
            // 1. Check if global metadata exists
            let playlist = await Playlist.findOne({ playlistId });

            if (!playlist) {
                // Fetch from YouTube and save globally
                const data = await fetchPlaylistData(playlistId);
                playlist = new Playlist({
                    playlistTitle: data.playlistTitle,
                    playlistId,
                    thumbnail: data.thumbnail,
                });
                await playlist.save();

                // Process each video: find or create SharedVideo, then create Video junction
                for (let i = 0; i < data.videos.length; i++) {
                    const videoData = data.videos[i];

                    // Find or create SharedVideo
                    let sharedVideo = await SharedVideo.findOne({ youtubeId: videoData.videoId });
                    if (!sharedVideo) {
                        sharedVideo = new SharedVideo({
                            youtubeId: videoData.videoId,
                            title: videoData.title,
                            thumbnail: videoData.thumbnail,
                            duration: videoData.duration,
                            description: videoData.description,
                            chapters: videoData.chapters
                        });
                        await sharedVideo.save();
                        console.log(`✅ Created SharedVideo for YouTube ID: ${videoData.videoId}`);
                    } else {
                        console.log(`♻️ Reusing SharedVideo for YouTube ID: ${videoData.videoId}`);
                    }

                    // Create Video junction record
                    const video = new Video({
                        sharedVideoId: sharedVideo._id,
                        playlistId: playlist._id,
                        position: videoData.position,
                        // Keep deprecated fields for backward compatibility
                        videoId: videoData.videoId,
                        title: videoData.title,
                        thumbnail: videoData.thumbnail,
                        duration: videoData.duration,
                        description: videoData.description,
                        chapters: videoData.chapters
                    });
                    await video.save();
                }

                console.log(`📦 Imported playlist with ${data.videos.length} videos`);
            }

            // 2. Link to user if logged in
            if (req.user) {
                let userPlaylist = await UserPlaylist.findOne({ userId: req.user.id, playlistId: playlist._id });
                if (userPlaylist) {
                    return res.status(400).json({ msg: 'Playlist already in your library' });
                }
                userPlaylist = new UserPlaylist({
                    userId: req.user.id,
                    playlistId: playlist._id
                });
                await userPlaylist.save();
            }

            const videos = await Video.find({ playlistId: playlist._id })
                .populate('sharedVideoId')
                .sort('position');
            return res.json({ playlist, videos });
        }

        // Case 2: Single Video
        if (videoId && (playlistUrl.includes('youtube.com') || playlistUrl.includes('youtu.be'))) {
            const cleanVideoId = videoId.includes('/') ? videoId.split('/').pop() : videoId;

            // 1. Check if global metadata exists (as a standalone playlist)
            let playlist = await Playlist.findOne({ playlistId: `VIDEO_${cleanVideoId}` });

            if (!playlist) {
                const videoData = await fetchSingleVideoData(cleanVideoId);
                playlist = new Playlist({
                    playlistTitle: videoData.title,
                    playlistId: `VIDEO_${cleanVideoId}`,
                    thumbnail: videoData.thumbnail,
                });
                await playlist.save();

                // Find or create SharedVideo
                let sharedVideo = await SharedVideo.findOne({ youtubeId: cleanVideoId });
                if (!sharedVideo) {
                    sharedVideo = new SharedVideo({
                        youtubeId: cleanVideoId,
                        title: videoData.title,
                        thumbnail: videoData.thumbnail,
                        duration: videoData.duration,
                        description: videoData.description,
                        chapters: videoData.chapters
                    });
                    await sharedVideo.save();
                    console.log(`✅ Created SharedVideo for YouTube ID: ${cleanVideoId}`);
                }

                // Create Video junction record
                const video = new Video({
                    sharedVideoId: sharedVideo._id,
                    playlistId: playlist._id,
                    position: 0,
                    // Keep deprecated fields for backward compatibility
                    videoId: videoData.videoId,
                    title: videoData.title,
                    thumbnail: videoData.thumbnail,
                    duration: videoData.duration,
                    description: videoData.description,
                    chapters: videoData.chapters
                });
                await video.save();
            }

            // 2. Link to user if logged in
            if (req.user) {
                let userPlaylist = await UserPlaylist.findOne({ userId: req.user.id, playlistId: playlist._id });
                if (userPlaylist) {
                    const video = await Video.findOne({ playlistId: playlist._id })
                        .populate('sharedVideoId');
                    return res.json({ playlist, video });
                }
                userPlaylist = new UserPlaylist({
                    userId: req.user.id,
                    playlistId: playlist._id
                });
                await userPlaylist.save();
            }

            const video = await Video.findOne({ playlistId: playlist._id })
                .populate('sharedVideoId');
            return res.json({ playlist, video });
        }

        res.status(400).json({ msg: 'Could not identify a YouTube Playlist or Video' });
    } catch (err) {
        console.error('Import Error:', err.message);
        res.status(500).json({ msg: 'Import Error: ' + err.message });
    }
};

exports.fetchMetadata = async (req, res) => {
    const { url: playlistUrl } = req.query;
    if (!playlistUrl) return res.status(400).json({ msg: 'URL is required' });

    try {
        const url = new URL(playlistUrl);
        const playlistId = url.searchParams.get('list');
        const videoId = url.searchParams.get('v') || url.pathname.slice(1).split('/').pop();

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) throw new Error('YouTube API Key is missing');

        if (playlistId) {
            const playlistRes = await axios.get(`https://www.googleapis.com/youtube/v3/playlists`, {
                params: { part: 'snippet', id: playlistId, key: apiKey }
            });
            if (!playlistRes.data.items.length) throw new Error('Playlist not found');
            const snippet = playlistRes.data.items[0].snippet;
            return res.json({
                title: snippet.title,
                description: snippet.description,
                thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
                type: 'playlist'
            });
        }

        if (videoId && (playlistUrl.includes('youtube.com') || playlistUrl.includes('youtu.be'))) {
            const videoRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
                params: { part: 'snippet', id: videoId, key: apiKey }
            });
            if (!videoRes.data.items.length) throw new Error('Video not found');
            const snippet = videoRes.data.items[0].snippet;
            return res.json({
                title: snippet.title,
                description: snippet.description,
                thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
                type: 'video'
            });
        }

        res.status(400).json({ msg: 'Unsupported YouTube URL' });
    } catch (err) {
        console.error('Metadata Fetch Error:', err.message);
        res.status(500).json({ msg: 'Fetch Error: ' + err.message });
    }
};

exports.togglePin = async (req, res) => {
    try {
        const userPlaylist = await UserPlaylist.findOne({ playlistId: req.params.id, userId: req.user.id });
        if (!userPlaylist) return res.status(404).json({ msg: 'Playlist not found in your library' });

        userPlaylist.isPinned = !userPlaylist.isPinned;
        await userPlaylist.save();
        res.json(userPlaylist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getPlaylistById = async (req, res) => {
    try {
        // 1. Try finding global metadata
        const playlist = await Playlist.findById(req.params.id);

        if (playlist) {
            // Find if current user has this linked
            let userLink = null;
            if (req.user) {
                userLink = await UserPlaylist.findOne({ userId: req.user.id, playlistId: playlist._id });
            }

            // Access Control: 
            // If it's a global playlist (no userId on Playlist or it's shared in a group)
            // or if it's the user's own linked playlist, allow access.

            // For now, if the Playlist document exists and it's not a legacy private playlist, allow access
            // In the new system, Playlist is global. 

            const Group = require('../models/Group');
            const GroupPlaylist = require('../models/GroupPlaylist');

            let isShared = false;
            if (req.user) {
                const userGroups = await Group.find({ members: req.user.id }).select('_id');
                const groupIds = userGroups.map(g => g._id);

                isShared = await GroupPlaylist.findOne({
                    playlistId: playlist._id,
                    groupId: { $in: groupIds }
                });
            }

            // Simplified: If it exists globally, allow viewing videos. 
            // Personal settings (goal, pinning) come from UserPlaylist (userLink).
            const videos = await Video.find({ playlistId: playlist._id })
                .populate('sharedVideoId')
                .sort('position');
            return res.json({
                playlist: {
                    ...playlist.toObject(),
                    isPinned: userLink?.isPinned || false,
                    goal: userLink?.goal
                },
                videos
            });
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
        if (customPlaylist.visibility === 'private') {
            if (!req.user || (customPlaylist.creatorId._id || customPlaylist.creatorId).toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Access denied (Private)' });
            }
        }

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
        const userPlaylists = await UserPlaylist.find({ userId: req.user.id })
            .populate('playlistId')
            .sort({ isPinned: -1, createdAt: -1 });

        // Map to expected format
        const formatted = userPlaylists.filter(up => up.playlistId).map(up => ({
            ...up.playlistId.toObject(),
            isPinned: up.isPinned,
            goal: up.goal,
            userPlaylistId: up._id
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getPlaylistVideos = async (req, res) => {
    try {
        let videos = await Video.find({ playlistId: req.params.id })
            .populate('sharedVideoId')
            .sort('position');

        if (!videos.length) {
            // Check custom
            const CustomPlaylistVideo = require('../models/CustomPlaylistVideo');
            videos = await CustomPlaylistVideo.find({ playlistId: req.params.id })
                .sort('orderIndex');
        }

        res.json(videos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deletePlaylist = async (req, res) => {
    try {
        // 1. Try Imported Playlist (Remove UserLink)
        const userPlaylist = await UserPlaylist.findOne({ playlistId: req.params.id, userId: req.user.id });

        if (userPlaylist) {
            // Delete associated schedules (personal to user)
            const videos = await Video.find({ playlistId: req.params.id })
                .populate('sharedVideoId');
            const videoIds = videos.map(v => v._id);
            await Schedule.deleteMany({ videoId: { $in: videoIds }, userId: req.user.id });

            await UserPlaylist.findByIdAndDelete(userPlaylist._id);
            // Note: We don't delete the global Playlist or Video records here
            return res.json({ msg: 'Playlist removed from your library' });
        }

        // 2. Try Custom Playlist
        const CustomPlaylist = require('../models/CustomPlaylist');
        const CustomPlaylistVideo = require('../models/CustomPlaylistVideo');

        if (customPlaylist) {
            // Delete associated schedules for these custom videos
            const customVideos = await CustomPlaylistVideo.find({ playlistId: customPlaylist._id });
            const customVideoIds = customVideos.map(cv => cv._id);
            await Schedule.deleteMany({ videoId: { $in: customVideoIds }, userId: req.user.id });

            await CustomPlaylistVideo.deleteMany({ playlistId: customPlaylist._id });
            await CustomPlaylist.findByIdAndDelete(customPlaylist._id);
            return res.json({ msg: 'Playlist removed and schedules cleared' });
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

        // Handle standalone video 'playlists'
        if (playlist.playlistId.startsWith('VIDEO_')) {
            const video = await Video.findOne({ playlistId: playlist._id })
                .populate('sharedVideoId');
            if (!video) return res.status(404).json({ msg: 'Video not found' });

            const newData = await fetchSingleVideoData(video.videoId);
            await Video.updateOne({ _id: video._id }, { $set: { ...newData } });

            playlist.playlistTitle = newData.title;
            playlist.thumbnail = newData.thumbnail;
            await playlist.save();

            return res.json({ msg: 'Synced Standalone Video', modified: 1, total: 1 });
        }

        // 1. Fetch latest from YouTube
        const latestData = await fetchPlaylistData(playlist.playlistId);

        // 2. Update Playlist Title & Thumbnail if changed
        playlist.playlistTitle = latestData.playlistTitle;
        playlist.thumbnail = latestData.thumbnail;
        await playlist.save();

        // 3. Prepare Bulk Operations for Videos
        // This will update existing videos (refreshing title, description, duration, chapters)
        // and insert new ones (upsert: true)
        const ops = latestData.videos.map(v => ({
            updateOne: {
                filter: { playlistId: playlist._id, videoId: v.videoId },
                update: { $set: { ...v, playlistId: playlist._id } },
                upsert: true
            }
        }));

        const result = await Video.bulkWrite(ops);

        res.json({
            msg: 'Synced',
            added: result.upsertedCount,
            modified: result.modifiedCount,
            total: latestData.videos.length
        });
    } catch (err) {
        console.error('Sync Error:', err.message);
        res.status(500).json({ msg: 'Sync Failed: ' + err.message });
    }
};

exports.getLibraryStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch All Imported Playlists via UserPlaylist link
        const userPlaylists = await UserPlaylist.find({
            userId
        }).populate('playlistId').sort({ isPinned: -1, createdAt: -1 });

        // 2. Fetch Custom Playlists
        const CustomPlaylist = require('../models/CustomPlaylist');
        const customPlaylists = await CustomPlaylist.find({ creatorId: userId }).sort({ createdAt: -1 });

        // 3. Get Video Counts for Imported
        const playlistIds = userPlaylists.filter(up => up.playlistId).map(up => up.playlistId._id);
        const importedVideoCounts = await Video.aggregate([
            { $match: { playlistId: { $in: playlistIds } } },
            { $group: { _id: '$playlistId', count: { $sum: 1 } } }
        ]);
        const importedCountMap = {};
        importedVideoCounts.forEach(c => importedCountMap[c._id.toString()] = c.count);

        // 3.5. Fetch Video Document IDs for standalone videos (VIDEO_*)
        const standalonePlaylistIds = userPlaylists
            .filter(up => up.playlistId && up.playlistId.playlistId.startsWith('VIDEO_'))
            .map(up => up.playlistId._id);

        const standaloneVideos = await Video.find({ playlistId: { $in: standalonePlaylistIds } })
            .populate('sharedVideoId');
        const videoDocIdMap = {};
        standaloneVideos.forEach(v => videoDocIdMap[v.playlistId.toString()] = v._id);

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
            ...userPlaylists.filter(up => up.playlistId).map(up => {
                const p = up.playlistId;
                const isStandalone = p.playlistId.startsWith('VIDEO_');
                return {
                    _id: isStandalone ? p.playlistId.replace('VIDEO_', '') : p._id,
                    dbId: p._id,
                    videoDbId: isStandalone ? videoDocIdMap[p._id.toString()] : undefined,
                    title: p.playlistTitle,
                    thumbnail: p.thumbnail,
                    type: isStandalone ? 'video' : 'playlist',
                    isPinned: up.isPinned,
                    videoCount: isStandalone ? 1 : (importedCountMap[p._id.toString()] || 0),
                    createdAt: up.createdAt,
                    originalId: p._id,
                    goal: up.goal
                };
            }),
            ...customPlaylists.map(p => ({
                _id: p._id,
                title: p.title,
                thumbnail: 'https://images.unsplash.com/photo-1611162617474-53a479261899?auto=format&fit=crop&q=80&w=400',
                type: 'custom',
                isPinned: false,
                videoCount: customCountMap[p._id.toString()] || 0,
                createdAt: p.createdAt,
                originalId: p._id
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

        if (!importedPlaylist) return res.status(404).json({ msg: 'Playlist/Video not found' });

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
