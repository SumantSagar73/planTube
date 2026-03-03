import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Clock, Calendar, Award, AlertCircle,
    Flame, BarChart3, TrendingUp, Play, CheckCircle, User, Edit2, Save, X, Lock, Trash2, Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/Shared/LoadingScreen';
import FocusPulseHeatmap from '../components/Shared/FocusPulseHeatmap';
import Modal from '../components/Shared/Modal';

const Profile = () => {
    const { user: authUser, logout, setAuth } = useAuth();
    const [profile, setProfile] = useState({ name: '', username: '', email: '' });
    const [analytics, setAnalytics] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [stats, setStats] = useState({ totalFocusHours: 0, completedVideos: 0, totalPlaylists: 0 });

    const [schedules, setSchedules] = useState({
        upcoming: [],
        missed: [],
        completed: []
    });

    const [preferences, setPreferences] = useState({
        dailyStudyTime: { start: '18:00', end: '20:00' },
        videosPerDay: 3,
        maxWatchTimePerDay: 120
    });

    const [activeTab, setActiveTab] = useState('completed');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [prefMessage, setPrefMessage] = useState({ text: '', type: '' });

    // Account section states
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
    const [deleteModal, setDeleteModal] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [analyticsRes, upcomingRes, missedRes, completedRes, prefsRes, heatmapRes, statsRes] = await Promise.all([
                api.get('/schedules/analytics'),
                api.get('/schedules/upcoming'),
                api.get('/schedules/missed'),
                api.get('/schedules/completed'),
                api.get('/users/preferences'),
                api.get('/analytics/heatmap'),
                api.get('/analytics/stats')
            ]);

            setAnalytics(analyticsRes.data);
            setSchedules({
                upcoming: upcomingRes.data,
                missed: missedRes.data,
                completed: completedRes.data
            });

            if (prefsRes.data) {
                setPreferences(prefsRes.data);
            }

            setHeatmapData(heatmapRes.data);
            setStats(statsRes.data);

            if (authUser) {
                setProfile({
                    name: authUser.name || '',
                    username: authUser.username || '',
                    email: authUser.email || ''
                });
            }
        } catch (err) {
            console.error('Error fetching profile data:', err);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (msg, type = 'success', setter = setPrefMessage) => {
        setter({ text: msg, type });
        setTimeout(() => setter({ text: '', type: '' }), 4000);
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await api.put('/users/profile', profile);
            setAuth({ user: res.data });
            showMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Error updating profile', 'error');
        }
    };

    const handleUpdatePreferences = async () => {
        try {
            await api.put('/users/preferences', preferences);
            showMessage('Preferences saved successfully!');
        } catch (err) {
            console.error('Error updating preferences:', err);
            showMessage('Failed to save preferences.', 'error');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMsg({ text: '', type: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return showMessage('New passwords do not match', 'error', setPasswordMsg);
        }

        try {
            await api.put('/users/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            showMessage('Password changed successfully!', 'success', setPasswordMsg);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Failed to change password', 'error', setPasswordMsg);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete('/users/account');
            logout();
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Failed to delete account', 'error');
            setDeleteModal(false);
        }
    };

    const handleReschedule = async (scheduleId) => {
        try {
            // Update to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            await api.put(`/schedules/${scheduleId}`, {
                status: 'pending',
                scheduledDate: tomorrow.toISOString()
            });
            showMessage('Session rescheduled for tomorrow');
            fetchProfileData(); // Reload lists
        } catch (err) {
            showMessage('Failed to reschedule', 'error');
        }
    };

    const renderList = (list, emptyMsg, type) => {
        if (list.length === 0) {
            return (
                <div className="glass" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                    <p>{emptyMsg}</p>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {list.map(s => (
                    <div key={s._id} className="glass" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <img
                            src={s.videoId?.thumbnail}
                            alt=""
                            style={{ width: '120px', aspectRatio: '16/9', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' }}>{s.videoId?.title}</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {s.videoId?.duration}</span>
                                {s.scheduledDate && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Calendar size={14} /> {new Date(s.scheduledDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {type === 'missed' && (
                            <button
                                onClick={() => handleReschedule(s._id)}
                                className="btn-secondary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                            >
                                Reschedule
                            </button>
                        )}

                        {type !== 'completed' && type !== 'missed' && (
                            <a
                                href={`https://www.youtube.com/watch?v=${s.videoId?.videoId}`}
                                target="_blank" rel="noreferrer"
                                className="btn-secondary"
                                style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Play size={16} />
                            </a>
                        )}

                        {type === 'completed' && <CheckCircle size={20} style={{ color: '#22c55e' }} />}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <LoadingScreen message="Loading profile..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '4rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '-1rem' }}>
                <User size={28} className="text-primary" />
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>Your Profile</h1>
            </div>

            {prefMessage.text && (
                <div style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    background: prefMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: prefMessage.type === 'error' ? '#ef4444' : '#22c55e',
                    border: `1px solid ${prefMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                }}>
                    {prefMessage.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem' }}>

                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* User Info Card */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '100px', height: '100px', borderRadius: '24px',
                            background: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', fontWeight: '900', color: 'white',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                        }}>
                            {profile.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input
                                        placeholder="Full Name"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="styled-input"
                                    />
                                    <input
                                        placeholder="Username"
                                        value={profile.username}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                        className="styled-input"
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <button onClick={handleUpdateProfile} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                                            <Save size={16} style={{ marginRight: '6px' }} /> Save
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.2rem' }}>{profile.name}</h2>
                                            <p style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem' }}>@{profile.username}</p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{profile.email}</p>
                                        </div>
                                        <button onClick={() => setIsEditing(true)} className="icon-btn-deck">
                                            <Edit2 size={18} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Unified Learning Stats */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} className="text-primary" /> Learning Stats
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>Focus Hours</p>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>{stats.totalFocusHours}</h4>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>Videos Done</p>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#22c55e' }}>{stats.completedVideos}</h4>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>Active Goals</p>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b' }}>{stats.totalPlaylists}</h4>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>This Week</p>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ec4899' }}>{analytics?.weeklyCompleted || 0}</h4>
                            </div>
                        </div>
                    </div>

                    {/* History Tabs */}
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                            {['completed', 'upcoming', 'missed'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: activeTab === tab ? 'white' : 'var(--text-muted)',
                                        fontWeight: activeTab === tab ? '800' : '600',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        position: 'relative'
                                    }}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <div style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '2px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'completed' && renderList(schedules.completed, "No completed sessions yet. Keep going!", 'completed')}
                        {activeTab === 'upcoming' && renderList(schedules.upcoming, "No upcoming sessions. Set up a new goal!", 'upcoming')}
                        {activeTab === 'missed' && renderList(schedules.missed, "You're all caught up! No missed sessions.", 'missed')}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Heatmap Widget */}
                    <FocusPulseHeatmap data={heatmapData} streak={analytics?.streak || 0} />

                    {/* Study Preferences */}
                    <div className="glass" style={{ padding: '1.75rem', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} className="text-primary" /> Study Defaults
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Daily Start Time</label>
                                <input
                                    type="time"
                                    value={preferences.dailyStudyTime.start}
                                    onChange={(e) => setPreferences({ ...preferences, dailyStudyTime: { ...preferences.dailyStudyTime, start: e.target.value } })}
                                    className="styled-input"
                                    style={{ width: '100%', padding: '0.6rem 1rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Videos per Day</label>
                                <input
                                    type="number"
                                    min="1" max="20"
                                    value={preferences.videosPerDay}
                                    onChange={(e) => setPreferences({ ...preferences, videosPerDay: parseInt(e.target.value) })}
                                    className="styled-input"
                                    style={{ width: '100%', padding: '0.6rem 1rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Max Time/Day (mins)</label>
                                <input
                                    type="number"
                                    min="10" step="10"
                                    value={preferences.maxWatchTimePerDay}
                                    onChange={(e) => setPreferences({ ...preferences, maxWatchTimePerDay: parseInt(e.target.value) })}
                                    className="styled-input"
                                    style={{ width: '100%', padding: '0.6rem 1rem' }}
                                />
                            </div>
                            <button onClick={handleUpdatePreferences} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                                Save Defaults
                            </button>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div className="glass" style={{ padding: '1.75rem', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                            <Lock size={18} /> Security
                        </h3>

                        {passwordMsg.text && (
                            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: passwordMsg.type === 'error' ? '#ef4444' : '#22c55e' }}>
                                {passwordMsg.text}
                            </p>
                        )}

                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="styled-input"
                                required
                            />
                            <input
                                type="password"
                                placeholder="New Password (min 6 chars)"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="styled-input"
                                minLength="6"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="styled-input"
                                minLength="6"
                                required
                            />
                            <button type="submit" className="btn-secondary" style={{ justifyContent: 'center' }}>
                                Change Password
                            </button>
                        </form>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                            <button
                                onClick={() => setDeleteModal(true)}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                            >
                                <Trash2 size={16} style={{ marginRight: '6px' }} /> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <AlertCircle size={28} color="#ef4444" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '1rem', color: 'white' }}>Delete Account?</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
                        This action cannot be undone. All your playlists, progress, and focus metrics will be permanently deleted.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setDeleteModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                            Cancel
                        </button>
                        <button onClick={handleDeleteAccount} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#ef4444', color: 'white' }}>
                            Delete Forever
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Profile;
