import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlayCircle, Clock, Copy, ArrowRight, Video } from 'lucide-react';
import LoadingScreen from '../components/Shared/LoadingScreen';
import AlertModal from '../components/Shared/AlertModal';
import ConfirmModal from '../components/Shared/ConfirmModal';

const PublicPlaylist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cloning, setCloning] = useState(false);
    const [error, setError] = useState('');

    // Modal States
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', success: false });
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: null,
        danger: false,
        confirmText: ''
    });

    const showAlert = (title, message, success = false) => {
        setAlertState({ isOpen: true, title, message, success });
    };

    const triggerConfirm = (title, description, onConfirm, danger = false, confirmText = 'Confirm') => {
        setConfirmState({ isOpen: true, title, description, onConfirm, danger, confirmText });
    };

    useEffect(() => {
        fetchPublicData();
    }, [id]);

    const fetchPublicData = async () => {
        try {
            const res = await api.get(`/playlists/${id}/public`);
            setPlaylist(res.data.playlist);
            setVideos(res.data.videos);
        } catch (err) {
            console.error(err);
            setError('Playlist not found or is private.');
        } finally {
            setLoading(false);
        }
    };

    const handleClone = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        triggerConfirm(
            'Import Playlist?',
            'Would you like to add this playlist and its videos to your account?',
            async () => {
                setCloning(true);
                try {
                    // 1. Create Playlist
                    const createRes = await api.post('/playlists', {
                        title: `${playlist.title} (Imported)`,
                        description: playlist.description
                    });
                    const newId = createRes.data._id;

                    // 2. Add all videos
                    for (const v of videos) {
                        await api.post(`/playlists/${newId}/videos`, {
                            youtubeVideoId: v.youtubeVideoId
                        });
                    }

                    showAlert('Success', 'Playlist imported to your library!', true);
                    setTimeout(() => navigate(`/custom-playlist/${newId}`), 2000);
                } catch (err) {
                    console.error(err);
                    showAlert('Import Failed', 'Failed to import playlist');
                } finally {
                    setCloning(false);
                }
            },
            false,
            'Import'
        );
    };

    if (loading) return <LoadingScreen />;
    if (error) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>😕 Oops</h2>
            <p>{error}</p>
            <Link to="/" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--primary)' }}>Go Home</Link>
        </div>
    );

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
            {/* Hero */}
            <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px', textAlign: 'center', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                        boxShadow: '0 10px 30px rgba(99,102,241,0.4)'
                    }}>
                        <Video size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>{playlist.title}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                        {playlist.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <span>by <strong style={{ color: 'white' }}>{playlist.creatorId?.name || 'Unknown'}</strong></span>
                        <span>•</span>
                        <span>{videos.length} Videos</span>
                    </div>

                    <button
                        onClick={handleClone}
                        disabled={cloning}
                        className="btn-primary"
                        style={{ marginTop: '2.5rem', padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '50px' }}
                    >
                        {cloning ? 'Importing...' : 'Add to My Account'}
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {videos.map((video, idx) => (
                    <a
                        key={video._id}
                        href={`https://youtu.be/${video.youtubeVideoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="glass glass-hover"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '1.5rem',
                            padding: '1rem', borderRadius: '20px', textDecoration: 'none', color: 'inherit'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: 'rgba(255,255,255,0.1)', width: '30px', textAlign: 'center' }}>
                            {idx + 1}
                        </span>
                        <img src={video.thumbnail} alt="" style={{ width: '120px', borderRadius: '12px', aspectRatio: '16/9', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.3rem', lineHeight: '1.3' }}>{video.title}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> {video.duration}</span>
                            </div>
                        </div>
                        <div style={{ padding: '0.5rem', opacity: 0.5 }}>
                            <PlayCircle size={24} />
                        </div>
                    </a>
                ))}
            </div>
            {/* Modals */}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                success={alertState.success}
            />

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    if (confirmState.onConfirm) confirmState.onConfirm();
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                }}
                title={confirmState.title}
                description={confirmState.description}
                confirmText={confirmState.confirmText}
                danger={confirmState.danger}
            />
        </div>
    );
};

export default PublicPlaylist;
