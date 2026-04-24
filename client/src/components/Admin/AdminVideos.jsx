import React, { useState, useEffect } from 'react';
import { Search, Clock, ExternalLink, Hash, Calendar, Download, RefreshCw } from 'lucide-react';
import adminService from '../../services/adminService';
import LoadingScreen from '../Shared/LoadingScreen';
import { useSearchParams } from 'react-router-dom';

const AdminVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [refreshTick, setRefreshTick] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();

    const query = searchParams.get('vq') || '';
    const sortBy = searchParams.get('vsortBy') || 'lastSyncedAt';
    const sortOrder = searchParams.get('vsortOrder') || 'desc';
    const page = Math.max(parseInt(searchParams.get('vpage') || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('vlimit') || '20', 10) || 20, 1), 100);
    const [searchInput, setSearchInput] = useState(query);

    const updateParams = (updates, resetPage = false) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (!value) next.delete(key);
            else next.set(key, String(value));
        });
        if (resetPage) next.set('vpage', '1');
        setSearchParams(next);
    };

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== query) {
                updateParams({ vq: searchInput }, true);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, query]);

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            try {
                const data = await adminService.getAllVideos({ q: query, sortBy, sortOrder, page, limit });
                setVideos(data.items || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
            } catch (err) {
                console.error('Error fetching videos:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, [query, sortBy, sortOrder, page, limit, refreshTick]);

    if (loading) return <LoadingScreen message="Indexing global video records..." />;

    return (
        <div className="admin-videos-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>Global Video Index</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{pagination.total} unique video entities cached</p>
                </div>

                <div className="admin-header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => setRefreshTick((v) => v + 1)}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</button>
                    <button className="btn-secondary" onClick={() => adminService.exportVideosCsv({ q: query, sortBy, sortOrder })}><Download size={14} style={{ marginRight: 6 }} />Export CSV</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.6rem' }} className="admin-filters-grid-two">
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input 
                        type="text" 
                        placeholder="Search title or YouTube ID..." 
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
                        updateParams({ vsortBy: nextSortBy, vsortOrder: nextSortOrder }, true);
                    }}
                >
                    <option value="lastSyncedAt:desc">Last Synced (Newest)</option>
                    <option value="lastSyncedAt:asc">Last Synced (Oldest)</option>
                    <option value="title:asc">Title A-Z</option>
                    <option value="title:desc">Title Z-A</option>
                    <option value="createdAt:desc">Recently Added</option>
                </select>
            </div>

            <div className="glass-card" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                <div className="admin-table-wrap">
                    <table className="admin-table admin-videos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Video Asset</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>YouTube Ident</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Audio Sync</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {videos.map(v => (
                            <tr key={v._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img 
                                            src={v.thumbnail} 
                                            alt="" 
                                            style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '8px' }} 
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '700', fontSize: '0.95rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {v.title}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {v.duration || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Hash size={14} color="#6366f1" />
                                        <code style={{ fontSize: '0.85rem', color: '#818cf8', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {v.youtubeId}
                                        </code>
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={14} />
                                        {new Date(v.lastSyncedAt || v.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                    <a 
                                        href={`https://youtube.com/watch?v=${v.youtubeId}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="icon-btn"
                                        style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                        {videos.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '1rem', color: 'var(--text-muted)' }}>No videos match current filters.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="admin-pagination-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="admin-pagination-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <select
                        className="styled-input"
                        value={String(limit)}
                        onChange={(e) => updateParams({ vlimit: e.target.value }, true)}
                        style={{ minWidth: '96px' }}
                    >
                        <option value="10">10 / page</option>
                        <option value="20">20 / page</option>
                        <option value="50">50 / page</option>
                        <option value="100">100 / page</option>
                    </select>
                    <button className="btn-secondary" disabled={pagination.page <= 1} onClick={() => updateParams({ vpage: 1 })}>First</button>
                    <button className="btn-secondary" disabled={pagination.page <= 1} onClick={() => updateParams({ vpage: Math.max(pagination.page - 1, 1) })}>Previous</button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, idx) => {
                        const start = Math.max(Math.min(pagination.page - 2, pagination.totalPages - 4), 1);
                        const pageNumber = start + idx;
                        return (
                            <button
                                key={pageNumber}
                                className="btn-secondary"
                                onClick={() => updateParams({ vpage: pageNumber })}
                                style={pageNumber === pagination.page ? { borderColor: 'rgba(99,102,241,0.8)', color: '#818cf8' } : undefined}
                            >
                                {pageNumber}
                            </button>
                        );
                    })}
                    <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => updateParams({ vpage: Math.min(pagination.page + 1, pagination.totalPages) })}>Next</button>
                    <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => updateParams({ vpage: pagination.totalPages })}>Last</button>
                </div>
            </div>
        </div>
    );
};

export default AdminVideos;
