import React, { useState, useEffect } from 'react';
import { Search, Play, Clock, ExternalLink, Hash, Calendar } from 'lucide-react';
import adminService from '../../services/adminService';
import LoadingScreen from '../Shared/LoadingScreen';

const AdminVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const data = await adminService.getAllVideos();
                setVideos(data);
            } catch (err) {
                console.error('Error fetching videos:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const filtered = videos.filter(v => 
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.youtubeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingScreen message="Indexing global video records..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>Global Video Index</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{videos.length} unique video entities cached</p>
                </div>
                
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input 
                        type="text" 
                        placeholder="Search title or YouTube ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            padding: '0.8rem 1rem 0.8rem 2.8rem', 
                            borderRadius: '16px', 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            width: '400px',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Video Asset</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>YouTube Ident</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Audio Sync</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(v => (
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
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminVideos;
