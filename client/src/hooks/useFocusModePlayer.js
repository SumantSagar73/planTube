import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../services/api';

const useFocusModePlayer = (video, videoId, schedule, setSchedule, setPlaylistSchedules, allVideos, navigate, zenMode, setIsHovering, hoverTimeoutRef) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [captionTracks, setCaptionTracks] = useState([]);
    const [currentCaptionTrack, setCurrentCaptionTrack] = useState(null);
    const [audioTracks, setAudioTracks] = useState([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState(null);
    
    const playerRef = useRef(null);
    const timeIntervalRef = useRef(null);
    const lastTickTimeRef = useRef(0);
    const watchedTimeRef = useRef({});
    const pendingPulseRef = useRef(0);


    const togglePlay = useCallback(() => {
        if (!playerRef.current) return;
        if (isPlaying) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
    }, [isPlaying]);

    const handleVolumeChange = useCallback((e) => {
        const newVol = parseInt(e.target.value);
        setVolume(newVol);
        if (playerRef.current) {
            playerRef.current.setVolume(newVol);
            if (newVol > 0 && isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            }
        }
    }, [isMuted]);

    const adjustVolume = useCallback((delta) => {
        setVolume(prev => {
            const newVol = Math.max(0, Math.min(100, prev + delta));
            if (playerRef.current) {
                playerRef.current.setVolume(newVol);
                if (newVol > 0) {
                    playerRef.current.unMute();
                    setIsMuted(false);
                }
            }
            return newVol;
        });
    }, []);

    const toggleMute = useCallback(() => {
        if (playerRef.current) {
            if (playerRef.current.isMuted()) {
                playerRef.current.unMute();
                setIsMuted(false);
            } else {
                playerRef.current.mute();
                setIsMuted(true);
            }
        } else {
            setIsMuted(prev => !prev);
        }
    }, []);

    const toggleSpeed = useCallback(() => {
        setPlaybackRate(prev => {
            if (!playerRef.current) return prev;
            const speeds = [1, 1.25, 1.5, 2];
            const nextIdx = (speeds.indexOf(prev) + 1) % speeds.length;
            const newSpeed = speeds[nextIdx];
            playerRef.current.setPlaybackRate(newSpeed);
            return newSpeed;
        });
    }, []);

    const cycleSpeedUp = useCallback(() => {
        setPlaybackRate(prev => {
            const speeds = [1, 1.25, 1.5, 2];
            const currIdx = speeds.indexOf(prev);
            const nextIdx = currIdx === -1 ? 0 : Math.min(speeds.length - 1, currIdx + 1);
            const newSpeed = speeds[nextIdx];
            if (playerRef.current) playerRef.current.setPlaybackRate(newSpeed);
            return newSpeed;
        });
    }, []);

    const cycleSpeedDown = useCallback(() => {
        setPlaybackRate(prev => {
            const speeds = [1, 1.25, 1.5, 2];
            const currIdx = speeds.indexOf(prev);
            const nextIdx = currIdx === -1 ? 0 : Math.max(0, currIdx - 1);
            const newSpeed = speeds[nextIdx];
            if (playerRef.current) playerRef.current.setPlaybackRate(newSpeed);
            return newSpeed;
        });
    }, []);

    const handleSeekChange = useCallback((e) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (playerRef.current) playerRef.current.seekTo(newTime);
    }, []);

    const handleSeek = useCallback((seconds) => {
        if (playerRef.current) {
            playerRef.current.seekTo(seconds, true);
            setCurrentTime(seconds);
        }
    }, []);

    const handleToggleComplete = useCallback(async () => {
        try {
            let currentSchedule = schedule;
            if (!currentSchedule) {
                const res = await api.post('/schedules', { videoId: video._id, status: 'pending' });
                currentSchedule = res.data;
                setSchedule(currentSchedule);
            }
            const newStatus = currentSchedule.status === 'completed' ? 'pending' : 'completed';
            await api.put(`/schedules/${currentSchedule._id}`, { status: newStatus });
            setSchedule({ ...currentSchedule, status: newStatus });
            setPlaylistSchedules(prev => prev.map(s => s._id === currentSchedule._id ? { ...s, status: newStatus } : s));
        } catch (err) {
            console.error('Error toggling complete:', err);
        }
    }, [video, schedule, setSchedule, setPlaylistSchedules]);

    const toggleChapter = useCallback(async (idx) => {
        try {
            let currentSchedule = schedule;
            if (!currentSchedule) {
                const res = await api.post('/schedules', { videoId: video._id, status: 'pending' });
                currentSchedule = res.data;
                setSchedule(currentSchedule);
            }
            const currentCompleted = currentSchedule.completedChapters || [];
            let newCompleted = currentCompleted.includes(idx)
                ? currentCompleted.filter(i => i !== idx)
                : [...currentCompleted, idx];

            setSchedule({ ...currentSchedule, completedChapters: newCompleted });
            api.put(`/schedules/${currentSchedule._id}`, { completedChapters: newCompleted }).catch(() => {});
        } catch (err) {
            console.error('Error toggling chapter:', err);
        }
    }, [video, schedule, setSchedule]);

    const handleNextVideo = useCallback(() => {
        const currentIndex = allVideos.findIndex(v => v._id === videoId || v.videoId === videoId);
        if (currentIndex < allVideos.length - 1 && currentIndex !== -1) {
            const nextVideo = allVideos[currentIndex + 1];
            navigate(`/focus/${nextVideo.videoId || nextVideo._id}`);
        }
    }, [allVideos, videoId, navigate]);

    const handlePrevVideo = useCallback(() => {
        const currentIndex = allVideos.findIndex(v => (v._id === videoId || v.videoId === videoId));
        if (currentIndex > 0) {
            const prevVideo = allVideos[currentIndex - 1];
            navigate(`/focus/${prevVideo.videoId || prevVideo._id}`);
        }
    }, [allVideos, videoId, navigate]);

    const handlePlayerReady = useCallback((event) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());
        setVolume(event.target.getVolume());
        setPlaybackRate(event.target.getPlaybackRate());

        const iframe = event.target.getIframe();
        if (iframe) {
            iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture; encrypted-media");
        }

        // Fetch available tracks
        try {
            const cTracks = event.target.getOption('captions', 'tracklist') || [];
            setCaptionTracks(cTracks);
            const activeCTrack = event.target.getOption('captions', 'track');
            setCurrentCaptionTrack(activeCTrack);

            const aTracks = event.target.getOption('audioTracks', 'tracklist') || [];
            setAudioTracks(aTracks);
            const activeATrack = event.target.getOption('audioTracks', 'track');
            setCurrentAudioTrack(activeATrack);
        } catch (err) {
            console.log("Error fetching tracks:", err);
        }

        const t = event.target.getCurrentTime();
        lastTickTimeRef.current = t;

        if (schedule?.lastWatchedSecond) {
            const resumeTime = schedule.lastWatchedSecond;
            event.target.seekTo(resumeTime);
            setCurrentTime(resumeTime);
        } else {
            const lastSession = localStorage.getItem(`last_session_${videoId}`);
            if (lastSession) {
                const { timestamp, time } = JSON.parse(lastSession);
                const hoursPassed = (Date.now() - timestamp) / (1000 * 60 * 60);
                if (hoursPassed > 4 && Math.abs(t - time) < 5) {
                    const rewindTo = Math.max(0, t - 15);
                    event.target.seekTo(rewindTo);
                    setCurrentTime(rewindTo);
                }
            }
        }
    }, [videoId, schedule]);

    const handlePlayerStateChange = useCallback((event) => {
        setIsPlaying(event.data === 1);
        if (event.data === 1) {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = setTimeout(() => setIsHovering(false), zenMode ? 1000 : 2500);
        } else {
            setIsHovering(true);
        }
    }, [zenMode, setIsHovering]);

    // Progress Tracker Effect
    useEffect(() => {
        if (isPlaying && !isDragging) {
            let syncCounter = 0;
            timeIntervalRef.current = setInterval(() => {
                if (playerRef.current) {
                    const time = playerRef.current.getCurrentTime();
                    const delta = time - lastTickTimeRef.current;

                    if (delta > 0 && delta < 5.0) {
                        // Analytics
                        pendingPulseRef.current += delta;
                        if (pendingPulseRef.current >= 20) {
                            api.post('/analytics/pulse', { seconds: Math.floor(pendingPulseRef.current) }).catch(() => { });
                            pendingPulseRef.current = 0;
                        }

                        // Schedule sync
                        syncCounter += delta;
                        if (syncCounter >= 10 && schedule?._id) {
                            api.put(`/schedules/${schedule._id}`, { lastWatchedSecond: Math.floor(time) }).catch(() => { });
                            syncCounter = 0;
                        }
                    }

                    lastTickTimeRef.current = time;
                    setCurrentTime(time);
                    localStorage.setItem(`last_session_${videoId}`, JSON.stringify({ timestamp: Date.now(), time }));
                }
            }, 250);
        } else {
            clearInterval(timeIntervalRef.current);
            if (playerRef.current && schedule?._id && !isDragging) {
                const time = playerRef.current.getCurrentTime();
                api.put(`/schedules/${schedule._id}`, { lastWatchedSecond: Math.floor(time) }).catch(() => { });
            }
        }
        return () => clearInterval(timeIntervalRef.current);
    }, [isPlaying, isDragging, videoId, schedule?._id]);

    return {
        playerRef,
        isPlaying,
        currentTime,
        setCurrentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        isDragging,
        setIsDragging,
        togglePlay,
        handleVolumeChange,
        adjustVolume,
        toggleMute,
        toggleSpeed,
        cycleSpeedUp,
        cycleSpeedDown,
        handleSeekChange,
        handleSeek,
        handleToggleComplete,
        toggleChapter,
        handleNextVideo,
        handlePrevVideo,
        handlePlayerReady,
        handlePlayerStateChange,
        captionTracks,
        currentCaptionTrack,
        audioTracks,
        currentAudioTrack,
        setCaptionTrack: (track) => {
            if (playerRef.current) {
                playerRef.current.setOption('captions', 'track', track || {});
                setCurrentCaptionTrack(track);
            }
        },
        setAudioTrack: (track) => {
            if (playerRef.current) {
                playerRef.current.setOption('audioTracks', 'track', track || {});
                setCurrentAudioTrack(track);
            }
        }
    };
};

export default useFocusModePlayer;
