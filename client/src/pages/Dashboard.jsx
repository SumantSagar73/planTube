import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Check, Users, X, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Shared/Modal';
import DeleteConfirmation from '../components/Shared/DeleteConfirmation';
import LoadingScreen from '../components/Shared/LoadingScreen';
import { cache } from '../utils/cache';
import FocusPulseHeatmap from '../components/Shared/FocusPulseHeatmap';
import GuestBanner from '../components/Dashboard/GuestBanner';
import ContinueWatching from '../components/Dashboard/ContinueWatching';
import ActiveLibrary from '../components/Dashboard/ActiveLibrary';
import DailyAgenda from '../components/Dashboard/DailyAgenda';
import WeeklyGoalWidget from '../components/Dashboard/WeeklyGoalWidget';
import DueForReviewWidget from '../components/Dashboard/DueForReviewWidget';

import StreakIcon from '../components/Shared/StreakIcon';
import AdSense from '../components/Shared/AdSense';
import useFeatureFlags from '../hooks/useFeatureFlags';


// ── Join Watch Party widget (dashboard header) ────────────────────────────────
const JoinWatchPartyWidget = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-preview when 6 chars entered
    useEffect(() => {
        const c = code.trim().toUpperCase();
        if (c.length < 6) { setPreview(null); setError(''); return; }
        setLoading(true); setError('');
        const controller = new AbortController();
        api.get(`/watchparty/${c}`, { signal: controller.signal })
            .then(r => { setPreview(r.data); setError(''); })
            .catch(err => { if (err.name !== 'CanceledError' && err.name !== 'AbortError') { setPreview(null); setError('Room not found.'); } })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [code]);

    const join = () => {
        if (!preview) return;
        setOpen(false);
        setCode('');
        setPreview(null);
        navigate(`/focus/${preview.videoId}?party=${code.trim().toUpperCase()}`);
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-muted)', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', transition: 'border-color 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
                <Users size={15} /> Join Watch Party
            </button>

            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 999, width: '280px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>Join a Watch Party</span>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
                    </div>
                    <input
                        autoFocus
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        placeholder="Enter room code (e.g. AB3X9K)"
                        maxLength={8}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', padding: '8px 12px', fontSize: '0.9rem', fontFamily: 'monospace', letterSpacing: '0.12em', marginBottom: '0.6rem' }}
                    />
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                            <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Looking up room…
                        </div>
                    )}
                    {preview && !loading && (
                        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '0.65rem', marginBottom: '0.6rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                            {preview.thumbnail && <img src={preview.thumbnail} alt="" style={{ width: '52px', height: '30px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{preview.videoTitle || 'Watch Party'}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--primary)', marginTop: '2px' }}>{preview.memberCount} watching</div>
                            </div>
                        </div>
                    )}
                    {error && <p style={{ color: 'var(--error, #f87171)', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>{error}</p>}
                    <button onClick={join} disabled={!preview} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: preview ? 1 : 0.4 }}>
                        Go &amp; Join →
                    </button>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}
        </div>
    );
};

const Dashboard = () => {
    const { isEnabled } = useFeatureFlags();
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState([]);
    const [todayTasks, setTodayTasks] = useState([]);
    const [resumeSchedule, setResumeSchedule] = useState(null);
    const [resumeSchedules, setResumeSchedules] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
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
                const cacheKey = `dashboard_data_${user._id || user.id}`;
                const cachedDashboard = cache.get(cacheKey);
                if (cachedDashboard) {
                    const pinnedItems = cachedDashboard.playlists.filter(item => item.isPinned);
                    setPlaylists(pinnedItems);
                    setTodayTasks(cachedDashboard.today);
                    setResumeSchedule(cachedDashboard.resumeSchedule || null);
                    setResumeSchedules(cachedDashboard.resumeSchedules || (cachedDashboard.resumeSchedule ? [cachedDashboard.resumeSchedule] : []));
                    setAnalytics(cachedDashboard.analytics);
                    setHeatmapData(cachedDashboard.heatmapData || []);
                    setDataLoading(false);
                }

                const [playlistsRes, todayRes, resumeRes, analyticsRes, heatmapRes] = await Promise.all([
                    api.get('/playlists/library'),
                    api.get('/schedules/today'),
                    api.get('/schedules/resume'),
                    api.get('/schedules/analytics'),
                    api.get('/analytics/heatmap')
                ]);

                const pinnedItems = playlistsRes.data.filter(item => item.isPinned);

                setPlaylists(pinnedItems);
                setTodayTasks(todayRes.data);
                const resumeItems = Array.isArray(resumeRes.data) ? resumeRes.data : (resumeRes.data ? [resumeRes.data] : []);
                setResumeSchedules(resumeItems);
                setResumeSchedule(resumeItems[0] || null);
                setAnalytics(analyticsRes.data);
                setHeatmapData(heatmapRes.data);
                
                cache.set(cacheKey, {
                    playlists: playlistsRes.data,
                    today: todayRes.data,
                    resumeSchedule: resumeItems[0] || null,
                    resumeSchedules: resumeItems,
                    analytics: analyticsRes.data,
                    heatmapData: heatmapRes.data
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
            // Both playlists and standalone videos in the library are pinned via their UserPlaylist link.
            // item.dbId contains the Playlist document ID (p._id) for both types.
            await api.put(`/playlists/${item.dbId || item._id}/pin`);
            
            cache.invalidate(`dashboard_data_${user._id || user.id}`);
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
        <div className="dashboard-shell" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '5rem' }}>
            <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '3.5rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {!user && <GuestBanner />}

                    {/* Focal Header */}
                    <div className="dashboard-hero" data-section="overview-cards" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <h1 className="dashboard-title" style={{ fontSize: '3rem', fontWeight: '950', letterSpacing: '-2px', lineHeight: 1, color: 'var(--text-main)' }}>Focus</h1>
                                {user && analytics?.streak > 0 && (
                                    <div className="dashboard-streak" data-section="streak" style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <StreakIcon size={24} />
                                        <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.9rem' }}>{analytics.streak} Days</span>
                                    </div>
                                )}
                            </div>
                            {user && <JoinWatchPartyWidget />}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>Your learning velocity today.</p>
                    </div>

                    <div className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '3.5rem', alignItems: 'start' }}>

                        <div className="dashboard-primary-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="dashboard-continue">
                                <ContinueWatching firstPendingTask={firstPendingTask} resumeSchedule={resumeSchedule} resumeSchedules={resumeSchedules} navigate={navigate} />
                            </div>

                            <div className="dashboard-library">
                                <ActiveLibrary playlists={playlists} handleTogglePin={handleTogglePin} />
                            </div>
                        </div>

                        <div className="dashboard-sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="dashboard-agenda">
                                <DailyAgenda
                                    todayTasks={todayTasks}
                                    completedTodayCount={completedTodayCount}
                                    progressPercent={progressPercent}
                                    navigate={navigate}
                                />
                            </div>

                            {user && <WeeklyGoalWidget />}

                            {user && <DueForReviewWidget />}

                            {user && isEnabled('feat_heatmap') && (
                                <div className="dashboard-tracker" data-section="heatmap">
                                    <FocusPulseHeatmap
                                        data={heatmapData}
                                        streak={analytics?.streak || 0}
                                    />
                                </div>
                            )}

                            {/* Advertisement placement in sidebar */}
                            <AdSense 
                                adSlot="" // User needs to provide a slot ID for manual ads
                                style={{ marginTop: '2rem' }} 
                            />
                        </div>


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
