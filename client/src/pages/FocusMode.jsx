import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    CheckCircle, ChevronLeft, RefreshCw, XCircle,
    AlignLeft, List as ListIcon, Play, Users, Zap
} from 'lucide-react';
import YouTube from 'react-youtube';
import { cache } from '../utils/cache';
import FocusSidebar from '../components/Focus/FocusSidebar';
import FocusControls from '../components/Focus/FocusControls';
import GhostPlayer from '../components/Focus/GhostPlayer';
import ReactDOM from 'react-dom/client';

const FocusMode = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [playlist, setPlaylist] = useState(null);
    const [allVideos, setAllVideos] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [playlistSchedules, setPlaylistSchedules] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [error, setError] = useState(null);

    // Focus Mode & UI States
    const [isHovering, setIsHovering] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const hoverTimeoutRef = useRef(null);
    const [compactMode, setCompactMode] = useState(window.innerWidth < 1000);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const timeIntervalRef = useRef(null);

    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('chapters');
    const [zenMode, setZenMode] = useState(false);
    const [presenceCount, setPresenceCount] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isGhostMode, setIsGhostMode] = useState(false);
    const [ghostPosition, setGhostPosition] = useState({ x: window.innerWidth - 420, y: 30 });

    const playerRef = useRef(null);
    const mainSlotRef = useRef(null);
    const watchedTimeRef = useRef({});
    const lastTickTimeRef = useRef(0);
    const lastActiveChapterRef = useRef(-1);
    const chapterRefs = useRef([]);
    const pendingPulseRef = useRef(0);

    const fetchSchedule = async (currentVideo) => {
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
    };

    const fetchVideoData = async () => {
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
    };

    const handleToggleComplete = async () => {
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
    };

    const toggleChapter = async (idx) => {
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

            const previousSchedule = { ...currentSchedule };
            setSchedule({ ...currentSchedule, completedChapters: newCompleted });

            try {
                const res = await api.put(`/schedules/${currentSchedule._id}`, { completedChapters: newCompleted });
                if (JSON.stringify(res.data.completedChapters) !== JSON.stringify(newCompleted)) {
                    setSchedule(res.data);
                }
            } catch (innerErr) {
                setSchedule(previousSchedule);
            }
        } catch (err) {
            console.error('Error toggling chapter:', err);
        }
    };

    const handleVideoEnd = () => {
        if (schedule?.status !== 'completed') {
            handleToggleComplete();
        }
    };

    const handlePlayerReady = (event) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());
        setVolume(event.target.getVolume());
        setPlaybackRate(event.target.getPlaybackRate());

        const t = event.target.getCurrentTime();
        lastTickTimeRef.current = t;

        // Priority 1: Schedule progress (Server-side)
        if (schedule?.lastWatchedSecond) {
            const resumeTime = schedule.lastWatchedSecond;
            event.target.seekTo(resumeTime);
            setCurrentTime(resumeTime);
        } else {
            // Priority 2: Session cache (Local-side)
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
    };

    const togglePlay = () => {
        if (isPlaying) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
    };

    const handleMouseMove = () => {
        setIsHovering(true);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setIsHovering(false);
        }, zenMode ? 1000 : 2500);
    };

    const handlePlayerStateChange = (event) => {
        setIsPlaying(event.data === 1);
        if (event.data === 1) {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = setTimeout(() => setIsHovering(false), zenMode ? 1000 : 2500);
        } else {
            setIsHovering(true);
        }
    };

    const handleSeekChange = (e) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        playerRef.current.seekTo(newTime);
    };

    const handleVolumeChange = (e) => {
        const newVol = parseInt(e.target.value);
        setVolume(newVol);
        playerRef.current.setVolume(newVol);
    };

    const toggleSpeed = () => {
        const speeds = [1, 1.25, 1.5, 2];
        const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
        const newSpeed = speeds[nextIdx];
        setPlaybackRate(newSpeed);
        playerRef.current.setPlaybackRate(newSpeed);
    };

    const formatTime = (time) => {
        if (!time && time !== 0) return "0:00";
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
        if (hours > 0) return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleNextVideo = () => {
        const currentIndex = allVideos.findIndex(v => v._id === videoId || v.videoId === videoId);
        if (currentIndex < allVideos.length - 1 && currentIndex !== -1) {
            const nextVideo = allVideos[currentIndex + 1];
            navigate(`/focus/${nextVideo.videoId || nextVideo._id}`);
        }
    };

    const handlePrevVideo = () => {
        const currentIndex = allVideos.findIndex(v => (v._id === videoId || v.videoId === videoId));
        if (currentIndex > 0) {
            const prevVideo = allVideos[currentIndex - 1];
            navigate(`/focus/${prevVideo.videoId || prevVideo._id}`);
        }
    };

    const handleToggleGhostMode = () => {
        setIsGhostMode(!isGhostMode);
    };

    const handleSeek = (seconds) => {
        if (playerRef.current) {
            playerRef.current.seekTo(seconds, true);
            setCurrentTime(seconds);
        }
    };

    const playerOptions = React.useMemo(() => ({
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            disablekb: 1,
            origin: window.location.origin
        },
    }), []);

    const activeChapterIndex = React.useMemo(() => {
        if (!video?.chapters) return -1;
        for (let i = video.chapters.length - 1; i >= 0; i--) {
            if (currentTime >= video.chapters[i].seconds) return i;
        }
        return -1;
    }, [currentTime, video]);

    useEffect(() => {
        fetchVideoData();
    }, [videoId]);

    useEffect(() => {
        const handleResize = () => {
            setCompactMode(window.innerWidth < 1000);
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Presence & Heartbeat - Independent of playback
    useEffect(() => {
        if (!videoId) return;

        const sendHeartbeat = () => {
            api.post('/presence/heartbeat', { videoId })
                .then(res => setPresenceCount(res.data.count))
                .catch(err => console.warn('Heartbeat failed', err));
        };

        // Send immediately on mount/videoId change
        sendHeartbeat();

        // Then poll every 30 seconds
        const heartbeatInterval = setInterval(sendHeartbeat, 30000);

        return () => clearInterval(heartbeatInterval);
    }, [videoId]);

    useEffect(() => {
        if (isPlaying && !isDragging) {
            let syncCounter = 0;
            timeIntervalRef.current = setInterval(() => {
                if (playerRef.current) {
                    const time = playerRef.current.getCurrentTime();
                    const delta = time - lastTickTimeRef.current;

                    if (delta > 0 && delta < 5.0) {
                        const currentIdx = activeChapterIndex;
                        if (currentIdx !== -1) {
                            watchedTimeRef.current[currentIdx] = (watchedTimeRef.current[currentIdx] || 0) + delta;
                        } else {
                            watchedTimeRef.current['global'] = (watchedTimeRef.current['global'] || 0) + delta;
                        }

                        pendingPulseRef.current += delta;
                        syncCounter += delta;

                        // Daily Pulse (Analytics) - only during playback
                        if (pendingPulseRef.current >= 20) {
                            api.post('/analytics/pulse', { seconds: Math.floor(pendingPulseRef.current) }).catch(() => { });
                            pendingPulseRef.current = 0;
                        }

                        // Video Progress (Schedule) - every 10s
                        if (syncCounter >= 10 && schedule?._id) {
                            api.put(`/schedules/${schedule._id}`, { lastWatchedSecond: Math.floor(time) }).catch(() => { });
                            syncCounter = 0;
                        }
                    }

                    lastTickTimeRef.current = time;
                    setCurrentTime(time);
                    localStorage.setItem(`last_session_${videoId}`, JSON.stringify({ timestamp: Date.now(), time }));
                }
            }, 250); // High-frequency update for smooth visual timer
        } else {
            clearInterval(timeIntervalRef.current);
            if (playerRef.current) {
                const time = playerRef.current.getCurrentTime();
                lastTickTimeRef.current = time;
                // Sync on pause if schedule exists
                if (schedule?._id && !isDragging) {
                    api.put(`/schedules/${schedule._id}`, { lastWatchedSecond: Math.floor(time) }).catch(() => { });
                }
            }
        }
        return () => {
            clearInterval(timeIntervalRef.current);
            // Final sync on unmount/cleanup
            if (playerRef.current && schedule?._id) {
                const finalTime = playerRef.current.getCurrentTime();
                api.put(`/schedules/${schedule._id}`, { lastWatchedSecond: Math.floor(finalTime) }).catch(() => { });
            }
        };
    }, [isPlaying, isDragging, activeChapterIndex, videoId, schedule?._id]);

    // Derived State for UI
    const showControls = !isPlaying || showSidebar || (!zenMode) || isHovering;

    if (initialLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#09090b', color: 'white' }}>
            <div style={{ textAlign: 'center' }}>
                <RefreshCw className="spin" size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                <p>Loading Focus Mode...</p>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center', background: '#09090b' }}>
            <div className="glass" style={{ padding: '3rem', maxWidth: '400px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <XCircle size={64} style={{ color: 'var(--danger)', marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Content Unavailable</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={() => { setError(null); fetchVideoData(); }}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
                    >
                        <RefreshCw size={20} /> Try Again
                    </button>
                    <button onClick={() => navigate('/library')} className="btn-secondary" style={{ width: '100%' }}>
                        Back to Library
                    </button>
                </div>
            </div>
        </div>
    );

    if (!video) return <div style={{ textAlign: 'center', padding: '5rem', color: 'white' }}>Video not found</div>;

    const currentIndex = allVideos.findIndex(v => v._id === videoId || v.videoId === videoId);
    const isCompleted = schedule?.status === 'completed';

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                background: 'black',
                position: 'relative',
                overflow: 'hidden',
                cursor: showControls ? 'default' : 'none'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setIsHovering(false)}
            onClick={() => !isHovering && togglePlay()}
        >
            {/* 1. Full Screen Video Player / Ghost Player Wrapper */}
            <div
                ref={mainSlotRef}
                id="main-player-slot"
                style={{
                    width: isGhostMode ? '400px' : '100%',
                    height: isGhostMode ? '225px' : '100%',
                    position: isGhostMode ? 'fixed' : 'absolute',
                    left: isGhostMode ? `${ghostPosition.x}px` : 0,
                    top: isGhostMode ? `${ghostPosition.y + 36}px` : 0,
                    zIndex: isGhostMode ? 10000 : 0,
                    pointerEvents: isGhostMode || !isPlaying ? 'auto' : 'none',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: isGhostMode ? '0 0 16px 16px' : 0,
                    overflow: 'hidden',
                    background: '#000'
                }}
            >
                <div className="youtube-player-container" style={{ width: '100%', height: '100%' }}>
                    <YouTube
                        videoId={(video.youtubeVideoId || video.videoId)}
                        opts={playerOptions}
                        onStateChange={handlePlayerStateChange}
                        onReady={handlePlayerReady}
                        onEnd={handleVideoEnd}
                        className="youtube-player"
                        style={{
                            width: '100%',
                            height: '100%',
                            transform: isGhostMode ? 'none' : 'scale(1.01)'
                        }}
                    />
                </div>
            </div>

            {/* Ghost Mode Frame Overlay */}
            {isGhostMode && (
                <GhostPlayer
                    video={video}
                    isPlaying={isPlaying}
                    playbackRate={playbackRate}
                    onTogglePlay={togglePlay}
                    onToggleSpeed={toggleSpeed}
                    onNext={handleNextVideo}
                    onPrev={handlePrevVideo}
                    onClose={() => setIsGhostMode(false)}
                    onPositionChange={setGhostPosition}
                />
            )}

            {/* Pause Overlay Layer */}
            {!isPlaying && !videoLoading && !initialLoading && !isGhostMode && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.5s ease',
                        cursor: 'pointer'
                    }}
                    onClick={togglePlay}
                >
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '2rem',
                        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }} className="hover:scale-110">
                        <Play size={48} fill="white" style={{ marginLeft: '6px' }} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', opacity: 0.8, color: 'white' }}>{video.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>Paused - Click to Resume</p>
                </div>
            )}

            {/* Click Mask */}
            {isPlaying && !isGhostMode && (
                <div
                    style={{ position: 'absolute', inset: 0, zIndex: 5 }}
                    onClick={togglePlay}
                />
            )}

            {/* Loading Overlay */}
            {videoLoading && !isGhostMode && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: 'rgba(0,0,0,0.5)' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
            )}

            {/* 2. Top Bar (Title & Back) */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: compactMode ? '0.5rem' : '1.5rem',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    opacity: (showControls && !isGhostMode) ? 1 : 0,
                    transform: `translateY(${(showControls && !isGhostMode) ? '0' : '-100%'})`,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: (showControls && !isGhostMode) ? 'auto' : 'none',
                    zIndex: 30
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => {
                            if (playlist?.playlistId?.startsWith('VIDEO_')) navigate('/library');
                            else navigate(`/playlist/${playlist?._id}`);
                        }}
                        className="glass-hover"
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    {!compactMode && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', maxWidth: isMobile ? '160px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {video.title}
                                </h2>
                                {playlist && !isMobile && (
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ListIcon size={12} /> {playlist.playlistTitle}
                                    </p>
                                )}
                            </div>
                            <div className="glass" style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ position: 'relative' }}>
                                    <Users size={14} color="var(--primary)" />
                                    <div style={{ position: 'absolute', top: -2, right: -2, width: '4px', height: '4px', background: '#22c55e', borderRadius: '50%' }}></div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'white' }}>{presenceCount}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Control Deck */}
            <FocusControls
                showControls={showControls && !isGhostMode}
                isMobile={isMobile}
                compactMode={compactMode}
                video={video}
                activeChapterIndex={activeChapterIndex}
                currentTime={currentTime}
                duration={duration}
                playbackRate={playbackRate}
                volume={volume}
                isPlaying={isPlaying}
                isCompleted={isCompleted}
                zenMode={zenMode}
                showSidebar={showSidebar}
                sidebarTab={sidebarTab}
                currentIndex={currentIndex}
                allVideos={allVideos}
                playlist={playlist}
                handleSeekChange={handleSeekChange}
                setIsDragging={setIsDragging}
                toggleSpeed={toggleSpeed}
                handleVolumeChange={handleVolumeChange}
                handlePrevVideo={handlePrevVideo}
                togglePlay={togglePlay}
                handleNextVideo={handleNextVideo}
                setZenMode={setZenMode}
                setIsHovering={setIsHovering}
                handleToggleComplete={handleToggleComplete}
                setSidebarTab={setSidebarTab}
                setShowSidebar={setShowSidebar}
                formatTime={formatTime}
                isGhostMode={isGhostMode}
                handleToggleGhostMode={handleToggleGhostMode}
            />

            {/* 4. Sidebar Panel */}
            <FocusSidebar
                showSidebar={showSidebar && !isGhostMode}
                setShowSidebar={setShowSidebar}
                sidebarTab={sidebarTab}
                setSidebarTab={setSidebarTab}
                video={video}
                playlist={playlist}
                allVideos={allVideos}
                schedule={schedule}
                playlistSchedules={playlistSchedules}
                activeChapterIndex={activeChapterIndex}
                handleSeek={handleSeek}
                toggleChapter={toggleChapter}
                navigate={navigate}
                videoId={videoId}
                isMobile={isMobile}
                compactMode={compactMode}
                chapterRefs={chapterRefs}
                presenceCount={presenceCount}
            />

            <style>{`
                .spinner {
                    border: 4px solid rgba(255,255,255,0.1);
                    border-left-color: var(--primary);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .icon-btn-deck {
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.5rem;
                    border-radius: 12px;
                    transition: all 0.2s;
                }
                .icon-btn-deck:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    transform: translateY(-2px);
                }
                .icon-btn-deck.active {
                    background: var(--primary);
                    color: white;
                }
                .deck-circle-btn {
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .deck-circle-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 30px rgba(255,255,255,0.5);
                }
                .deck-primary-btn {
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 30px;
                    padding: 0.6rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                }
                .deck-primary-btn:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.6);
                }
                .deck-primary-btn.completed {
                    background: #22c55e;
                    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
                }
                .deck-primary-btn.completed:hover {
                    box-shadow: 0 8px 16px rgba(34, 197, 94, 0.6);
                }
                .custom-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
                .custom-range::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
            `}</style>
        </div>
    );
};

export default FocusMode;
