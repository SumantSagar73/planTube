import React, { useState, useEffect } from 'react';
import { Search, User, Film, Users, ExternalLink, Download, RefreshCw } from 'lucide-react';
import adminService from '../../services/adminService';
import LoadingScreen from '../Shared/LoadingScreen';
import { useSearchParams } from 'react-router-dom';

const AdminPlaylists = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [refreshTick, setRefreshTick] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();

    const query = searchParams.get('pq') || '';
    const sortBy = searchParams.get('psortBy') || 'createdAt';
    const sortOrder = searchParams.get('psortOrder') || 'desc';
    const page = Math.max(parseInt(searchParams.get('ppage') || '1', 10) || 1, 1);
    const [searchInput, setSearchInput] = useState(query);

    const updateParam = (key, value, resetPage = false) => {
        const next = new URLSearchParams(searchParams);
        if (!value) next.delete(key);
        else next.set(key, String(value));
        if (resetPage) next.set('ppage', '1');
        setSearchParams(next);
    };

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== query) {
                updateParam('pq', searchInput, true);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, query]);

    useEffect(() => {
        const fetchPlaylists = async () => {
            setLoading(true);
            try {
                const data = await adminService.getAllPlaylists({ q: query, sortBy, sortOrder, page, limit: 20 });
                setPlaylists(data.items || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
            } catch (err) {
                console.error('Error fetching playlists:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylists();
    }, [query, sortBy, sortOrder, page, refreshTick]);

    if (loading) return <LoadingScreen message="Scanning global library..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>Global Library</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{pagination.total} total playlists in ecosystem</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => setRefreshTick((v) => v + 1)}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</button>
                    <button className="btn-secondary" onClick={() => adminService.exportPlaylistsCsv({ q: query, sortBy, sortOrder })}><Download size={14} style={{ marginRight: 6 }} />Export CSV</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.6rem' }} className="admin-filters-grid-two">
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input 
                        type="text" 
                        placeholder="Filter by title or creator..." 
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ 
                            padding: '0.8rem 1rem 0.8rem 2.8rem', 
                            borderRadius: '16px', 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            width: '100%',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <select
                    className="styled-input"
                    value={`${sortBy}:${sortOrder}`}
                    onChange={(e) => {
                        const [nextSortBy, nextSortOrder] = e.target.value.split(':');
                        updateParam('psortBy', nextSortBy, false);
                        updateParam('psortOrder', nextSortOrder, true);
                    }}
                >
                    <option value="createdAt:desc">Newest</option>
                    <option value="createdAt:asc">Oldest</option>
                    <option value="playlistTitle:asc">Title A-Z</option>
                    <option value="playlistTitle:desc">Title Z-A</option>
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {playlists.map(p => (
                    <div key={p._id} className="glass-card" style={{ 
                        borderRadius: '24px', 
                        overflow: 'hidden',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border)',
                        transition: 'transform 0.2s ease',
                        cursor: 'default'
                    }}>
                        <div style={{ position: 'relative', height: '160px' }}>
                            <img 
                                src={p.thumbnail} 
                                alt={p.playlistTitle}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                            />
                            <div style={{ 
                                position: 'absolute', 
                                bottom: '12px', 
                                right: '12px',
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Film size={12} /> {p.videoCount} Videos
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '850', marginBottom: '1rem', lineHeight: '1.3' }}>
                                {p.playlistTitle}
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <User size={14} />
                                    <span>Created by: <strong style={{ color: 'white' }}>{p.userId?.name || 'Public System'}</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <Users size={14} />
                                    <span>Used by: <strong style={{ color: '#6366f1' }}>{p.userCount} users</strong></span>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                <a 
                                    href={`https://www.youtube.com/playlist?list=${p.playlistId}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.8rem',
                                        fontWeight: '700',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <ExternalLink size={14} /> YouTube
                                </a>
                                <button
                                    onClick={() => window.open(`/playlist/${p._id}`, '_blank')}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        color: '#818cf8',
                                        border: 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Inspect View
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {playlists.length === 0 && (
                    <div className="glass-card" style={{ padding: '1rem', borderRadius: '16px', color: 'var(--text-muted)' }}>
                        No playlists match current filters.
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Page {pagination.page} of {pagination.totalPages}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" disabled={pagination.page <= 1} onClick={() => updateParam('ppage', Math.max(pagination.page - 1, 1), false)}>Previous</button>
                    <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => updateParam('ppage', Math.min(pagination.page + 1, pagination.totalPages), false)}>Next</button>
                </div>
            </div>
        </div>
    );
};

export default AdminPlaylists;
