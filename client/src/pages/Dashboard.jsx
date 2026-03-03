import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Plus, Play, CheckCircle, Clock,
    Youtube, Flame, ChevronRight, Target, Calendar as CalendarIcon,
    ChevronLeft, Pin, PinOff, Trash2, RefreshCw,
    ChevronRight as ChevronRightIcon, Library
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Shared/Modal';
import DeleteConfirmation from '../components/Shared/DeleteConfirmation';
import LoadingScreen from '../components/Shared/LoadingScreen';
import { cache } from '../utils/cache';

const FocusPulseHeatmap = ({ data, streak }) => {
    const [viewDate, setViewDate] = useState(new Date());

    // Map heatmap data to a quickly accessible object { 'YYYY-MM-DD': seconds }
    const activityMap = (data || []).reduce((acc, curr) => {
        acc[curr.date] = curr.seconds;
        return acc;
    }, {});

    const getDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= lastDate; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const getIntensity = (seconds) => {
        if (!seconds) return 0;
        if (seconds < 600) return 1; // < 10 mins
        if (seconds < 1800) return 2; // < 30 mins
        if (seconds < 3600) return 3; // < 1 hour
        return 4; // > 1 hour
    };

    const COLORS = [
        'rgba(255,255,255,0.03)', // 0: None
        'rgba(99, 102, 241, 0.2)', // 1: Low
        'rgba(99, 102, 241, 0.4)', // 2: Mid
        'rgba(99, 102, 241, 0.7)', // 3: High
        'var(--primary)',         // 4: Max
    ];

    return (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '28px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flame size={20} fill="#f59e0b" color="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Study Streak</p>
                        <h4 style={{ fontSize: '1rem', fontWeight: '900', color: '#f59e0b' }}>{streak} Days</h4>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'white' }}>
                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                        <button onClick={() => changeMonth(-1)} className="icon-btn-deck" style={{ padding: '0.4rem' }}><ChevronLeft size={16} /></button>
                        <button onClick={() => changeMonth(1)} className="icon-btn-deck" style={{ padding: '0.4rem' }}><ChevronRightIcon size={16} /></button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginBottom: '4px' }}>{d}</span>
                ))}
                {getDays().map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} />;

                    const dateStr = date.toISOString().split('T')[0];
                    const seconds = activityMap[dateStr] || 0;
                    const intensity = getIntensity(seconds);

                    return (
                        <div key={i}
                            title={seconds > 0 ? `${Math.round(seconds / 60)} mins on ${dateStr}` : `No activity on ${dateStr}`}
                            style={{
                                aspectRatio: '1/1', borderRadius: '6px',
                                background: COLORS[intensity],
                                border: intensity > 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.02)',
                                transition: 'all 0.2s',
                                cursor: seconds > 0 ? 'pointer' : 'default',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (intensity > 0) e.currentTarget.style.transform = 'scale(1.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        />
                    );
                })}
            </div>

            <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Focus Intensity</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginRight: '4px' }}>Less</span>
                    {COLORS.map((c, i) => (
                        <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} />
                    ))}
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '4px' }}>More</span>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [playlists, setPlaylists] = useState([]);
    const [todayTasks, setTodayTasks] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [stats, setStats] = useState({ totalFocusHours: 0, completedVideos: 0, totalPlaylists: 0 });
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState('');

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
                // Check Cache first
                const cachedDashboard = cache.get('dashboard_data');
                if (cachedDashboard) {
                    const pinnedItems = cachedDashboard.playlists.filter(item => item.isPinned);
                    setPlaylists(pinnedItems);
                    setTodayTasks(cachedDashboard.today);
                    setAnalytics(cachedDashboard.analytics);
                    setDataLoading(false);
                    // Continue to fetch in background to update cache?
                    // For "fast performance" asked by user, we trust cache or fetch quietly.
                    // But if we want updates, we should fetch in background.
                    // However, Dashboard is high traffic. Let's do Background Refresh.
                }

                const [playlistsRes, todayRes, analyticsRes, heatmapRes, statsRes] = await Promise.all([
                    api.get('/playlists/library'),
                    api.get('/schedules/today'),
                    api.get('/schedules/analytics'),
                    api.get('/analytics/heatmap'),
                    api.get('/analytics/stats')
                ]);

                // Filter for Pinned Items (Playlists & Videos)
                const pinnedItems = playlistsRes.data.filter(item => item.isPinned);

                // Only update state if different or if we didn't have cache
                // But simplifying: just set it. React handles Diffing.
                setPlaylists(pinnedItems);
                setTodayTasks(todayRes.data);
                setAnalytics(analyticsRes.data);
                setHeatmapData(heatmapRes.data);
                setStats(statsRes.data);

                // Update Cache
                cache.set('dashboard_data', {
                    playlists: playlistsRes.data,
                    today: todayRes.data,
                    analytics: analyticsRes.data,
                    heatmap: heatmapRes.data,
                    stats: statsRes.data
                });

            } else {
                // Guest mode: fetch from localStorage
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

    const handleImport = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/playlists/import', { playlistUrl });
            const imported = res.data.playlist;

            if (!user) {
                // Save to localStorage in guest mode
                const localPlaylists = JSON.parse(localStorage.getItem('guestPlaylists') || '[]');
                if (!localPlaylists.find(p => p.playlistId === imported.playlistId)) {
                    localPlaylists.push(imported);
                    localStorage.setItem('guestPlaylists', JSON.stringify(localPlaylists));
                }
            }

            setPlaylistUrl('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to import.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async (scheduleId) => {
        try {
            await api.put(`/schedules/${scheduleId}`, { status: 'completed' });
            fetchData();
        } catch (err) {
            console.error('Error updating status:', err);
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
            // Optimistic update for immediate feedback
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
            // Invalidate/Simple Refresh
            // We just ran fetchData() in try block, which updates cache.
            // But verify confirmDeletePlaylist and handleImport calls
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

    if (dataLoading) return <LoadingScreen message="Curating your library..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '5rem' }}>


            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '3.5rem', alignItems: 'start' }}>

                {/* Main Content (Left): Library */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                    {!user && (
                        <div className="glass" style={{
                            marginBottom: '2rem',
                            padding: '1.25rem 2rem',
                            borderRadius: '24px',
                            background: 'linear-gradient(90deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.1) 100%)',
                            border: '1px solid var(--glass-border)',
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
                            <h1 style={{ fontSize: '3rem', fontWeight: '950', letterSpacing: '-2px', lineHeight: 1, color: 'white' }}>Pulse</h1>
                            {user && pendingToday.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 12px var(--primary)' }}></div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)' }}>{pendingToday.length} Session{pendingToday.length > 1 ? 's' : ''} Pending</span>
                                </div>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>Your learning velocity this week.</p>
                    </div>

                    {/* Stats Overview */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        {[
                            { label: 'Focus Hours', value: stats.totalFocusHours, icon: Clock, color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.1)' },
                            { label: 'Videos Done', value: stats.completedVideos, icon: CheckCircle, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
                            { label: 'Active Goals', value: stats.totalPlaylists, icon: Target, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                        ].map((s, i) => (
                            <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <s.icon size={24} color={s.color} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{s.label}</p>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>{s.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <Youtube size={24} style={{ color: 'var(--primary)' }} />
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Active Library</h2>
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
                                    <Library size={24} color="var(--text-muted)" />
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                                {playlists.map(item => (
                                    <div key={item._id} className="glass-hover" style={{ borderRadius: '32px', overflow: 'hidden', background: 'var(--bg-card)', border: item.isPinned ? '1px solid var(--primary)' : '1px solid var(--glass-border)', position: 'relative', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = item.isPinned ? 'var(--primary)' : 'var(--glass-border)'}>
                                        <Link
                                            to={item.type === 'video' ? `/focus/${item._id}` : `/playlist/${item._id}`}
                                            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                <img src={item.thumbnail} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                                                {item.isPinned && (
                                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--primary)', padding: '0.4rem', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                                        <Pin size={14} fill="white" color="white" />
                                                    </div>
                                                )}
                                                {item.type === 'video' && (
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '0.6rem' }}>
                                                        <Play size={28} fill="white" color="white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '1.75rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', lineHeight: '1.3', minHeight: '2.8rem' }}>{item.title || item.playlistTitle}</h3>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                        {item.type === 'video' ? 'Single Video' : 'Curriculum'}
                                                    </span>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {item.type === 'video' ? <Play size={16} /> : <ChevronRight size={20} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleTogglePin(item);
                                                }}
                                                style={{
                                                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '12px',
                                                    padding: '0.5rem', cursor: 'pointer', color: 'white',
                                                    backdropFilter: 'blur(4px)', display: 'flex'
                                                }}
                                                title={item.isPinned ? "Unpin" : "Pin"}
                                            >
                                                {item.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                            </button>

                                            {item.type !== 'video' && item.playlistId !== 'SINGLES' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleSyncPlaylist(item._id);
                                                    }}
                                                    style={{
                                                        background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '12px',
                                                        padding: '0.5rem', cursor: 'pointer', color: 'white',
                                                        backdropFilter: 'blur(4px)', display: 'flex'
                                                    }}
                                                    title="Sync with YouTube"
                                                >
                                                    <RefreshCw size={16} className={syncingIds.has(item._id) ? "spin" : ""} />
                                                </button>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (item.type === 'video') {
                                                        // Maybe implement video delete later, for now just unpin or hide
                                                        // Actually, we can assume this is delete from dashboard only (unpin really)
                                                        // But let's keep delete functionality if needed
                                                        // For now, let's just allow unpinning as the main action
                                                        alert("To remove a video, unpin it or delete it from Library.");
                                                    } else {
                                                        setDeleteModal({ isOpen: true, playlistId: item._id, playlistTitle: item.title });
                                                    }
                                                }}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.8)', border: 'none', borderRadius: '12px',
                                                    padding: '0.5rem', cursor: 'pointer', color: 'white',
                                                    backdropFilter: 'blur(4px)', display: 'flex'
                                                }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar (Right): Agenda & Tracker */}
                <aside style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Today's Agenda (Back to Sidebar) - Only for Logged In */}
                    {user && (
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '28px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Target size={18} style={{ color: 'var(--primary)' }} /> Daily Agenda
                                </h3>
                                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--primary)', padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.1)', borderRadius: '8px' }}>
                                    {pendingToday.length}
                                </span>
                            </div>

                            {todayTasks.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No tasks for today.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {todayTasks.map(task => {
                                        const isComp = task.status === 'completed';
                                        return (
                                            <div key={task._id} style={{
                                                padding: '1rem', borderRadius: '20px', background: isComp ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.03)',
                                                border: isComp ? '1px solid rgba(34,197,94,0.1)' : '1px solid var(--glass-border)',
                                                display: 'flex', gap: '0.85rem', alignItems: 'center', opacity: isComp ? 0.6 : 1,
                                                transition: 'all 0.3s'
                                            }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isComp ? '#16a34a' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: '900', flexShrink: 0 }}>
                                                    {isComp ? <CheckCircle size={16} /> : (task.videoId?.position + 1)}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isComp ? 'var(--text-muted)' : 'inherit' }}>{task.videoId?.title}</p>
                                                    {!isComp ? (
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                            <a href={`https://www.youtube.com/watch?v=${task.videoId?.videoId}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Watch</a>
                                                            <button onClick={() => handleMarkComplete(task._id)} className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Done</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await api.put(`/schedules/${task._id}`, { status: 'pending' });
                                                                        fetchData();
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                    }
                                                                }}
                                                                style={{
                                                                    background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-muted)',
                                                                    padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem',
                                                                    cursor: 'pointer', fontWeight: '600'
                                                                }}
                                                            >
                                                                Undo
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Import Launcher */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '28px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem' }}>Quick Import</h3>
                        <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input className="input-glass" placeholder="Link to video/playlist..." value={playlistUrl} onChange={(e) => setPlaylistUrl(e.target.value)} style={{ fontSize: '0.8rem' }} />
                            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.65rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800' }}>
                                {loading ? 'Importing...' : 'Add to Focus'}
                            </button>
                        </form>
                    </div>

                    {/* Enhanced Tracker - Only for Logged In */}
                    {user && (
                        <FocusPulseHeatmap
                            data={heatmapData}
                            streak={analytics?.streak || 0}
                        />
                    )}
                </aside>
            </div>

            <Modal
                isOpen={syncResultModal.isOpen}
                onClose={() => setSyncResultModal(prev => ({ ...prev, isOpen: false }))}
                title="Sync Complete"
            >
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{
                        width: '50px', height: '50px', background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '50%', color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <RefreshCw size={24} />
                    </div>
                    <p style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.5rem' }}>{syncResultModal.message}</p>
                    <button
                        onClick={() => setSyncResultModal(prev => ({ ...prev, isOpen: false }))}
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        Awesome
                    </button>
                </div>
            </Modal>

            <DeleteConfirmation
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, playlistId: null, playlistTitle: '' })}
                onConfirm={confirmDeletePlaylist}
                playlistTitle={deleteModal.playlistTitle}
            />
        </div>

    );
};

export default Dashboard;
