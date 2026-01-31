import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft, Plus, Trash2, GripVertical, Check, Copy,
    Globe, Lock, Share2, ExternalLink, RefreshCw
} from 'lucide-react';
import LoadingScreen from '../components/Shared/LoadingScreen';
import AlertModal from '../components/Shared/AlertModal';
import ConfirmModal from '../components/Shared/ConfirmModal';

const CustomPlaylistDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addUrl, setAddUrl] = useState('');
    const [adding, setAdding] = useState(false);

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

    // Drag and Drop
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // This endpoint (unified or custom) should return { playlist, videos }
            const res = await api.get(`/playlists/${id}`);
            if (res.data.playlist) {
                setPlaylist(res.data.playlist);
                setVideos(res.data.videos || []);
            } else {
                // Fallback if unified endpoint behaves differently (unlikely with my changes)
                setPlaylist(res.data);
            }
        } catch (err) {
            console.error(err);
            // Handle 404/403
        } finally {
            setLoading(false);
        }
    };

    const handleSyncVideo = async (videoId) => {
        try {
            await api.put(`/playlists/${id}/videos/${videoId}/sync`);
            // Update local state
            fetchData(); // Easier to refetch to get all updated fields
            showAlert('Video Refreshed', 'Successfully updated video details from YouTube.', true);
        } catch (err) {
            console.error(err);
            showAlert('Sync Failed', err.response?.data?.msg || err.message);
        }
    };

    const handleAddVideo = async (e) => {
        e.preventDefault();
        if (!addUrl) return;
        setAdding(true);
        try {
            const res = await api.post(`/playlists/${id}/videos`, { youtubeVideoId: addUrl });
            setVideos([...videos, res.data]);
            setAddUrl('');
            showAlert('Success', 'Video added to your collection!', true);
        } catch (err) {
            console.error(err);
            showAlert('Add Failed', err.response?.data?.msg || err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteVideo = async (videoId) => {
        const video = videos.find(v => v._id === videoId);
        triggerConfirm(
            'Remove Video?',
            `Are you sure you want to remove "${video?.title || 'this video'}" from your playlist?`,
            async () => {
                try {
                    await api.delete(`/playlists/${id}/videos/${videoId}`);
                    setVideos(videos.filter(v => v._id !== videoId));
                    showAlert('Removed', 'Video has been removed from the playlist.', true);
                } catch (err) {
                    console.error(err);
                    showAlert('Delete Failed', err.response?.data?.msg || err.message);
                }
            },
            true,
            'Remove'
        );
    };

    const handleVisibilityToggle = async () => {
        const newVis = playlist.visibility === 'private' ? 'link' : 'private';
        try {
            const res = await api.put(`/playlists/${id}/visibility`, { visibility: newVis });
            setPlaylist({ ...playlist, visibility: res.data.visibility });
        } catch (err) {
            console.error(err);
        }
    };

    // Drag & Drop Handlers
    const handleSort = async () => {
        const _videos = [...videos];
        const draggedItemContent = _videos.splice(dragItem.current, 1)[0];
        _videos.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;
        setVideos(_videos);

        // API Call to persist order
        try {
            await api.put(`/playlists/${id}/videos/reorder`, {
                videoIds: _videos.map(v => v._id)
            });
        } catch (err) {
            console.error('Reorder failed', err);
        }
    };

    const copyShareLink = () => {
        const url = `${window.location.origin}/shared-playlist/${id}`;
        navigator.clipboard.writeText(url);
        showAlert('Link Copied', 'Shareable link copied to clipboard!', true);
    };

    if (loading) return <LoadingScreen />;
    if (!playlist) return <div style={{ padding: '2rem', textAlign: 'center' }}>Playlist not found.</div>;

    const shareUrl = `${window.location.origin}/shared-playlist/${id}`;

    return (
        <div style={{ paddingBottom: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
            <button onClick={() => navigate('/my-playlists')} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer'
            }}>
                <ArrowLeft size={18} /> Back to My Playlists
            </button>

            {/* Header */}
            <div className="glass" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.1 }}>{playlist.title}</h1>
                            <div style={{
                                padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: playlist.visibility === 'link' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                color: playlist.visibility === 'link' ? '#86efac' : 'var(--text-muted)'
                            }}>
                                {playlist.visibility === 'link' ? <Globe size={14} /> : <Lock size={14} />}
                                {playlist.visibility === 'link' ? 'Public' : 'Private'}
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
                            {playlist.description || 'No description provided.'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '12px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', marginLeft: '0.5rem' }}>Visibility</span>
                            <button
                                onClick={handleVisibilityToggle}
                                style={{
                                    background: playlist.visibility === 'link' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px',
                                    fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                {playlist.visibility === 'link' ? 'Unique Link' : 'Private'}
                            </button>
                        </div>

                        {playlist.visibility === 'link' && (
                            <div className="glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Share2 size={14} /> Share Link
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        readOnly
                                        value={shareUrl}
                                        className="input-glass"
                                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                                    />
                                    <button onClick={copyShareLink} className="btn-secondary" style={{ padding: '0.5rem' }}>
                                        <Copy size={16} />
                                    </button>
                                </div>
                                <a href={shareUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem', textDecoration: 'none' }}>
                                    Open Public View <ExternalLink size={12} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Video */}
            <form onSubmit={handleAddVideo} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <input
                    type="text"
                    value={addUrl}
                    onChange={e => setAddUrl(e.target.value)}
                    placeholder="Paste YouTube Video URL here..."
                    className="input-glass"
                    style={{ flex: 1, padding: '1rem 1.5rem', fontSize: '1rem' }}
                />
                <button type="submit" disabled={adding} className="btn-primary" style={{ padding: '0 2rem', fontSize: '1rem', fontWeight: '700' }}>
                    {adding ? 'Adding...' : 'Add Video'}
                </button>
            </form>

            {/* Video List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                        <p>No videos yet. Add one above!</p>
                    </div>
                ) : (
                    videos.map((video, index) => (
                        <div
                            key={video._id}
                            draggable
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleSort}
                            onDragOver={(e) => e.preventDefault()}
                            className="glass glass-hover"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 1.5rem',
                                borderRadius: '16px', background: 'var(--bg-card)', cursor: 'grab'
                            }}
                        >
                            <div style={{ color: 'var(--text-muted)', cursor: 'grab' }}><GripVertical size={20} /></div>

                            <img src={video.thumbnail} alt="" style={{ width: '100px', borderRadius: '8px', aspectRatio: '16/9', objectFit: 'cover', background: 'black' }} />

                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.2rem' }}>{video.title}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{video.duration || '0:00'}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleSyncVideo(video._id)}
                                    title="Sync from YouTube"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)',
                                        border: 'none', width: '36px', height: '36px', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                    className="hover-text-primary"
                                >
                                    <RefreshCw size={16} />
                                </button>

                                <button
                                    onClick={() => handleDeleteVideo(video._id)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                        border: 'none', width: '36px', height: '36px', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
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

export default CustomPlaylistDetails;
