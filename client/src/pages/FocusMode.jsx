import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, RefreshCw, XCircle, AlignLeft, Zap } from 'lucide-react';
import { cache } from '../utils/cache';
import FocusSidebar from '../components/Focus/FocusSidebar';
import FocusControls from '../components/Focus/FocusControls';
import FocusTopBar from '../components/Focus/FocusTopBar';
import FocusPlayerSlot from '../components/Focus/FocusPlayerSlot';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';

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
    const [presenceCount, setPresenceCount] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [miniPlayer, setMiniPlayer] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

    const playerRef = useRef(null);
    const containerRef = useRef(null);
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
            console.log("YouTube ID:", payload.video.youtubeVideoId || payload.video.videoId);
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

        // Allow native browser PiP on the YouTube iframe
        const iframe = event.target.getIframe();
        if (iframe) {
            iframe.setAttribute(
                "allow",
                "autoplay; fullscreen; picture-in-picture; encrypted-media"
            );
        }

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
        if (!playerRef.current) return;
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
        if (playerRef.current) playerRef.current.seekTo(newTime);
    };

    const handleVolumeChange = (e) => {
        const newVol = parseInt(e.target.value);
        setVolume(newVol);
        if (playerRef.current) playerRef.current.setVolume(newVol);
    };

    const toggleSpeed = () => {
        if (!playerRef.current) return;
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

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current?.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current?.webkitRequestFullscreen) {
                containerRef.current.webkitRequestFullscreen();
            } else if (containerRef.current?.msRequestFullscreen) {
                containerRef.current.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);


    const handleSeek = (seconds) => {
        if (playerRef.current) {
            playerRef.current.seekTo(seconds, true);
            setCurrentTime(seconds);
        }
    };

    const toggleNativePiP = () => {
        try {
            if (playerRef.current) {
                const iframe = playerRef.current.getIframe();
                if (iframe && iframe.requestPictureInPicture) {
                    iframe.requestPictureInPicture().catch(() => {});
                }
            }
        } catch (e) {}
    };

    const cycleSpeedUp = () => {
        if (!playerRef.current) return;
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const currIdx = speeds.indexOf(playbackRate);
        const nextIdx = currIdx < speeds.length - 1 ? currIdx + 1 : currIdx;
        const newSpeed = speeds[nextIdx];
        setPlaybackRate(newSpeed);
        playerRef.current.setPlaybackRate(newSpeed);
    };

    const cycleSpeedDown = () => {
        if (!playerRef.current) return;
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const currIdx = speeds.indexOf(playbackRate);
        const nextIdx = currIdx > 0 ? currIdx - 1 : 0;
        const newSpeed = speeds[nextIdx];
        setPlaybackRate(newSpeed);
        playerRef.current.setPlaybackRate(newSpeed);
    };

    const adjustVolume = (delta) => {
        setVolume(prev => {
            const newVol = Math.max(0, Math.min(100, prev + delta));
            if (playerRef.current) playerRef.current.setVolume(newVol);
            return newVol;
        });
    };

    const toggleMute = () => {
        if (playerRef.current) {
            if (playerRef.current.isMuted()) {
                playerRef.current.unMute();
            } else {
                playerRef.current.mute();
            }
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
            enablejsapi: 1,
            playsinline: 1,
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

    const { user } = useAuth();

    useEffect(() => {
        const handleResize = () => {
            setCompactMode(window.innerWidth < 1000);
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Real-time Presence with WebSockets
    useEffect(() => {
        if (!video) return;

        // Get the YouTube ID for presence tracking
        // Use sharedVideo.youtubeId (new structure) or video.videoId (legacy structure)
        const youtubeId = video.sharedVideo?.youtubeId || video.videoId;
        if (!youtubeId) {
            console.warn('⚠️ No YouTube ID found for presence tracking');
            return;
        }

        // Ensure socket is connected
        if (!socket.connected) {
            console.log('🔌 Connecting socket for presence tracking...');
            socket.connect();
        }

        // Generate/Get visitorId for anonymous tracking
        let visitorId = sessionStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = 'vis_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('visitor_id', visitorId);
        }

        // Join video room using YouTube ID (shared across all users)
        console.log('👥 Joining video room:', youtubeId, 'User:', user?._id || visitorId);
        socket.emit('join_video', {
            videoId: youtubeId,
            userId: user?._id,
            visitorId: !user ? visitorId : null
        });

        // Listen for updates
        const handlePresenceUpdate = (data) => {
            console.log('📊 Presence update received:', data);
            if (data.videoId === youtubeId) {
                console.log('✅ Updating presence count to:', data.count);
                setPresenceCount(data.count);
            } else {
                console.log('⚠️ videoId mismatch:', data.videoId, 'expected:', youtubeId);
            }
        };

        socket.on('presence_update', handlePresenceUpdate);

        // Log connection status
        socket.on('connect', () => {
            console.log('✅ Socket connected successfully');
            // Re-join the room on reconnect
            socket.emit('join_video', {
                videoId: youtubeId,
                userId: user?._id,
                visitorId: !user ? visitorId : null
            });
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });

        return () => {
            console.log('👋 Leaving video room:', youtubeId);
            socket.emit('leave_video', { videoId: youtubeId });
            socket.off('presence_update', handlePresenceUpdate);
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
        };
    }, [video, user]);

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

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const key = e.key.toLowerCase();
            if (key === 'f') { handleToggleFullscreen(); e.preventDefault(); }
            if (key === 'z') { setZenMode(prev => !prev); e.preventDefault(); }
            if (key === 'm') { toggleMute(); e.preventDefault(); }
            if (key === 'c') { handleToggleComplete(); e.preventDefault(); }
            if (key === 's') { setShowSidebar(prev => !prev); e.preventDefault(); }
            if (key === 'p' && !e.shiftKey) { setMiniPlayer(prev => !prev); e.preventDefault(); }
            if (key === '/' || key === '?') { setShowShortcutsHelp(prev => !prev); e.preventDefault(); }
            if (key === 'escape') { setShowShortcutsHelp(false); setMiniPlayer(false); }
            if (key === ' ' || key === 'k') { togglePlay(); e.preventDefault(); }
            if (key === 'j') { handleSeek(Math.max(0, currentTime - 10)); e.preventDefault(); }
            if (key === 'l') { handleSeek(Math.min(duration, currentTime + 10)); e.preventDefault(); }
            if (key === 'arrowleft') { handleSeek(Math.max(0, currentTime - 5)); e.preventDefault(); }
            if (key === 'arrowright') { handleSeek(Math.min(duration, currentTime + 5)); e.preventDefault(); }
            if (key === 'arrowup') { adjustVolume(10); e.preventDefault(); }
            if (key === 'arrowdown') { adjustVolume(-10); e.preventDefault(); }
            if (e.key === '>') { cycleSpeedUp(); e.preventDefault(); }
            if (e.key === '<') { cycleSpeedDown(); e.preventDefault(); }
            if (e.shiftKey && (key === 'n')) { handleNextVideo(); e.preventDefault(); }
            if (e.shiftKey && (key === 'p')) { handlePrevVideo(); e.preventDefault(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTime, duration, miniPlayer, showShortcutsHelp]);

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
            ref={containerRef}
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
            <FocusPlayerSlot
                mainSlotRef={mainSlotRef}
                video={video}
                playerOptions={playerOptions}
                handlePlayerStateChange={handlePlayerStateChange}
                handlePlayerReady={handlePlayerReady}
                handleVideoEnd={handleVideoEnd}
                isPlaying={isPlaying}
                videoLoading={videoLoading}
                initialLoading={initialLoading}
                togglePlay={togglePlay}
                miniPlayer={miniPlayer}
                onExpandMiniPlayer={() => setMiniPlayer(false)}
                onCloseMiniPlayer={() => setMiniPlayer(false)}
                toggleNativePiP={toggleNativePiP}
            />


            <FocusTopBar
                showControls={showControls}
                compactMode={compactMode}
                isMobile={isMobile}
                video={video}
                playlist={playlist}
                presenceCount={presenceCount}
                navigate={navigate}
            />

            {/* 3. Control Deck */}
            <FocusControls
                showControls={showControls}
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
                isFullscreen={isFullscreen}
                handleToggleFullscreen={handleToggleFullscreen}
                isLoading={videoLoading || !playerRef.current}
                miniPlayer={miniPlayer}
                setMiniPlayer={setMiniPlayer}
            />

            {/* 4. Sidebar Panel */}
            <FocusSidebar
                showSidebar={showSidebar}
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
                .spinner-small {
                    border: 2px solid rgba(0,0,0,0.1);
                    border-top-color: black;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    animation: spin 1s linear infinite;
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
