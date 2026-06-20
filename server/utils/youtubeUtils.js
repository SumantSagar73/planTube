const axios = require('axios');
const { parseDuration, formatDuration, parseChapters } = require('./videoUtils');

const ytAxios = axios.create({ timeout: 10000 });

const fetchSingleVideoData = async (videoId) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YouTube API Key is missing');

    const res = await ytAxios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
            part: 'snippet,contentDetails',
            id: videoId,
            key: apiKey
        }
    });

    if (!res.data.items.length) throw new Error('Video not found');

    const item = res.data.items[0];
    const description = item.snippet.description || '';

    const durationSecs = parseDuration(item.contentDetails.duration);
    return {
        videoId: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        duration: formatDuration(item.contentDetails.duration),
        durationSecs,
        position: 0,
        description,
        chapters: parseChapters(description, durationSecs)
    };
};

const fetchPlaylistData = async (playlistId) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YouTube API Key is missing');

    const playlistResponse = await ytAxios.get(`https://www.googleapis.com/youtube/v3/playlists`, {
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
        const videoResponse = await ytAxios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
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

        const detailsResponse = await ytAxios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'snippet,contentDetails',
                id: videoIds,
                key: apiKey
            }
        });

        const detailsMap = {};
        detailsResponse.data.items.forEach(item => {
            const desc = item.snippet.description || '';
            const durationSecs = parseDuration(item.contentDetails.duration);
            detailsMap[item.id] = {
                duration: formatDuration(item.contentDetails.duration),
                durationSecs,
                description: desc,
                chapters: parseChapters(desc, durationSecs)
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
                durationSecs: details.durationSecs || 0,
                description: details.description || '',
                chapters: details.chapters || []
            };
        });

        videos = [...videos, ...mappedItems];
        nextPageToken = videoResponse.data.nextPageToken;
    } while (nextPageToken);

    return { playlistTitle, thumbnail, videos };
};

module.exports = {
    fetchSingleVideoData,
    fetchPlaylistData
};
