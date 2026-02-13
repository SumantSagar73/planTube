import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    LayoutGrid, List as ListIcon, Search, Filter, Link as LinkIcon,
    Plus, Pin, MoreVertical, Play, Clock, CheckCircle, Video, PinOff,
    ExternalLink, RefreshCw, Trash2, Youtube as YoutubeIcon, Rocket
} from 'lucide-react';
import LoadingScreen from '../components/Shared/LoadingScreen';
import AlertModal from '../components/Shared/AlertModal';
import ConfirmModal from '../components/Shared/ConfirmModal';

const Library = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'imported', 'custom'
    const [search, setSearch] = useState('');

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
        fetchLibrary();
    }, []);

    const fetchLibrary = async () => {
        try {
            const res = await api.get('/playlists/library');
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePin = async (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (item.type === 'video') {
                // Use dbId if available (for backend ID), otherwise originalId might be YouTube ID which backend now handles
                await api.put(`/videos/${item.dbId || item._id}/pin`);
            } else {
                await api.put(`/playlists/${item._id}/pin`);
            }
            // Optimistic update or refetch
            fetchLibrary();
        } catch (err) {
            console.error('Failed to toggle pin', err);
        }
    };

    const handleShare = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        const link = window.location.origin + (item.type === 'video' ? `/focus/${item._id}` : (item.type === 'custom' ? `/custom-playlist/${item._id}` : `/playlist/${item._id}`));
        navigator.clipboard.writeText(link);
        showAlert('Link Copied', 'Success! The shareable link is now in your clipboard.', true);
    };

    const handleSync = async (e, item) => {
        e.preventDefault();
        e.stopPropagation();

        // Allow sync for imported playlists OR individual videos
        if (item.type !== 'imported' && item.type !== 'video') return;

        const isVideo = item.type === 'video';
        const endpoint = isVideo
            ? `/videos/${item.dbId || item._id}/sync`
            : `/playlists/${item._id}/sync`;

        triggerConfirm(
            `Resync ${isVideo ? 'Video' : 'Playlist'}?`,
            `Do you want to refresh "${item.title}" from YouTube?`,
            async () => {
                try {
                    await api.put(endpoint);
                    showAlert('Sync Complete', 'Updated successfully!', true);
                    fetchLibrary();
                } catch (err) {
                    console.error('Failed to sync', err);
                    showAlert('Sync Failed', err.response?.data?.msg || err.message);
                }
            }
        );
    };

    const handleDelete = async (e, item) => {
        e.preventDefault();
        e.stopPropagation();

        const typeLabel = item.type === 'video' ? 'video' : 'playlist';

        triggerConfirm(
            `Delete ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}?`,
            `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone.`,
            async () => {
                try {
                    if (item.type === 'video') {
                        await api.delete(`/videos/${item.dbId || item._id}`);
                    } else {
                        await api.delete(`/playlists/${item._id}`);
                    }
                    showAlert('Deleted', `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} has been removed.`, true);
                    fetchLibrary();
                } catch (err) {
                    console.error('Failed to delete', err);
                    showAlert('Delete Failed', err.response?.data?.msg || err.message);
                }
            },
            true,
            'Delete'
        );
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
        const matchesType = filter === 'all' || item.type === filter;
        return matchesSearch && matchesType;
    });

    if (loading) return <LoadingScreen message="Loading Library..." />;

    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>Library</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>All your learning collections.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/my-playlists')} // Or open generic create modal
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={18} />
                        <span>New Playlist</span>
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="glass" style={{ padding: '0.75rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="input-glass"
                            placeholder="Snapshot search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '10px' }}
                        />
                    </div>
                    <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }}></div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['all', 'imported', 'custom', 'video'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    background: filter === f ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                                    border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px',
                                    fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingLeft: '1rem' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            background: viewMode === 'grid' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
                            border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            background: viewMode === 'list' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: viewMode === 'list' ? 'white' : 'var(--text-muted)',
                            border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <ListIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {!loading && filteredItems.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
                    <div className="glass" style={{ padding: '3rem', borderRadius: '32px', maxWidth: '500px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(99,102,241,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <YoutubeIcon size={32} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Your Library is Empty</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            Turn any YouTube playlist/video into an interactive course.
                            Paste a link in the <strong>Import Bar</strong> at the top of the screen to get started!
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--primary)', fontWeight: '700' }}>
                            <Rocket size={20} />
                            <span>First time? Use our guide in the menu!</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {filteredItems.length > 0 && viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {filteredItems.map(item => (
                        <Link
                            key={item._id}
                            to={item.type === 'video' ? `/focus/${item._id}` : (item.type === 'custom' ? `/custom-playlist/${item._id}` : `/playlist/${item._id}`)}
                            className="glass glass-hover"
                            style={{ borderRadius: '20px', overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                                <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {item.isPinned && (
                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--primary)', padding: '0.3rem', borderRadius: '50%' }}>
                                        <Pin size={12} fill="white" color="white" />
                                    </div>
                                )}
                                {item.type === 'video' ? (
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '0.5rem' }}>
                                        <Play size={24} fill="white" color="white" />
                                    </div>
                                ) : (
                                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.7)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Video size={10} /> {item.videoCount}
                                    </div>
                                )}
                                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', color: 'white' }}>
                                    {item.videoCount}
                                </div>
                            </div>
                            <div style={{ padding: '1rem', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.3rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{item.title}</h3>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button
                                            onClick={(e) => handleShare(e, item)}
                                            className="icon-btn-compact share"
                                            title="Copy Link"
                                        >
                                            <LinkIcon size={14} />
                                        </button>
                                        {(item.type === 'imported' || item.type === 'video') && (
                                            <button
                                                onClick={(e) => handleSync(e, item)}
                                                className="icon-btn-compact sync"
                                                title="Resync from YouTube"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleTogglePin(e, item)}
                                            className={`icon-btn-compact pin ${item.isPinned ? 'active' : ''}`}
                                            title={item.isPinned ? "Unpin" : "Pin"}
                                        >
                                            {item.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, item)}
                                            className="icon-btn-compact delete"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: '600',
                                        color: item.type === 'custom' ? '#f59e0b' : (item.type === 'video' ? '#ef4444' : '#3b82f6'),
                                        background: item.type === 'custom' ? 'rgba(245, 158, 11, 0.1)' : (item.type === 'video' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
                                        padding: '0.1rem 0.5rem', borderRadius: '4px'
                                    }}>
                                        {item.type === 'custom' ? 'Personal' : (item.type === 'video' ? 'Video' : 'Imported')}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : filteredItems.length > 0 ? (
                <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Playlist</th>
                                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Videos</th>
                                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created</th>
                                <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item._id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img src={item.thumbnail} alt="" style={{ width: '60px', borderRadius: '8px', aspectRatio: '16/9', objectFit: 'cover' }} />
                                                {item.type === 'video' && (
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '0.1rem' }}>
                                                        <Play size={10} fill="white" color="white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <Link
                                                    to={item.type === 'video' ? `/focus/${item._id}` : (item.type === 'custom' ? `/custom-playlist/${item._id}` : `/playlist/${item._id}`)}
                                                    style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white', textDecoration: 'none', display: 'block' }}
                                                >
                                                    {item.title}
                                                </Link>
                                                {item.isPinned && (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                                        <Pin size={10} /> Pinned to Dashboard
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: '600',
                                            color: item.type === 'custom' ? '#f59e0b' : (item.type === 'video' ? '#ef4444' : '#3b82f6'),
                                            background: item.type === 'custom' ? 'rgba(245, 158, 11, 0.1)' : (item.type === 'video' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
                                            padding: '0.2rem 0.6rem', borderRadius: '6px'
                                        }}>
                                            {item.type === 'custom' ? 'Custom' : (item.type === 'video' ? 'Video' : 'Imported')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                                        {item.videoCount}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                        <button
                                            onClick={(e) => handleShare(e, item)}
                                            className="icon-btn-compact share"
                                            title="Copy Link"
                                        >
                                            <LinkIcon size={14} />
                                        </button>
                                        {(item.type === 'imported' || item.type === 'video') && (
                                            <button
                                                onClick={(e) => handleSync(e, item)}
                                                className="icon-btn-compact sync"
                                                title="Resync from YouTube"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleTogglePin(e, item)}
                                            className={`icon-btn-compact pin ${item.isPinned ? 'active' : ''}`}
                                            title={item.isPinned ? "Unpin" : "Pin"}
                                        >
                                            {item.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, item)}
                                            className="icon-btn-compact delete"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <Link
                                            to={item.type === 'video' ? `/focus/${item._id}` : (item.type === 'custom' ? `/custom-playlist/${item._id}` : `/playlist/${item._id}`)}
                                            className="btn-secondary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none', borderRadius: '8px' }}
                                        >
                                            {item.type === 'video' ? 'Play' : 'View'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
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

export default Library;
