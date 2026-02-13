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

    // Memoize options to prevent player reloading on every render
    const playerOptions = React.useMemo(() => ({
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin // standard practice to fix some origin warnings
        },
    }), []);

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

    const currentIndex = allVideos.findIndex(v => v._id === videoId);
    const isCompleted = schedule?.status === 'completed';

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#09090b', overflow: 'hidden' }}>

            {/* Header */}
            <div className="glass" style={{ padding: '0 1.5rem', height: '60px', borderRadius: 0, borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => {
                        // If it's the internal "SINGLES" playlist container, go back to Library/Home instead
                        if (playlist?.playlistId === 'SINGLES') {
                            navigate('/library');
                        } else {
                            navigate(`/playlist/${playlist?._id}`);
                        }
                    }}
                    style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                    <ChevronLeft size={18} /> {playlist?.playlistId === 'SINGLES' ? 'Back to Library' : 'Back to Playlist'}
                </button>

                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '50vw', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: videoLoading ? 0.5 : 1 }}>
                    {video.videoId === videoId /* Check if it's the video ID object or our custom db object */ ? video.title : video.title}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={() => {
                            if (showSidebar && sidebarTab === 'description') {
                                setShowSidebar(false);
                            } else {
                                setSidebarTab('description');
                                setShowSidebar(true);
                            }
                        }}
                        title="Show Description"
                        className="hover-bg-glass"
                        style={{
                            background: showSidebar && sidebarTab === 'description' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            border: 'none', padding: '0.5rem', borderRadius: '8px',
                            color: showSidebar && sidebarTab === 'description' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                        }}
                    >
                        <AlignLeft size={18} />
                    </button>

                    {/* Playlist Toggle - Hide if it is a 'Singles' playlist */}
                    {playlist && playlist.playlistId !== 'SINGLES' && (
                        <button
                            onClick={() => {
                                if (showSidebar && sidebarTab === 'playlist') {
                                    setShowSidebar(false);
                                } else {
                                    setSidebarTab('playlist');
                                    setShowSidebar(true);
                                }
                            }}
                            title="Show Playlist"
                            className="hover-bg-glass"
                            style={{
                                background: showSidebar && sidebarTab === 'playlist' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                border: 'none', padding: '0.5rem', borderRadius: '8px',
                                color: showSidebar && sidebarTab === 'playlist' ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                            }}
                        >
                            <ListIcon size={18} />
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (showSidebar && sidebarTab === 'chapters') {
                                setShowSidebar(false);
                            } else {
                                setSidebarTab('chapters');
                                setShowSidebar(true);
                            }
                        }}
                        title="Show Chapters"
                        className="hover-bg-glass"
                        style={{
                            background: showSidebar && sidebarTab === 'chapters' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            border: 'none', padding: '0.5rem', borderRadius: '8px',
                            color: showSidebar && sidebarTab === 'chapters' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                        }}
                    >
                        <Map size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* Left: Video Player */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'black', position: 'relative' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {/* We use a wrapper for 100% height */}
                        <YouTube
                            videoId={video.videoId.includes && video.videoId.includes('http') ? null : (video.youtubeVideoId || video.videoId)}
                            opts={playerOptions}
                            onReady={(event) => (playerRef.current = event.target)}
                            className="youtube-player"
                            style={{ width: '100%', height: '100%', opacity: videoLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}
                        />
                        {videoLoading && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls Bar */}
                    <div style={{ padding: '1rem 2rem', background: '#09090b', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={handlePrevVideo} disabled={currentIndex <= 0} className="btn-secondary" style={{ padding: '0.8rem' }}><ChevronLeft /></button>
                            <button onClick={handleNextVideo} disabled={currentIndex >= allVideos.length - 1} className="btn-secondary" style={{ padding: '0.8rem' }}><ChevronRight /></button>
                        </div>

                        <button
                            onClick={handleToggleComplete}
                            className={`btn-primary ${isCompleted ? 'success' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isCompleted ? '#22c55e' : 'var(--primary)', padding: '0.8rem 2rem' }}
                        >
                            <CheckCircle size={20} />
                            {isCompleted ? 'Mark Undone' : 'Mark Complete'}
                        </button>

                        {isCompleted && currentIndex < allVideos.length - 1 && (
                            <button
                                onClick={handleNextVideo}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', color: 'black', padding: '0.8rem 2rem', marginLeft: '1rem' }}
                            >
                                Next Video <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar (Description & Chapters) */}
                {showSidebar && (
                    <div className="glass" style={{ width: '380px', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideIn 0.3s ease' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', width: '100%' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', background: 'linear-gradient(90deg, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {sidebarTab === 'chapters' ? 'Video Map' : (sidebarTab === 'playlist' ? 'Playlist' : 'About this Video')}
                                    </h3>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {sidebarTab === 'chapters' ? 'Chapters & Progress' : (sidebarTab === 'playlist' ? `${currentIndex + 1} of ${allVideos.length} Videos` : 'Description & Details')}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar (Only visible in chapters view) */}
                            {sidebarTab === 'chapters' && video.chapters && video.chapters.length > 0 && (
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem' }}>
                                    <div style={{
                                        width: `${schedule ? (schedule.completedChapters?.length / video.chapters.length) * 100 : 0}%`,
                                        height: '100%',
                                        background: 'var(--primary)',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                            {/* Content Switcher */}
                            {sidebarTab === 'chapters' ? (
                                <>
                                    {video.chapters && video.chapters.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {video.chapters.map((chapter, idx) => {
                                                const isDone = schedule?.completedChapters?.includes(idx);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="glass-hover"
                                                        style={{
                                                            background: isDone ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                                            border: `1px solid ${isDone ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                                                            borderRadius: '16px',
                                                            padding: '0.5rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() => toggleChapter(idx)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: isDone ? '#22c55e' : 'rgba(255,255,255,0.2)',
                                                                display: 'flex',
                                                                padding: '0.4rem',
                                                                borderRadius: '10px',
                                                                transition: 'all 0.2s',
                                                                zIndex: 2
                                                            }}
                                                            className="hover-bg-glass"
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
                                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isDone ? 'rgba(255,255,255,0.4)' : '#ffffff', textDecoration: isDone ? 'line-through' : 'none' }}>
                                                                {chapter.title}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', opacity: isDone ? 0.5 : 1 }}>
                                                                {chapter.timestamp}
                                                            </span>
                                                        </button>

                                                        {/* Visual glow when done */}
                                                        {isDone && <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '60px', height: '60px', background: '#22c55e', filter: 'blur(30px)', opacity: 0.1, pointerEvents: 'none' }} />}
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
                                            // Check status from playlistSchedules
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
                                                    <div style={{ position: 'relative' }}>
                                                        <img src={v.thumbnail} alt="" style={{ width: '80px', height: '45px', borderRadius: '6px', objectFit: 'cover', opacity: isActive ? 1 : (isDone ? 0.8 : 0.7) }} />
                                                        {isDone && !isActive && (
                                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                                                                <CheckCircle size={14} className="text-green-400" color="#4ade80" />
                                                            </div>
                                                        )}
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
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FocusMode;
