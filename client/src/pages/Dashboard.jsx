import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Play, Clock, Check, ListChecks,
    Youtube, ChevronRight, Pin, PinOff, Trash2, Library, Sparkles, RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Shared/Modal';
import DeleteConfirmation from '../components/Shared/DeleteConfirmation';
import LoadingScreen from '../components/Shared/LoadingScreen';
import { cache } from '../utils/cache';

const Dashboard = () => {
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState([]);
    const [todayTasks, setTodayTasks] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);

    const [syncingIds, setSyncingIds] = useState(new Set());
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, playlistId: null, playlistTitle: '' });
    const [syncResultModal, setSyncResultModal] = useState({ isOpen: false, message: '' });

    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            if (user) {
                const cachedDashboard = cache.get('dashboard_data');
                if (cachedDashboard) {
                    const pinnedItems = cachedDashboard.playlists.filter(item => item.isPinned);
                    setPlaylists(pinnedItems);
                    setTodayTasks(cachedDashboard.today);
                    setAnalytics(cachedDashboard.analytics);
                    setDataLoading(false);
                }

                const [playlistsRes, todayRes, analyticsRes] = await Promise.all([
                    api.get('/playlists/library'),
                    api.get('/schedules/today'),
                    api.get('/schedules/analytics')
                ]);

                const pinnedItems = playlistsRes.data.filter(item => item.isPinned);

                setPlaylists(pinnedItems);
                setTodayTasks(todayRes.data);
                setAnalytics(analyticsRes.data);

                cache.set('dashboard_data', {
                    playlists: playlistsRes.data,
                    today: todayRes.data,
                    analytics: analyticsRes.data
                });

            } else {
                const localPlaylists = JSON.parse(localStorage.getItem('guestPlaylists') || '[]');
                setPlaylists(localPlaylists);
                setTodayTasks([]);
                setAnalytics(null);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setDataLoading(false);
        }
    };

    const handleTogglePin = async (item) => {
        try {
            if (item.type === 'video') {
                await api.put(`/videos/${item.dbId || item._id}/pin`);
            } else {
                await api.put(`/playlists/${item._id}/pin`);
            }
            cache.invalidate('dashboard_data');
            // Optimistic update
            setPlaylists(prev => {
                if (item.isPinned) {
                    return prev.filter(p => p._id !== item._id);
                } else {
                    return [...prev, { ...item, isPinned: true }];
                }
            });
            fetchData();
        } catch (err) {
            console.error('Error toggling pin:', err);
        }
    };

    const handleSyncPlaylist = async (playlistId) => {
        setSyncingIds(prev => new Set(prev).add(playlistId));
        try {
            const res = await api.put(`/playlists/${playlistId}/sync`);
            setSyncResultModal({
                isOpen: true,
                message: res.data.msg + (res.data.added ? `: Added ${res.data.added} new videos.` : '. Playlist is up to date.')
            });
            fetchData();
        } catch (err) {
            console.error('Sync failed:', err);
            setSyncResultModal({ isOpen: true, message: 'Failed to sync playlist.' });
        } finally {
            setSyncingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(playlistId);
                return newSet;
            });
        }
    };

    const confirmDeletePlaylist = async () => {
        if (!deleteModal.playlistId) return;
        try {
            await api.delete(`/playlists/${deleteModal.playlistId}`);
            setDeleteModal({ isOpen: false, playlistId: null, playlistTitle: '' });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const pendingToday = todayTasks.filter(t => t.status !== 'completed');
    const completedTodayCount = todayTasks.filter(t => t.status === 'completed').length;
    const progressPercent = todayTasks.length > 0 ? (completedTodayCount / todayTasks.length) * 100 : 0;
    const firstPendingTask = pendingToday[0];

    if (dataLoading) return <LoadingScreen message="Curating your dashboard..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '3.5rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                    {!user && (
                        <div className="glass" style={{
                            marginBottom: '1rem',
                            padding: '1.25rem 2rem',
                            borderRadius: '24px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--primary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Sparkles size={20} color="var(--primary)" />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>You're in Guest Mode</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your progress is saved locally. Sign up to sync across devices!</p>
                                </div>
                            </div>
                            <Link to="/signup" className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
                                Create Account
                            </Link>
                        </div>
                    )}

                    {/* Focal Header */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h1 style={{ fontSize: '3rem', fontWeight: '950', letterSpacing: '-2px', lineHeight: 1, color: 'var(--text-main)' }}>Focus</h1>
                                {user && analytics?.streak > 0 && (
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1rem' }}>🔥</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.9rem' }}>{analytics.streak} Days</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>Your learning velocity today.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '3.5rem', alignItems: 'start' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            {/* Continue Watching / Dynamic top section */}
                            {firstPendingTask && (
                                <section>
                                    <div className="glass" style={{ padding: '2rem', borderRadius: '28px', border: '1px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                                                <Play size={20} color="white" fill="white" />
                                            </div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)' }}>Continue Watching</h2>
                                        </div>
                                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    Next Up Today
                                                </p>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.4 }}>
                                                    {firstPendingTask.videoId?.title || 'Unknown Video'}
                                                </h3>
                                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                        <Clock size={16} /> {firstPendingTask.videoId?.duration || '00:00'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/focus/${firstPendingTask._id}`)}
                                                    className="btn-primary"
                                                    style={{ display: 'inline-flex', padding: '0.8rem 2rem', fontSize: '1rem' }}
                                                >
                                                    <Play size={18} fill="currentColor" /> Resume Session
                                                </button>
                                            </div>
                                            {firstPendingTask.videoId?.thumbnail && (
                                                <div style={{ width: '200px', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                                                    <img src={firstPendingTask.videoId.thumbnail} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Active Library - Made it a Horizontal slider container */}
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Library size={18} color="var(--primary)" />
                                    </div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>Active Library</h2>
                                </div>
                                {playlists.length === 0 ? (
                                    <div className="glass" style={{
                                        padding: '4rem 2rem',
                                        borderRadius: '40px',
                                        textAlign: 'center',
                                        background: 'rgba(255,255,255,0.01)',
                                        border: '1px dashed var(--glass-border)'
                                    }}>
                                        <div style={{ width: '56px', height: '56px', background: 'rgba(99,102,241,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                            <Pin size={24} color="var(--text-muted)" />
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Your Focus List is Empty</h3>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto 2rem' }}>
                                            Your most important playlists appear here. Head to the library to pin your current study goals!
                                        </p>
                                        <Link to="/library" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Visit Library <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                        gap: '1.5rem',
                                        paddingBottom: '1.5rem',
                                    }}>
                                        {playlists.map(item => {
                                            const isPlaylist = item.type === 'playlist';
                                            const realId = isPlaylist ? item._id : item.dbId;
                                            const thImg = item.thumbnail;
                                            const urlParam = isPlaylist ? `/playlist/${item._id}` : `/video/${item.dbId}`;

                                            return (
                                                <div key={`dash-${realId}`} className="playlist-card glass" style={{ borderRadius: '24px', overflow: 'hidden', background: 'var(--bg-card)', border: item.isPinned ? '1px solid var(--primary)' : '1px solid var(--glass-border)', position: 'relative', transition: 'all 0.3s ease' }}>
                                                    <Link
                                                        to={urlParam}
                                                        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                                                    >
                                                        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                                                            <img src={thImg || 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'}
                                                                alt={item.title || item.playlistTitle}
                                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'opacity 0.3s' }}
                                                                onMouseOver={e => e.currentTarget.style.opacity = 1}
                                                                onMouseOut={e => e.currentTarget.style.opacity = 0.8}
                                                            />
                                                            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                                                <button onClick={(e) => { e.preventDefault(); handleTogglePin(item); }} className="icon-btn-deck" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s' }} title="Unpin">
                                                                    <PinOff size={16} color="white" />
                                                                </button>
                                                            </div>
                                                            {item.type === 'video' ? (
                                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '0.6rem' }}>
                                                                    <Play size={28} fill="white" color="white" />
                                                                </div>
                                                            ) : item.progress && (
                                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
                                                                    <div style={{ height: '100%', background: 'var(--primary)', width: `${Math.min(100, Math.round((item.progress.completed / item.progress.total) * 100))}%` }}></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ padding: '1.25rem' }}>
                                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                                {item.title || item.playlistTitle}
                                                            </h3>
                                                            {item.type === 'playlist' && item.progress && (
                                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                                    {item.progress.completed} / {item.progress.total} Videos Complete
                                                                </p>
                                                            )}
                                                            {item.type !== 'playlist' && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Single Video</p>}
                                                        </div>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Sidebar */}
                        <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Today's Agenda - Cleaned layout */}
                            <div className="glass" style={{ padding: '2rem', borderRadius: '28px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ListChecks size={20} color="var(--accent)" />
                                        </div>
                                        <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)' }}>Daily Agenda</h2>
                                    </div>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                                            <circle cx="25" cy="25" r="22" fill="none" stroke="var(--glass-border)" strokeWidth="4" />
                                            <circle cx="25" cy="25" r="22" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray={`${Math.PI * 44}`} strokeDashoffset={`${Math.PI * 44 * (1 - progressPercent / 100)}`} style={{ transition: 'stroke-dashoffset 1s ease' }} strokeLinecap="round" />
                                        </svg>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{Math.round(progressPercent)}%</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
                                    {completedTodayCount} / {todayTasks.length} Done Today
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {todayTasks.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                            <Check size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                                            <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>All caught up!</p>
                                            <p style={{ fontSize: '0.9rem' }}>No sessions scheduled for today.</p>
                                        </div>
                                    ) : (
                                        todayTasks.map((t) => (
                                            <div key={t._id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '1rem', background: t.status === 'completed' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)',
                                                borderRadius: '16px', border: t.status === 'completed' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                                transition: 'all 0.2s', opacity: t.status === 'completed' ? 0.7 : 1
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                                                    <button
                                                        onClick={() => navigate(`/focus/${t._id}`)}
                                                        className="icon-btn-deck"
                                                        style={{ width: '40px', height: '40px', borderRadius: '10px', background: t.status === 'completed' ? '#22c55e' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        {t.status === 'completed' ? <Check size={20} /> : <Play size={20} fill="currentColor" />}
                                                    </button>
                                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        <p style={{ fontWeight: '700', fontSize: '0.95rem', color: t.status === 'completed' ? '#22c55e' : 'white', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {t.videoId?.title || 'Unknown Video'}
                                                        </p>
                                                        <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={12} /> {t.videoId?.duration || '00:00'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </aside>

                    </div>
                </div>
            </div>

            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, playlistId: null, playlistTitle: '' })}>
                <DeleteConfirmation
                    title={`Remove ${deleteModal.isVideo ? 'Video' : 'Playlist'}`}
                    itemName={deleteModal.playlistTitle}
                    onConfirm={confirmDeletePlaylist}
                    onCancel={() => setDeleteModal({ isOpen: false, playlistId: null, playlistTitle: '' })}
                />
            </Modal>

            <Modal isOpen={syncResultModal.isOpen} onClose={() => setSyncResultModal({ isOpen: false, message: '' })}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Check size={24} color="#22c55e" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Sync Complete</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{syncResultModal.message}</p>
                    <button onClick={() => setSyncResultModal({ isOpen: false, message: '' })} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Done
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;
