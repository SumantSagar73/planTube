import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, RefreshCw, XCircle, AlignLeft, Zap, Lock } from 'lucide-react';
import { cache } from '../utils/cache';
import FocusSidebar from '../components/Focus/FocusSidebar';
import FocusControls from '../components/Focus/FocusControls';
import FocusTopBar from '../components/Focus/FocusTopBar';
import FocusPlayerSlot from '../components/Focus/FocusPlayerSlot';
import FocusLeftRail from '../components/Focus/FocusLeftRail';
import KeyboardShortcutsHelp from '../components/Focus/KeyboardShortcutsHelp';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';

const FocusMode = () => {
    const { videoId } = useParams();
    const [searchParams] = useSearchParams();
    const urlPlaylistId = searchParams.get('playlistId');
    // Sticky context: save/load playlist context from session storage
    const sessionPlaylistId = sessionStorage.getItem('active_playlist_id');
    const effectivePlaylistId = urlPlaylistId || sessionPlaylistId;
    
    // Save to session if found in URL
    useEffect(() => {
        if (urlPlaylistId) {
            sessionStorage.setItem('active_playlist_id', urlPlaylistId);
        }
    }, [urlPlaylistId]);

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
    const [sidebarTab, setSidebarTab] = useState('playlist');
    const [presenceCount, setPresenceCount] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [miniPlayer, setMiniPlayer] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    
    // Advanced Focus Features
    const [isMonkMode, setIsMonkMode] = useState(false);
    const [ambientSound, setAmbientSound] = useState('none');
    const [glassBlur, setGlassBlur] = useState(20);
    const [accentColor, setAccentColor] = useState('#6366f1'); // Default Indigo
    const [pomodoro, setPomodoro] = useState({
        isActive: false,
        secondsLeft: 25 * 60,
        mode: 'focus'
    });

    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem(`notes_${videoId}`);
        return saved ? JSON.parse(saved) : [];
    });

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
            const currentContextId = urlPlaylistId || sessionPlaylistId;
            const cacheKey = `video_${videoId}${currentContextId ? `_pl_${currentContextId}` : ''}`;
            const cachedVideo = cache.get(cacheKey);
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

            // Stage fallback for playlist identification
            const pId = urlPlaylistId || sessionPlaylistId || videoRes.data.playlistId || videoRes.data.sharedVideo?.playlistId;

            if (pId) {
                try {
                    const playlistRes = await api.get(`/playlists/${pId}`);
                    if (playlistRes.data.videos) {
                        playlistData = playlistRes.data.playlist;
                        videosData = playlistRes.data.videos;
                    } else {
                        playlistData = playlistRes.data;
                        const videosRes = await api.get(`/playlists/${pId}/videos`);
                        videosData = videosRes.data;
                    }
                } catch (pErr) {
                    console.warn("Failed to fetch playlist details", pErr);
                    videosData = [videoRes.data];
                }
            } else {
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
            
            const cacheKeyToSave = `video_${videoId}${pId ? `_pl_${pId}` : ''}`;
            cache.set(cacheKeyToSave, payload);
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
        const playerState = playerRef.current.getPlayerState?.();
        const isActuallyPlaying = playerState === 1;
        if (isActuallyPlaying) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
    };

    const handleMouseMove = () => {
        setIsHovering(true);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovering(false); // Hide after 2s regardless of play state
        }, 2000);
    };

    const handlePlayerStateChange = (event) => {
        setIsPlaying(event.data === 1);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        
        // Always set a timeout to hide controls, even on pause
        hoverTimeoutRef.current = setTimeout(() => setIsHovering(false), 2000);
        
        if (event.data !== 1) {
            setIsHovering(true); // Temporarily show on pause
        }
    };

    const handleSaveNote = (text) => {
        if (editingNoteId) {
            const updatedNotes = notes.map(n => 
                n.id === editingNoteId ? { ...n, text, updatedAt: new Date().toISOString() } : n
            );
            setNotes(updatedNotes);
            localStorage.setItem(`notes_${videoId}`, JSON.stringify(updatedNotes));
            setEditingNoteId(null);
        } else {
            const newNote = {
                id: Date.now(),
                videoId,
                time: currentTime,
                text,
                createdAt: new Date().toISOString()
            };
            const updatedNotes = [...notes, newNote].sort((a, b) => a.time - b.time);
            setNotes(updatedNotes);
            localStorage.setItem(`notes_${videoId}`, JSON.stringify(updatedNotes));
        }
        
        // Reset editor state
        setNoteText('');
        setIsAddingNote(false);
    };

    const handleEditNote = (note) => {
        setEditingNoteId(note.id);
        setNoteText(note.text);
        setIsAddingNote(true);
        if (playerRef.current) {
            playerRef.current.pauseVideo();
            setIsPlaying(false);
        }
    };

    const handleUpdateChapters = async (newChapters) => {
        try {
            const normalizedChapters = Array.isArray(newChapters)
                ? newChapters
                    .filter(c => c && c.title && c.timestamp)
                    .map(c => ({
                        title: String(c.title).trim(),
                        timestamp: String(c.timestamp).trim(),
                        seconds: Number.isFinite(c.seconds) ? Math.max(0, Math.floor(c.seconds)) : 0
                    }))
                : [];

            const res = await api.put(`/videos/${videoId}/chapters`, { chapters: normalizedChapters });
            // Update local state and cache
            const serverChapters = res?.data?.chapters || normalizedChapters;
            const updatedVideo = {
                ...video,
                chapters: serverChapters,
                sharedVideo: { ...(video.sharedVideo || {}), chapters: serverChapters },
                sharedVideoId: { ...(video.sharedVideoId || {}), chapters: serverChapters }
            };
            setVideo(updatedVideo);
            
            const pId = urlPlaylistId || sessionPlaylistId || video.playlistId;
            const cacheKey = `video_${videoId}${pId ? `_pl_${pId}` : ''}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                cache.set(cacheKey, { ...cachedData, video: updatedVideo });
            }
        } catch (err) {
            console.error('Error updating chapters:', err);
            alert('Failed to save chapters');
        }
    };

    const handleUpdateVideo = async (updateData) => {
        try {
            const res = await api.put(`/videos/${videoId}`, updateData);
            // Update local state and cache
            const updatedVideo = { ...video, ...res.data };
            setVideo(updatedVideo);
            
            const pId = urlPlaylistId || sessionPlaylistId || video.playlistId;
            const cacheKey = `video_${videoId}${pId ? `_pl_${pId}` : ''}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                cache.set(cacheKey, { ...cachedData, video: updatedVideo });
            }
        } catch (err) {
            console.error('Error updating video metadata:', err);
            alert('Failed to save changes');
        }
    };

    const handleDeleteNote = (noteId) => {
        const updatedNotes = notes.filter(n => n.id !== noteId);
        setNotes(updatedNotes);
        localStorage.setItem(`notes_${videoId}`, JSON.stringify(updatedNotes));
    };

    const handleCancelNote = () => {
        setIsAddingNote(false);
        setEditingNoteId(null);
        setNoteText('');
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
            const pId = urlPlaylistId || sessionPlaylistId || playlist?._id || video?.playlistId;
            const query = pId ? `?playlistId=${pId}` : '';
            navigate(`/focus/${nextVideo._id || nextVideo.videoId}${query}`);
        }
    };

    const handlePrevVideo = () => {
        const currentIndex = allVideos.findIndex(v => (v._id === videoId || v.videoId === videoId));
        if (currentIndex > 0 && currentIndex !== -1) {
            const prevVideo = allVideos[currentIndex - 1];
            const pId = urlPlaylistId || sessionPlaylistId || playlist?._id || video?.playlistId;
            const query = pId ? `?playlistId=${pId}` : '';
            navigate(`/focus/${prevVideo._id || prevVideo.videoId}${query}`);
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

    const checkUnsavedNotes = () => {
        if (isAddingNote && noteText.trim() !== '') {
            return window.confirm("You have an unsaved note. Are you sure you want to discard it?");
        }
        return true;
    };

    const safeSetSidebarTab = (tab) => {
        if (tab === sidebarTab) {
            // If already on this tab, just toggle sidebar
            safeSetShowSidebar(!showSidebar);
            return;
        }

        if (sidebarTab === 'notes' && !checkUnsavedNotes()) return;
        setSidebarTab(tab);
        if (!showSidebar) setShowSidebar(true);
    };

    const safeSetShowSidebar = (show) => {
        if (!show && sidebarTab === 'notes' && !checkUnsavedNotes()) return;
        if (!show) {
            setEditingNoteId(null);
        }
        setShowSidebar(show);
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
            socket.connect();
        }

        // Generate/Get visitorId for anonymous tracking
        const visitorId = sessionStorage.getItem('visitor_id') || ('vis_' + Math.random().toString(36).substr(2, 9));
        if (!sessionStorage.getItem('visitor_id')) sessionStorage.setItem('visitor_id', visitorId);

        socket.emit('join_video', {
            videoId: youtubeId,
            userId: user?._id,
            visitorId: !user ? visitorId : null
        });

        // Listen for updates
        const handlePresenceUpdate = (data) => {
            if (data.videoId === youtubeId) {
                setPresenceCount(data.count);
            }
        };

        socket.on('presence_update', handlePresenceUpdate);

        // Log connection status
        socket.on('connect', () => {
            socket.emit('join_video', {
                videoId: youtubeId,
                userId: user?._id,
                visitorId: !user ? visitorId : null
            });
        });

        socket.on('disconnect', () => {});

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });

        return () => {
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

    // Lock Mode Side Effects
    useEffect(() => {
        if (isLocked) {
            setShowSidebar(false);
            if (!isFullscreen) {
                handleToggleFullscreen();
            }
        }
    }, [isLocked]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            const tagName = e.target?.tagName;
            const isTypingTarget =
                tagName === 'INPUT' ||
                tagName === 'TEXTAREA' ||
                tagName === 'SELECT' ||
                e.target?.isContentEditable;
            if (isTypingTarget) return;

            const key = e.key.toLowerCase();
            const isSpace = e.code === 'Space' || key === ' ';

            // If locked, only allow basic navigation and play/pause
            if (isLocked) {
                if (key === 'l' && (e.ctrlKey || e.metaKey)) { /* Allow specific unlock combo if needed? */ }
                if (isSpace || key === 'k') { togglePlay(); e.preventDefault(); }
                if (key === 'j') { handleSeek(Math.max(0, currentTime - 10)); e.preventDefault(); }
                if (key === 'l') { handleSeek(Math.min(duration, currentTime + 10)); e.preventDefault(); }
                if (key === 'arrowleft') { handleSeek(Math.max(0, currentTime - 5)); e.preventDefault(); }
                if (key === 'arrowright') { handleSeek(Math.min(duration, currentTime + 5)); e.preventDefault(); }
                return;
            }

            if (key === 'f') { handleToggleFullscreen(); e.preventDefault(); }
            if (key === 'm') { toggleMute(); e.preventDefault(); }
            if (key === 'c') { handleToggleComplete(); e.preventDefault(); }
            if (key === 's') { setShowSidebar(prev => !prev); e.preventDefault(); }
            if (key === 'p' && !e.shiftKey) { setMiniPlayer(prev => !prev); e.preventDefault(); }
            if (key === '/' || key === '?') { setShowShortcutsHelp(prev => !prev); e.preventDefault(); }
            if (key === 'escape') { setShowShortcutsHelp(false); setMiniPlayer(false); }
            if (isSpace || key === 'k') { togglePlay(); e.preventDefault(); }
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
    }, [
        currentTime,
        duration,
        miniPlayer,
        showShortcutsHelp,
        togglePlay,
        handleToggleComplete,
        handleNextVideo,
        handlePrevVideo,
        handleToggleFullscreen
    ]);

    // Pomodoro Timer Effect
    useEffect(() => {
        let interval = null;
        if (pomodoro.isActive && pomodoro.secondsLeft > 0) {
            interval = setInterval(() => {
                setPomodoro(prev => ({
                    ...prev,
                    secondsLeft: prev.secondsLeft - 1
                }));
            }, 1000);
        } else if (pomodoro.secondsLeft === 0) {
            clearInterval(interval);
            // Play a subtle sound?
            const audio = new Audio('https://www.soundjay.com/buttons/sounds/btn-01.mp3');
            audio.play().catch(() => {});
            
            // Switch modes
            const nextMode = pomodoro.mode === 'focus' ? 'shortBreak' : 'focus';
            const nextSeconds = nextMode === 'focus' ? 25 * 60 : 5 * 60;
            setPomodoro(prev => ({
                ...prev,
                isActive: false,
                mode: nextMode,
                secondsLeft: nextSeconds
            }));
            alert(`${pomodoro.mode === 'focus' ? 'Deep Work' : 'Break'} session finished!`);
        }
        return () => clearInterval(interval);
    }, [pomodoro.isActive, pomodoro.secondsLeft]);

    // Ambient Audio Logic
    const audioRef = useRef(null);
    useEffect(() => {
        const audioUrls = {
            none: null,
            rain: 'https://cdn.pixabay.com/audio/2021/09/06/audio_4966141a4a.mp3', // Pixabay rain
            lofi: 'https://stream.zeno.fm/0r0xa792kwzuv',
            waves: 'https://cdn.pixabay.com/audio/2022/03/15/audio_277f722a4d.mp3', // Pixabay waves
            forest: 'https://cdn.pixabay.com/audio/2022/01/21/audio_31ced43831.mp3' // Pixabay forest
        };

        if (ambientSound === 'none') {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        } else {
            if (audioRef.current) audioRef.current.pause();
            audioRef.current = new Audio(audioUrls[ambientSound]);
            audioRef.current.loop = true;
            audioRef.current.volume = 0.4;
            audioRef.current.play().catch(() => {}); // Silent fail for autoplay blocks
        }

        return () => {
            if (audioRef.current) audioRef.current.pause();
        };
    }, [ambientSound]);

    // Apply Accent Color & Glass Blur
    useEffect(() => {
        document.documentElement.style.setProperty('--primary', accentColor);
        document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`);
    }, [accentColor, glassBlur]);

    // Derived State for UI - Show only if sidebar is open or user is actively hovering
    const showControls = showSidebar || isHovering;
    const uiHidden = isMonkMode && isPlaying && !isHovering;
    // Note: showControls still respects !isPlaying because handlePlayerStateChange sets isHovering initially.

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
                height: '100dvh',
                width: '100vw',
                background: 'black',
                display: 'flex',
                overflow: 'hidden',
                cursor: isMobile ? 'default' : ((showControls && !uiHidden) ? 'default' : 'none'),
                '--primary': accentColor // Dynamic backup
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setIsHovering(false)}
        >
            {!isMobile && <div data-section="focus-rail">
                <FocusLeftRail 
                    isMonkMode={isMonkMode}
                    setIsMonkMode={setIsMonkMode}
                    pomodoro={pomodoro}
                    setPomodoro={setPomodoro}
                    ambientSound={ambientSound}
                    setAmbientSound={setAmbientSound}
                    glassBlur={glassBlur}
                    accentColor={accentColor}
                />
            </div>}

            {/* Monk Mode Vignette */}
            {isMonkMode && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 5,
                    boxShadow: 'inset 0 0 150px rgba(0,0,0,0.8)',
                    opacity: isPlaying ? 0.6 : 0,
                    transition: 'opacity 1s'
                }} />
            )}

            {/* Left Side: Video Content Area */}
            <div style={{ 
                flex: 1, 
                position: 'relative', 
                height: '100%', 
                overflow: 'hidden',
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                marginLeft: isMonkMode ? '12px' : '0'
            }}>
                <div data-section="focus-player" style={{ width: '100%', height: '100%' }}>
                    <FocusPlayerSlot
                        mainSlotRef={mainSlotRef}
                        video={video}
                        isMobile={isMobile}
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
                </div>

                {/* Top Bar Navigation */}
                {!isLocked && (
                    <FocusTopBar
                        showControls={showControls && !uiHidden}
                        compactMode={compactMode}
                        isMobile={isMobile}
                        video={video}
                        playlist={playlist}
                        presenceCount={presenceCount}
                        navigate={navigate}
                        toggleShortcutsHelp={() => setShowShortcutsHelp(prev => !prev)}
                    />
                )}

                {isLocked && (
                    <button 
                        onClick={() => setIsLocked(false)}
                        style={{
                            position: 'absolute', top: isMobile ? '1rem' : '2rem', right: isMobile ? '1rem' : '2rem', zIndex: 1000,
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%', width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', color: 'white',
                            backdropFilter: 'blur(10px)', cursor: 'pointer', transition: 'all 0.3s'
                        }}
                        className="lock-floating-btn"
                        title="Unlock Screen"
                    >
                        <Lock size={isMobile ? 20 : 24} />
                    </button>
                )}

                {showShortcutsHelp && <KeyboardShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />}

                {!isLocked && (
                    <div data-section="focus-controls">
                        <FocusControls
                            showControls={showControls}
                            uiHidden={uiHidden}
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
                            isFrozen={user?.isFrozen}
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
                            setIsHovering={setIsHovering}
                            handleToggleComplete={handleToggleComplete}
                            setSidebarTab={safeSetSidebarTab}
                            setShowSidebar={safeSetShowSidebar}
                            formatTime={formatTime}
                            isFullscreen={isFullscreen}
                            handleToggleFullscreen={handleToggleFullscreen}
                            isLoading={videoLoading || !playerRef.current}
                            miniPlayer={miniPlayer}
                            setMiniPlayer={setMiniPlayer}
                            isLocked={isLocked}
                            setIsLocked={setIsLocked}
                        />
                    </div>
                )}

                {!showControls && !isLocked && (
                    <div 
                        style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'none' }} 
                        onClick={togglePlay} 
                    />
                )}
            </div>

            {/* Right Side: Sidebar Panel */}
            {!isLocked && (
                <div data-section="focus-sidebar">
                    <FocusSidebar
                    showSidebar={showSidebar}
                    setShowSidebar={safeSetShowSidebar}
                    sidebarTab={sidebarTab}
                    setSidebarTab={safeSetSidebarTab}
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
                    currentTime={currentTime}
                    formatTime={formatTime}
                    notes={notes}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                    onEditNote={handleEditNote}
                    editingNoteId={editingNoteId}
                    onCancelNote={handleCancelNote}
                    onUpdateChapters={handleUpdateChapters}
                    onUpdateVideo={handleUpdateVideo}
                    isFrozen={user?.isFrozen}
                    isAddingNote={isAddingNote}
                    setIsAddingNote={setIsAddingNote}
                    noteText={noteText}
                    setNoteText={setNoteText}
                    isLocked={isLocked}
                    glassBlur={glassBlur}
                    setGlassBlur={setGlassBlur}
                    accentColor={accentColor}
                    setAccentColor={setAccentColor}
                    onPauseVideo={() => {
                        if (playerRef.current) {
                            playerRef.current.pauseVideo();
                            setIsPlaying(false);
                        }
                    }}
                />
            </div>
            )}

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
