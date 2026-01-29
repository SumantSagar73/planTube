import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const FocusMode = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const { width, height } = useWindowSize();
    const [video, setVideo] = useState(null);
    const [playlist, setPlaylist] = useState(null);
    const [allVideos, setAllVideos] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        fetchVideoData();
    }, [videoId]);

    const fetchVideoData = async () => {
        try {
            // Get video details
            const videoRes = await api.get(`/videos/${videoId}`);
            setVideo(videoRes.data);

            // Get playlist and all videos
            const playlistRes = await api.get(`/playlists/${videoRes.data.playlistId}/videos`);
            setPlaylist(playlistRes.data.playlist);
            setAllVideos(playlistRes.data.videos);

            // Get schedule for this video
            const scheduleRes = await api.get(`/schedules/playlist/${videoRes.data.playlistId}`);
            const videoSchedule = scheduleRes.data.find(s => s.videoId._id === videoId);
            setSchedule(videoSchedule);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching video data:', err);
            setLoading(false);
        }
    };

    const handleMarkComplete = async () => {
        if (!schedule) return;
        try {
            await api.put(`/schedules/${schedule._id}`, { status: 'completed' });
            setShowConfetti(true);
            fetchVideoData();
        } catch (err) {
            console.error('Error marking complete:', err);
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

    if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading...</div>;
    if (!video) return <div style={{ textAlign: 'center', padding: '5rem' }}>Video not found</div>;

    const currentIndex = allVideos.findIndex(v => v._id === videoId);
    const isCompleted = schedule?.status === 'completed';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
            {showConfetti && (
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={500}
                    onConfettiComplete={() => setShowConfetti(false)}
                    style={{ position: 'fixed', top: 0, left: 0, zIndex: 100 }}
                />
            )}
            {/* Minimal Header */}
            <div style={{ padding: '1rem 2rem', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => navigate(`/playlist/${playlist._id}`)}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                    <ChevronLeft size={16} /> Back to Playlist
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {currentIndex + 1} / {allVideos.length}
                    </span>
                    {/* Placeholder for future timer */}
                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} />
                        <span style={{ fontSize: '0.9rem' }}>Timer: Coming Soon</span>
                    </div>
                </div>
            </div>

            {/* Video Player */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ maxWidth: '1400px', aspectRatio: '16/9' }}
                />
            </div>

            {/* Controls Footer */}
            <div style={{ padding: '1.5rem 2rem', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.25rem' }}>{video.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{playlist?.playlistTitle}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={handlePrevVideo}
                            disabled={currentIndex === 0}
                            className="btn-secondary"
                            style={{ opacity: currentIndex === 0 ? 0.3 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleMarkComplete}
                            className="btn-primary"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: isCompleted ? '#22c55e' : 'var(--primary)'
                            }}
                        >
                            <CheckCircle size={20} />
                            {isCompleted ? 'Completed' : 'Mark Complete'}
                        </button>
                        <button
                            onClick={handleNextVideo}
                            disabled={currentIndex === allVideos.length - 1}
                            className="btn-secondary"
                            style={{ opacity: currentIndex === allVideos.length - 1 ? 0.3 : 1, cursor: currentIndex === allVideos.length - 1 ? 'not-allowed' : 'pointer' }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusMode;
