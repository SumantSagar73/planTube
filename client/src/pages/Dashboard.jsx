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

const MiniCalendar = ({ history, streak }) => {
    const [viewDate, setViewDate] = useState(new Date());

    // Convert history (raw ISO strings) to local YYYY-MM-DD set
    const completionSet = new Set((history || []).map(dateStr => {
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }));

    // Get today's local YYYY-MM-DD
    const todayObj = new Date();
    const tY = todayObj.getFullYear();
    const tM = String(todayObj.getMonth() + 1).padStart(2, '0');
    const tD = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${tY}-${tM}-${tD}`;

    const isTodayDone = completionSet.has(todayStr);

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

    return (
        <div className="glass" style={{ padding: '1rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Flame
                        size={16}
                        fill={streak > 0 ? "#f59e0b" : "none"}
                        color={streak > 0 ? "#f59e0b" : "var(--text-muted)"}
                        style={{ filter: streak > 0 ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.4))' : 'none', transition: 'all 0.3s' }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: streak > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{streak} Day Streak</span>
                </div>
                <div style={{ display: 'flex', gap: '0.1rem' }}>
                    <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}><ChevronLeft size={14} /></button>
                    <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}><ChevronRightIcon size={14} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                {['s', 'm', 't', 'w', 'th', 'f', 'sa'].map((d, i) => (
                    <span key={i} style={{ fontSize: '0.55rem', fontWeight: '800', color: 'rgba(255,255,255,0.1)', marginBottom: '2px' }}>{d}</span>
                ))}
                {getDays().map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} />;

                    // Format current cell date to YYYY-MM-DD
                    // IMPORTANT: use local parts to avoid timezone shift when creating string from date obj
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;

                    const isCompleted = completionSet.has(dateStr);

                    return (
                        <div key={i} style={{
                            aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: '700', borderRadius: '6px',
                            background: isCompleted ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                            color: isCompleted ? '#f59e0b' : 'var(--text-muted)',
                            position: 'relative',
                            border: isCompleted ? '1px solid rgba(245, 158, 11, 0.2)' : 'none'
                        }}>
                            {date.getDate()}
                            {isCompleted && (
                                <div style={{ position: 'absolute', bottom: '2px', display: 'flex', justifyContent: 'center', width: '100%' }}>
                                    <Flame size={8} fill="#f59e0b" color="#f59e0b" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [playlists, setPlaylists] = useState([]);
    const [todayTasks, setTodayTasks] = useState([]);
    const [analytics, setAnalytics] = useState(null);
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
                const [playlistsRes, todayRes, analyticsRes] = await Promise.all([
                    api.get('/playlists/library'), // Use Unified Library to include Pinned Videos
                    api.get('/schedules/today'),
                    api.get('/schedules/analytics')
                ]);

                // Filter for Pinned Items (Playlists & Videos)
                // Filter out 'imported' type if it isn't pinned, but actually we want all pinned items
                // getLibraryStats sorts by pinned, but returns all.
                const pinnedItems = playlistsRes.data.filter(item => item.isPinned);
                setPlaylists(pinnedItems);

                setTodayTasks(todayRes.data);
                setAnalytics(analyticsRes.data);
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

    if (dataLoading) return <LoadingScreen message="Curating your library..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '5rem' }}>


            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '3.5rem', alignItems: 'start' }}>

                {/* Main Content (Left): Library */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                    {!user && (
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.05)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            padding: '1rem 1.5rem',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '-1rem'
                        }}>
                            <div style={{ pading: '0.5rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)' }}>
                                <Library size={20} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white', marginBottom: '0.1rem' }}>Guest Mode Active</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Playlists are stored locally in your browser. <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign in</Link> to sync across devices.</p>
                            </div>
                        </div>
                    )}

                    {/* Focal Header */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <h1 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: 1 }}>Focus</h1>
                            {user && pendingToday.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.35rem 0.85rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary)' }}>{pendingToday.length} Pending</span>
                                </div>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '500' }}>Your path to mastery starts here.</p>
                    </div>

                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <Youtube size={24} style={{ color: 'var(--primary)' }} />
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Active Library</h2>
                        </div>
                        {playlists.length === 0 ? (
                            <div className="glass" style={{ padding: '5rem', textAlign: 'center', borderRadius: '40px', border: '1px dashed var(--glass-border)', background: 'transparent' }}>
                                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>No pinned playlists in Focus.</p>
                                <Link to="/library" className="btn-primary" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', textDecoration: 'none' }}>
                                    Go to Library
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
                        <MiniCalendar
                            history={analytics?.completionHistory}
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
