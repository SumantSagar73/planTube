import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, ChevronLeft, ChevronRight, Clock, Map, AlignLeft, RefreshCw, List as ListIcon, Play, XCircle } from 'lucide-react';
import YouTube from 'react-youtube';
import { cache } from '../utils/cache';

const FocusMode = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [playlist, setPlaylist] = useState(null);
    const [allVideos, setAllVideos] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [playlistSchedules, setPlaylistSchedules] = useState([]); // Store all schedules for the playlist
    const [initialLoading, setInitialLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [error, setError] = useState(null);

    // UI State
    const [showSidebar, setShowSidebar] = useState(true);
    const [sidebarTab, setSidebarTab] = useState('chapters'); // 'chapters' | 'description' | 'playlist'
    const playerRef = useRef(null);


    useEffect(() => {
        fetchVideoData();
    }, [videoId]);

    const fetchVideoData = async () => {
        // If we don't have a video yet, it's initial loading. Otherwise it's just switching content.
        if (!video) setInitialLoading(true);
        else setVideoLoading(true);

        try {
            // Check Cache
            const cachedVideo = cache.get(`video_${videoId}`);
            if (cachedVideo) {
                setVideo(cachedVideo.video);
                setPlaylist(cachedVideo.playlist);
                setAllVideos(cachedVideo.allVideos);
                setInitialLoading(false);
                setVideoLoading(false);
                // Background fetch schedule (always fresh)
                fetchSchedule(cachedVideo.video);
                return;
            }

            // Get video details
            const videoRes = await api.get(`/videos/${videoId}`);

            // Get playlist and all videos
            // Handle different response structures for Imported vs Custom playlists
            let playlistData = null;
            let videosData = [];

            try {
                // Try fetching playlist details first
                const playlistRes = await api.get(`/playlists/${videoRes.data.playlistId}`);

                if (playlistRes.data.videos) {
                    // Custom Playlist response: { playlist, videos }
                    playlistData = playlistRes.data.playlist;
                    videosData = playlistRes.data.videos;
                } else {
                    // Imported Playlist response: playlist object only
                    playlistData = playlistRes.data;

                    // Fetch videos separately for imported playlists
                    const videosRes = await api.get(`/playlists/${videoRes.data.playlistId}/videos`);
                    videosData = videosRes.data;
                }
            } catch (pErr) {
                console.warn("Failed to fetch playlist details, using video context only", pErr);
                // Fallback: If playlist fetch fails (e.g. maybe 403), just use the single video in a list
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

            // Cache it
            cache.set(`video_${videoId}`, payload);

            // Fetch Schedule
            await fetchSchedule(payload.video);

            setInitialLoading(false);
            setVideoLoading(false);
        } catch (err) {
            console.error('Error fetching video data:', err);
            setError(err.response?.data?.msg || err.message);
            setInitialLoading(false);
            setVideoLoading(false);
        }
    };

    const fetchSchedule = async (currentVideo) => {
        try {
            const scheduleRes = await api.get(`/schedules/playlist/${currentVideo.playlistId}`);
            setPlaylistSchedules(scheduleRes.data); // Store full list
            const videoSchedule = scheduleRes.data.find(s => {
                const sVideoId = (typeof s.videoId === 'object') ? s.videoId._id : s.videoId;
                return sVideoId === currentVideo._id;
            });
            setSchedule(videoSchedule);
        } catch (error) {
            console.log("No schedule found or error fetching schedule");
        }
    };

    const handleToggleComplete = async () => {
        try {
            let currentSchedule = schedule;

            // If no schedule exists, create one first
            if (!currentSchedule) {
                const res = await api.post('/schedules', {
                    videoId: video._id,
                    status: 'pending'
                });
                currentSchedule = res.data;
                setSchedule(currentSchedule);
            }

            const newStatus = currentSchedule.status === 'completed' ? 'pending' : 'completed';
            await api.put(`/schedules/${currentSchedule._id}`, { status: newStatus });

            // Update local state without full refetch for speed
            setSchedule({ ...currentSchedule, status: newStatus });

            // Update the item in the full list as well
            setPlaylistSchedules(prev => prev.map(s =>
                s._id === currentSchedule._id ? { ...s, status: newStatus } : s
            ));

            // fetchVideoData(); // Optional: Refetch if needed, but local update is faster
        } catch (err) {
            console.error('Error toggling complete:', err);
        }
    };

    const handleNextVideo = () => {
        const currentIndex = allVideos.findIndex(v => v._id === videoId || v.videoId === videoId);
        if (currentIndex < allVideos.length - 1 && currentIndex !== -1) {
            const nextVideo = allVideos[currentIndex + 1];
            navigate(`/focus/${nextVideo.videoId || nextVideo._id}`);
        }
    };

    const handlePrevVideo = () => {
        const currentIndex = allVideos.findIndex(v => v._id === videoId || v.videoId === videoId);
        if (currentIndex > 0) {
            const prevVideo = allVideos[currentIndex - 1];
            navigate(`/focus/${prevVideo.videoId || prevVideo._id}`);
        }
    };

    const handleSeek = (seconds) => {
        if (playerRef.current) {
            try {
                // Determine if we have internalPlayer (react-youtube) or a direct reference
                const player = playerRef.current.internalPlayer || playerRef.current;
                if (player && typeof player.seekTo === 'function') {
                    player.seekTo(seconds, true);
                }
            } catch (err) {
                console.error("Seek failed", err);
            }
        }
    };

    const toggleChapter = async (idx) => {
        try {
            let currentSchedule = schedule;

            // If no schedule exists, create one first
            if (!currentSchedule) {
                // Ensure we use the database ID (video._id) not the URL parameter (videoId)
                const res = await api.post('/schedules', {
                    videoId: video._id,
                    status: 'pending'
                });
                currentSchedule = res.data;
                setSchedule(currentSchedule);
            }

            const currentCompleted = currentSchedule.completedChapters || [];
            let newCompleted;

            if (currentCompleted.includes(idx)) {
                newCompleted = currentCompleted.filter(i => i !== idx);
            } else {
                newCompleted = [...currentCompleted, idx];
            }

            // OPTIMISTIC UPDATE
            const previousSchedule = { ...currentSchedule }; // Backup
            setSchedule({ ...currentSchedule, completedChapters: newCompleted });

            // Call API
            try {
                const res = await api.put(`/schedules/${currentSchedule._id}`, { completedChapters: newCompleted });
                // We could setSchedule(res.data) here, but trust our optimistic prediction to avoid flicker
                // Optionally update to ensure sync
                if (JSON.stringify(res.data.completedChapters) !== JSON.stringify(newCompleted)) {
                    setSchedule(res.data);
                }
            } catch (innerErr) {
                // Revert on failure
                console.error("Failed to save chapter progress", innerErr);
                setSchedule(previousSchedule);
            }
        } catch (err) {
            console.error('Error toggling chapter:', err);
        }
    };

    // Focus Mode & Hover Logic
    const [isHovering, setIsHovering] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const hoverTimeoutRef = useRef(null);
    const [compactMode, setCompactMode] = useState(window.innerWidth < 1000);

    // Custom Controls State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isDragging, setIsDragging] = useState(false); // For seeking
    const timeIntervalRef = useRef(null);

    // Memoize options to prevent player reloading on every render
    const playerOptions = React.useMemo(() => ({
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0, // Hides native controls
            rel: 0, // Limits related videos to same channel (best effort)
            modestbranding: 1,
            iv_load_policy: 3, // Hides annotations
            fs: 0,
            disablekb: 1,
            origin: window.location.origin
        },
    }), []);

    // ... (keep useEffects)

    // Calculate Active Chapter
    const activeChapterIndex = React.useMemo(() => {
        if (!video?.chapters) return -1;
        // Find the last chapter that has a start time <= current time
        for (let i = video.chapters.length - 1; i >= 0; i--) {
            if (currentTime >= video.chapters[i].seconds) {
                return i;
            }
        }
        return -1;
    }, [currentTime, video]);

    // ... (keep other handlers)

    {/* Content Switcher */ }
    {
        sidebarTab === 'chapters' ? (
            <>
                {video.chapters && video.chapters.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {video.chapters.map((chapter, idx) => {
                            const isDone = schedule?.completedChapters?.includes(idx);
                            const isActive = idx === activeChapterIndex;

                            return (
                                <div
                                    key={idx}
                                    className="glass-hover"
                                    style={{
                                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : (isDone ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                                        border: isActive ? '1px solid var(--primary)' : (isDone ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'),
                                        borderRadius: '16px',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                                    }}
                                >
                                    {/* Active Indicator Bar */}
                                    {isActive && (
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)' }} />
                                    )}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleChapter(idx); }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: isDone ? '#22c55e' : 'rgba(255,255,255,0.2)',
                                            display: 'flex',
                                            padding: '0.4rem',
                                            borderRadius: '10px',
                                            transition: 'all 0.2s',
                                            zIndex: 2,
                                            marginLeft: isActive ? '0.5rem' : '0'
                                        }}
                                        className="hover-bg-glass"
                                        title={isDone ? "Mark as incomplete" : "Mark as complete"}
                                    >
                                        <CheckCircle size={20} fill={isDone ? '#22c55e' : 'none'} strokeWidth={isDone ? 2 : 1.5} />
                                    </button>

                                    <button
                                        onClick={() => handleSeek(chapter.seconds)}
                                        style={{
                                            flex: 1,
                                            background: 'none',
                                            border: 'none',
                                            textAlign: 'left',
                                            padding: '0.5rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.1rem',
                                            zIndex: 2
                                        }}
                                    >
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isActive ? 'white' : (isDone ? 'rgba(255,255,255,0.4)' : '#ffffff'), textDecoration: isDone ? 'line-through' : 'none' }}>
                                            {chapter.title}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', opacity: (isDone && !isActive) ? 0.5 : 1 }}>
                                            {chapter.timestamp}
                                        </span>
                                    </button>

                                    {isActive && <div style={{ marginRight: '0.5rem' }}><div className="pulsing-dot" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} /></div>}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                        <Map size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                        <p style={{ fontSize: '0.9rem' }}>No chapters found for this video.</p>
                    </div>
                )}
            </>
        ) : sidebarTab === 'playlist' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Playlist Progress Bar */}
                <div style={{ padding: '0 0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Playlist Progress</span>
                        <span>{Math.round((playlistSchedules.filter(s => s.status === 'completed').length / (allVideos.length || 1)) * 100)}%</span>
                    </div>
                    <div className="progress-container" style={{ height: '6px' }}>
                        <div
                            className="progress-bar"
                            style={{ width: `${(playlistSchedules.filter(s => s.status === 'completed').length / (allVideos.length || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {allVideos.map((v, idx) => {
                        const isActive = v._id === videoId;
                        const vSchedule = playlistSchedules.find(s => {
                            const sVid = (typeof s.videoId === 'object') ? s.videoId._id : s.videoId;
                            return sVid === v._id;
                        });
                        const isDone = vSchedule?.status === 'completed';

                        return (
                            <div
                                key={v._id}
                                onClick={() => navigate(`/focus/${v._id}`)}
                                className="glass-hover"
                                style={{
                                    padding: '0.75rem', borderRadius: '12px',
                                    background: isActive ? 'var(--primary)' : (isDone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)'),
                                    border: isActive ? '1px solid var(--primary)' : (isDone ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.05)'),
                                    cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'center'
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: '900', color: isActive ? 'white' : (isDone ? '#4ade80' : 'var(--text-muted)'), minWidth: '20px' }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: '600', color: isActive ? 'white' : (isDone ? '#86efac' : 'var(--text-main)'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</p>
                                    <p style={{ fontSize: '0.7rem', color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{v.duration}</p>
                                </div>
                                {isActive && <Play size={14} fill="white" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
        <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {video.description ? (
                video.description.split(/((?:https?:\/\/|www\.)[^\s]+)/g).map((part, i) => {
                    if (part.match(/^(https?:\/\/|www\.)/)) {
                        const url = part.startsWith('www.') ? 'https://' + part : part;
                        return <a key={i} href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{part}</a>;
                    }
                    return part;
                })
            ) : <p style={{ opacity: 0.5 }}>No description available.</p>}
        </div>
    )
    }
                </div >
            </div >

    {/* Styles for Deck - Add to index.css later or keep inline if acceptable */ }
    < style > {`
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
             `}</style >
        </div >
    );
};

export default FocusMode;
