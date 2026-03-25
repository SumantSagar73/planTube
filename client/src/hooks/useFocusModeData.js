import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { cache } from '../utils/cache';

const useFocusModeData = (videoId) => {
    const [video, setVideo] = useState(null);
    const [playlist, setPlaylist] = useState(null);
    const [allVideos, setAllVideos] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [playlistSchedules, setPlaylistSchedules] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSchedule = useCallback(async (currentVideo) => {
        try {
            const scheduleRes = await api.get(`/schedules/playlist/${currentVideo.playlistId}`);
            setPlaylistSchedules(scheduleRes.data);
            const videoSchedule = scheduleRes.data.find(s => {
                const sVideoId = (typeof s.videoId === 'object') ? s.videoId._id : s.videoId;
                return sVideoId === currentVideo._id;
            });
            setSchedule(videoSchedule);
        } catch (error) {
            console.log("No schedule found or error fetching schedule");
        }
    }, []);

    const fetchVideoData = useCallback(async () => {
        if (!video) setInitialLoading(true);
        else setVideoLoading(true);

        try {
            const cachedVideo = cache.get(`video_${videoId}`);
            if (cachedVideo) {
                setVideo(cachedVideo.video);
                setPlaylist(cachedVideo.playlist);
                setAllVideos(cachedVideo.allVideos);
                setInitialLoading(false);
                setVideoLoading(false);
                fetchSchedule(cachedVideo.video);
                return;
            }

            const videoRes = await api.get(`/videos/${videoId}`);
            let playlistData = null;
            let videosData = [];

            try {
                const playlistRes = await api.get(`/playlists/${videoRes.data.playlistId}`);
                if (playlistRes.data.videos) {
                    playlistData = playlistRes.data.playlist;
                    videosData = playlistRes.data.videos;
                } else {
                    playlistData = playlistRes.data;
                    const videosRes = await api.get(`/playlists/${videoRes.data.playlistId}/videos`);
                    videosData = videosRes.data;
                }
            } catch (pErr) {
                console.warn("Failed to fetch playlist details", pErr);
                videosData = [videoRes.data];
            }

            const payload = {
                video: videoRes.data,
                playlist: playlistData,
                allVideos: Array.isArray(videosData) ? videosData : []
            };

            setVideo(payload.video);
            setPlaylist(payload.playlist);
            setAllVideos(payload.allVideos);
            cache.set(`video_${videoId}`, payload);
            await fetchSchedule(payload.video);

            setInitialLoading(false);
            setVideoLoading(false);
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
            setInitialLoading(false);
            setVideoLoading(false);
        }
    }, [videoId, video, fetchSchedule]);

    useEffect(() => {
        fetchVideoData();
    }, [videoId]);

    return {
        video,
        playlist,
        allVideos,
        schedule,
        setSchedule,
        playlistSchedules,
        setPlaylistSchedules,
        initialLoading,
        videoLoading,
        error,
        fetchVideoData
    };
};

export default useFocusModeData;
