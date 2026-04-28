import { useState, useEffect } from 'react';
import api from '../services/api';
import { Check } from 'lucide-react';
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

import StreakIcon from '../components/Shared/StreakIcon';
import AdSense from '../components/Shared/AdSense';


const Dashboard = () => {
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
            if (item.type === 'video') {
                await api.put(`/videos/${item.dbId || item._id}/pin`);
            } else {
                await api.put(`/playlists/${item._id}/pin`);
            }
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
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>Your learning velocity today.</p>
                    </div>

                    <div className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '3.5rem', alignItems: 'start' }}>

                        <div className="dashboard-primary-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="dashboard-continue" data-section="schedule">
                                <ContinueWatching firstPendingTask={firstPendingTask} resumeSchedule={resumeSchedule} resumeSchedules={resumeSchedules} navigate={navigate} />
                            </div>

                            <div className="dashboard-library" data-section="playlist-grid">
                                <ActiveLibrary playlists={playlists} handleTogglePin={handleTogglePin} />
                            </div>
                        </div>

                        <div className="dashboard-sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="dashboard-agenda" data-section="recent-activity">
                                <DailyAgenda
                                    todayTasks={todayTasks}
                                    completedTodayCount={completedTodayCount}
                                    progressPercent={progressPercent}
                                    navigate={navigate}
                                />
                            </div>

                            {user && (
                                <div className="dashboard-tracker" data-section="streak">
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
