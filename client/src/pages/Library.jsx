import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    LayoutGrid, List as ListIcon, Search,
    Plus, RefreshCw, Rocket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/Shared/LoadingScreen';
import AlertModal from '../components/Shared/AlertModal';
import ConfirmModal from '../components/Shared/ConfirmModal';
import LibraryItem from '../components/Playlist/LibraryItem';

const Library = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('grid');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [syncingIds, setSyncingIds] = useState(new Set());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 820);

    const { user } = useAuth();
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', success: false });
    const [confirmState, setConfirmState] = useState({
        isOpen: false, title: '', description: '', onConfirm: null, danger: false, confirmText: ''
    });

    const showAlert = (title, message, success = false) => {
        setAlertState({ isOpen: true, title, message, success });
    };

    const triggerConfirm = (title, description, onConfirm, danger = false, confirmText = 'Confirm') => {
        setConfirmState({ isOpen: true, title, description, onConfirm, danger, confirmText });
    };

    useEffect(() => {
        fetchLibrary();
    }, [user]);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 820);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (isMobile && viewMode === 'list') {
            setViewMode('grid');
        }
    }, [isMobile, viewMode]);

    const fetchLibrary = async (useCache = true) => {
        const userId = user?.id || user?._id;
        const cacheKey = `library_items_${userId}`;

        if (useCache && userId) {
            const cachedItems = sessionStorage.getItem(cacheKey);
            if (cachedItems) {
                setItems(JSON.parse(cachedItems));
                setLoading(false);
            }
        }

        try {
            const res = await api.get('/playlists/library');
            setItems(res.data);
            if (userId) sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePin = async (e, item) => {
        e.preventDefault();
        const originalItems = [...items];
        setItems(prev => prev.map(i => i._id === item._id ? { ...i, isPinned: !i.isPinned } : i)
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            }));

        try {
            // Consistently use the playlist pin endpoint for items in the library (both playlists and standalone videos)
            // as their pinning status is managed via the UserPlaylist link.
            await api.put(`/playlists/${item.dbId || item._id}/pin`);
            
            sessionStorage.setItem('library_items', JSON.stringify(items));
        } catch (err) {
            setItems(originalItems);
            showAlert('Error', 'Could not update pin status');
        }
    };

    const handleDelete = (e, item) => {
        e.preventDefault();
        triggerConfirm(
            'Remove from Library?',
            `Are you sure you want to remove "${item.title}"? Progress and schedules for this ${item.type} will be lost.`,
            async () => {
                try {
                    if (item.type === 'custom') {
                        await api.delete(`/playlists/${item._id}`);
                    } else if (item.type === 'video') {
                        // Standalone videos are also backed by a dummy Playlist (VIDEO_...)
                        // and a UserPlaylist link. So we remove the playlist link.
                        await api.delete(`/playlists/${item.dbId}`);
                    } else {
                        await api.delete(`/playlists/${item._id}`);
                    }
                    const updated = items.filter(i => i._id !== item._id);
                    setItems(updated);
                    const userId = user?.id || user?._id;
                    const cacheKey = `library_items_${userId}`;
                    sessionStorage.setItem(cacheKey, JSON.stringify(updated));
                    setConfirmState({ ...confirmState, isOpen: false });
                } catch (err) {
                    showAlert('Error', 'Could not delete item');
                }
            },
            true,
            'Delete'
        );
    };

    const handleSync = async (e, item) => {
        e.preventDefault();
        if (syncingIds.has(item._id)) return;

        setSyncingIds(prev => new Set(prev).add(item._id));
        try {
            await api.put(`/playlists/${item.dbId || item._id}/sync`);
            fetchLibrary(false);
            showAlert('Success', `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} synced with YouTube`, true);
        } catch (err) {
            showAlert('Error', 'Sync failed');
        } finally {
            setSyncingIds(prev => {
                const next = new Set(prev);
                next.delete(item._id);
                return next;
            });
        }
    };

    const handleShare = (e, item) => {
        e.preventDefault();
        const baseUrl = window.location.origin;
        const link = item.type === 'video'
            ? `${baseUrl}/focus/${item._id}`
            : (item.type === 'custom' ? `${baseUrl}/custom-playlist/${item._id}` : `${baseUrl}/playlist/${item._id}`);

        navigator.clipboard.writeText(link).then(() => {
            showAlert('Link Copied', 'Shareable link copied to clipboard!', true);
        }).catch(err => {
            showAlert('Error', 'Could not copy link');
        });
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'video' && item.type === 'video') ||
            (filter === 'playlist' && (item.type === 'playlist' || item.type === 'imported')) ||
            (filter === 'custom' && item.type === 'custom');
        return matchesSearch && matchesFilter;
    });

    if (loading && items.length === 0) return <LoadingScreen message="Loading your library..." />;

    return (
        <div className="library-page" style={{ padding: '1.5rem 1rem 5rem' }}>
            {/* Focal Header */}
            <div className="library-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <h1 className="library-title" style={{ fontSize: '3.5rem', fontWeight: '950', marginBottom: '0.5rem', letterSpacing: '-2px', color: 'var(--text-main)' }}>
                        Vault <span style={{ color: 'var(--primary)' }}>.</span>
                    </h1>
                    <p className="library-subtitle" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>
                        Your curated learning collections.
                    </p>
                </div>
                <div className="library-header-actions" style={{ display: 'flex', gap: '1.25rem' }}>
                    <div className="glass library-view-toggle" style={{ display: 'flex', padding: '0.4rem', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                        <button onClick={() => setViewMode('grid')} className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}><LayoutGrid size={18} /></button>
                        {!isMobile && <button onClick={() => setViewMode('list')} className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}><ListIcon size={18} /></button>}
                    </div>
                    <button onClick={() => navigate('/import')} className="btn-primary library-import-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.75rem', borderRadius: '18px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                        <Plus size={20} /> Import New
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="library-toolbar" data-section="filter-bar" style={{ marginBottom: '3rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div className="library-search-wrap" style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                    <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} size={20} />
                    <input
                        type="text"
                        placeholder="Search collection..."
                        className="input-glass"
                        style={{ paddingLeft: '3.5rem', width: '100%', height: '56px', borderRadius: '18px', fontSize: '1rem' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="library-filter-tabs" style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    {['all', 'video', 'playlist', 'custom'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding: '0.6rem 1.5rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800',
                            background: filter === f ? 'var(--primary)' : 'transparent',
                            color: filter === f ? 'white' : 'var(--text-muted)',
                            border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            letterSpacing: '0.5px'
                        }}>
                            {f === 'video' ? 'VIDEOS' : (f === 'playlist' ? 'PLAYLISTS' : f.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="glass" style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: '40px', border: '1px dashed var(--glass-border)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>📚</div>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '1rem' }}>Library is silent</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>Start your journey by importing a YouTube playlist or creating a unique custom one.</p>
                    <button onClick={() => navigate('/import')} className="btn-primary" style={{ padding: '1rem 2rem' }}>Import First Playlist</button>
                </div>
            ) : (
            <div data-section="playlist-grid">
                {viewMode === 'grid' ? (
                    <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {filteredItems.map(item => (
                            <LibraryItem
                                key={item._id}
                                item={item}
                                viewMode="grid"
                                onTogglePin={handleTogglePin}
                                onDelete={handleDelete}
                                onSync={handleSync}
                                onShare={handleShare}
                                isSyncing={syncingIds.has(item._id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass library-list-wrap" style={{ borderRadius: '32px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <table className="library-list-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Collection</th>
                                    <th style={{ padding: '1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <LibraryItem
                                        key={item._id}
                                        item={item}
                                        viewMode="list"
                                        onTogglePin={handleTogglePin}
                                        onDelete={handleDelete}
                                        onSync={handleSync}
                                        onShare={handleShare}
                                        isSyncing={syncingIds.has(item._id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            )}

            <style>{`
                .view-btn {
                    padding: 0.5rem 0.75rem;
                    border-radius: 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .view-btn:hover {
                    color: white;
                    background: rgba(255,255,255,0.05);
                }
                .view-btn.active {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
            `}</style>

            <AlertModal isOpen={alertState.isOpen} title={alertState.title} message={alertState.message} success={alertState.success} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                description={confirmState.description}
                onConfirm={confirmState.onConfirm}
                onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
                danger={confirmState.danger}
                confirmText={confirmState.confirmText}
            />
        </div>
    );
};

export default Library;
