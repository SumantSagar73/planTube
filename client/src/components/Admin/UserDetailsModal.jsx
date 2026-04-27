import React, { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, BookOpen, Layers, Activity as ActivityIcon, Clock } from 'lucide-react';
import adminService from '../../services/adminService';
import LoadingScreen from '../Shared/LoadingScreen';
import { formatDate } from '../../utils/dateTime';

const UserDetailsModal = ({ userId, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await adminService.getUserDetails(userId);
                setDetails(data);
            } catch (err) {
                console.error('Error fetching user details:', err);
                onClose();
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchDetails();
    }, [userId]);

    if (!userId) return null;
    if (loading) return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingScreen message="Extracting user identity profile..." />
        </div>
    );

    const { user, playlists, groups, activity } = details;

    return (
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.85)', 
            backdropFilter: 'blur(8px)',
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="glass-card" style={{ 
                width: '100%', 
                maxWidth: '900px', 
                maxHeight: '85vh', 
                background: '#0f172a',
                borderRadius: '32px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Modal Header */}
                <div style={{ 
                    padding: '2rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: '900'
                        }}>
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{user.name}</h2>
                            <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Mail size={14} /> {user.email} • {user.role.toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Tabs Navigation */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 2rem' }}>
                    {['overview', 'activity', 'content'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '1rem 1.5rem',
                                background: 'none',
                                border: 'none',
                                color: activeTab === tab ? 'white' : 'var(--text-muted)',
                                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab ? '800' : '600',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Modal Content */}
                <div style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
                    {activeTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <BookOpen size={24} color="#6366f1" style={{ margin: '0 auto 10px' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{playlists.length}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Playlists</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Layers size={24} color="#22c55e" style={{ margin: '0 auto 10px' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{groups.length}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Groups</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Calendar size={24} color="#eab308" style={{ margin: '0 auto 10px' }} />
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{formatDate(user.createdAt)}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined Date</div>
                                </div>
                            </div>
                            
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#ef4444', marginBottom: '1rem' }}>Moderation Status</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Account Freeze</span>
                                        <span style={{ fontWeight: 'bold', color: user.isFrozen ? '#ef4444' : '#22c55e' }}>{user.isFrozen ? 'Active (Restricted)' : 'None'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Deletion Pending</span>
                                        <span style={{ fontWeight: 'bold', color: user.wipeRequested ? '#ef4444' : '#22c55e' }}>{user.wipeRequested ? 'Requested' : 'None'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ActivityIcon size={18} color="#a855f7" /> Recent Interactions
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {activity.map(a => (
                                    <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontWeight: '600', color: 'white' }}>Study Session</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(a.date)}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', fontWeight: '700', background: 'rgba(168, 85, 247, 0.1)', padding: '0.2rem 0.8rem', borderRadius: '20px' }}>
                                            <Clock size={14} /> {Math.round(a.seconds / 60)} mins
                                        </div>
                                    </div>
                                ))}
                                {activity.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>No recent activity records.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookOpen size={18} color="#3b82f6" /> Library Contents ({playlists.length})
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                {playlists.map(p => (
                                    <div key={p._id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ fontWeight: '700', color: 'white', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.playlistId?.playlistTitle || 'Untitled Playlist'}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created {formatDate(p.createdAt)}</p>
                                    </div>
                                ))}
                                {playlists.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gridColumn: 'span 2' }}>No playlists added yet.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
