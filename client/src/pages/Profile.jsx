import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Clock, Calendar, Award, AlertCircle,
    Flame, BarChart3, TrendingUp, Play, CheckCircle, User, Edit2, Save, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/Shared/LoadingScreen';

const Profile = () => {
    const { user: authUser, setAuth } = useAuth();
    const [profile, setProfile] = useState({ name: '', username: '', email: '' });
    const [analytics, setAnalytics] = useState(null);
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
    const [prefMessage, setPrefMessage] = useState('');

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [analyticsRes, upcomingRes, missedRes, completedRes, prefsRes] = await Promise.all([
                api.get('/schedules/analytics'),
                api.get('/schedules/upcoming'),
                api.get('/schedules/missed'),
                api.get('/schedules/completed'),
                api.get('/users/preferences')
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

            // Sync auth user data to local profile state
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

    const handleUpdateProfile = async () => {
        try {
            const res = await api.put('/users/profile', profile);
            setAuth({ user: res.data });
            setPrefMessage('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setPrefMessage(''), 3000);
        } catch (err) {
            alert(err.response?.data?.msg || 'Error updating profile');
        }
    };

    const handleUpdatePreferences = async () => {
        try {
            await api.put('/users/preferences', preferences);
            setPrefMessage('Preferences saved successfully!');
            setTimeout(() => setPrefMessage(''), 3000);
        } catch (err) {
            console.error('Error updating preferences:', err);
            setPrefMessage('Failed to save preferences.');
        }
    };

    const renderList = (list, emptyMsg) => {
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
                        {activeTab !== 'completed' && (
                            <a
                                href={`https://www.youtube.com/watch?v=${s.videoId?.videoId}`}
                                target="_blank" rel="noreferrer"
                                className="btn-secondary"
                                style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Play size={16} />
                            </a>
                        )}
                        {activeTab === 'completed' && <CheckCircle size={20} style={{ color: '#22c55e' }} />}
                    </div>
                ))}
            </div>
        );
    };

    const [isEditing, setIsEditing] = useState(false);

    if (loading) return <LoadingScreen message="Analyzing your progress..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

            {/* Profile Overview */}
            <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                        {(profile.username?.[0] || profile.name?.[0])?.toUpperCase()}
                    </div>
                    <div>
                        {!isEditing ? (
                            <>
                                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>{profile.name}</h1>
                                <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>@{profile.username}</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{profile.email}</p>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Full Name</label>
                                    <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="input-glass" style={{ width: '300px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Username</label>
                                    <input type="text" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} className="input-glass" style={{ width: '300px' }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem' }}>
                            <Edit2 size={16} /> Edit Profile
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setIsEditing(false)} className="btn-secondary" style={{ padding: '0.75rem' }}> <X size={18} /> </button>
                            <button onClick={handleUpdateProfile} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem' }}>
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Analytics Header */}
            <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>Performance Metrics</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</p>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{analytics?.totalCompleted || 0} Lectures</h3>
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Invested</p>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{analytics?.totalTime || '0m'}</h3>
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>This Week</p>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{analytics?.weeklyCompleted || 0} Finished</h3>
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '14px', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame size={24} fill="#f59e0b" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Streak</p>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{analytics?.streak || 0} Days</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Study Preferences */}
            <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Study Preferences</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Daily Study Time</label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <input
                                type="time"
                                value={preferences.dailyStudyTime.start}
                                onChange={(e) => setPreferences({ ...preferences, dailyStudyTime: { ...preferences.dailyStudyTime, start: e.target.value } })}
                                className="input-glass"
                                style={{ flex: 1 }}
                            />
                            <span>to</span>
                            <input
                                type="time"
                                value={preferences.dailyStudyTime.end}
                                onChange={(e) => setPreferences({ ...preferences, dailyStudyTime: { ...preferences.dailyStudyTime, end: e.target.value } })}
                                className="input-glass"
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Max Videos Per Day</label>
                        <input
                            type="number"
                            min="1"
                            value={preferences.videosPerDay}
                            onChange={(e) => setPreferences({ ...preferences, videosPerDay: parseInt(e.target.value) })}
                            className="input-glass"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Max Watch Time Per Day (minutes)</label>
                        <input
                            type="number"
                            min="15"
                            step="15"
                            value={preferences.maxWatchTimePerDay}
                            onChange={(e) => setPreferences({ ...preferences, maxWatchTimePerDay: parseInt(e.target.value) })}
                            className="input-glass"
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button onClick={handleUpdatePreferences} className="btn-primary" style={{ width: '100%' }}>
                            Save Preferences
                        </button>
                    </div>
                </div>
                {prefMessage && (
                    <p style={{ marginTop: '1rem', color: prefMessage.includes('success') ? '#10b981' : '#ef4444', fontSize: '0.9rem', fontWeight: '600' }}>
                        {prefMessage}
                    </p>
                )}
            </div>

            {/* Task History Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    {[
                        { id: 'completed', label: 'Completion History', icon: Award, count: schedules.completed.length },
                        { id: 'upcoming', label: 'Future Plans', icon: Calendar, count: schedules.upcoming.length },
                        { id: 'missed', label: 'Missed Goals', icon: AlertCircle, count: schedules.missed.length, color: '#ef4444' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.25rem', borderRadius: '12px',
                                background: activeTab === tab.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                color: activeTab === tab.id ? (tab.color || 'var(--primary)') : 'var(--text-muted)',
                                border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '6px', background: activeTab === tab.id ? (tab.color || 'var(--primary)') : 'rgba(255,255,255,0.03)', color: 'white' }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div>
                    {activeTab === 'completed' && renderList(schedules.completed, "You haven't finished any lectures yet. Start your journey today!")}
                    {activeTab === 'upcoming' && renderList(schedules.upcoming, "No future sessions planned. Head to a playlist to schedule some!")}
                    {activeTab === 'missed' && renderList(schedules.missed, "You're all caught up! No missed goals here.")}
                </div>
            </div>

        </div>
    );
};

export default Profile;
