import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, ChevronLeft, ChevronRight, Clock, Map, AlignLeft } from 'lucide-react';
import YouTube from 'react-youtube';

const FocusMode = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [playlist, setPlaylist] = useState(null);
    const [allVideos, setAllVideos] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);

    // UI State
    const [showSidebar, setShowSidebar] = useState(true);
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
        setLoading(true);
        try {
            // Get video details
            const videoRes = await api.get(`/videos/${videoId}`);
            setVideo(videoRes.data);

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

            setPlaylist(playlistData);
            setAllVideos(Array.isArray(videosData) ? videosData : []);

            // Get schedule for this video
            try {
                const scheduleRes = await api.get(`/schedules/playlist/${videoRes.data.playlistId}`);
                // Match against the database _id, not the URL videoId param
                const videoSchedule = scheduleRes.data.find(s => {
                    const sVideoId = (typeof s.videoId === 'object') ? s.videoId._id : s.videoId;
                    return sVideoId === videoRes.data._id;
                });
                setSchedule(videoSchedule);
            } catch (error) {
                console.log("No schedule found or error fetching schedule");
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching video data:', err);
            setLoading(false);
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
            fetchVideoData(); // Refresh UI to get the updated status
        } catch (err) {
            console.error('Error toggling complete:', err);
        }
    };

    const handleNextVideo = () => {
        const currentIndex = allVideos.findIndex(v => v._id === videoId);
        if (currentIndex < allVideos.length - 1) {
            navigate(`/focus/${allVideos[currentIndex + 1]._id}`);
        }
    };

    const handlePrevVideo = () => {
        const currentIndex = allVideos.findIndex(v => v._id === videoId);
        if (currentIndex > 0) {
            navigate(`/focus/${allVideos[currentIndex - 1]._id}`);
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
                const res = await api.post('/schedules', {
                    videoId: videoId,
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

            const res = await api.put(`/schedules/${currentSchedule._id}`, { completedChapters: newCompleted });
            setSchedule(res.data);
        } catch (err) {
            console.error('Error toggling chapter:', err);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '5rem', color: 'white' }}>Loading Focus Mode...</div>;
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

                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '50vw', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {video.videoId === videoId /* Check if it's the video ID object or our custom db object */ ? video.title : video.title}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        title={showSidebar ? "Hide Video Map" : "Show Video Map"}
                        style={{ background: showSidebar ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', padding: '0.5rem', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.3s' }}
                    >
                        {showSidebar ? <AlignLeft size={18} /> : <Map size={18} />}
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
                            className="youtube-player" // You might need global CSS or inline styles for this class to ensure 100%
                            style={{ width: '100%', height: '100%' }}
                        />
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
                    </div>
                </div>

                {/* Right: Sidebar (Description & Chapters) */}
                {showSidebar && (
                    <div className="glass" style={{ width: '380px', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideIn 0.3s ease' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', background: 'linear-gradient(90deg, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Video Map</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Chapters & Progress</p>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                            {/* Chapters Section */}
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FocusMode;
