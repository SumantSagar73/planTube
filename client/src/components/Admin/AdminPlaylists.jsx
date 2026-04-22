import React, { useState, useEffect } from 'react';
import { Search, BookOpen, User, Film, Users, ExternalLink } from 'lucide-react';
import adminService from '../../services/adminService';
import LoadingScreen from '../Shared/LoadingScreen';

const AdminPlaylists = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const data = await adminService.getAllPlaylists();
                setPlaylists(data);
            } catch (err) {
                console.error('Error fetching playlists:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylists();
    }, []);

    const filtered = playlists.filter(p => 
        p.playlistTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.userId && p.userId.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <LoadingScreen message="Scanning global library..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>Global Library</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{playlists.length} total playlists in ecosystem</p>
                </div>
                
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input 
                        type="text" 
                        placeholder="Filter by title or creator..." 
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filtered.map(p => (
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
            </div>
        </div>
    );
};

export default AdminPlaylists;
