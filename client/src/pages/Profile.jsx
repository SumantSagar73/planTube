import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Clock, Calendar, Award, AlertCircle,
    Flame, BarChart3, TrendingUp, Play, CheckCircle
} from 'lucide-react';

const Profile = () => {
    const [analytics, setAnalytics] = useState(null);
    const [schedules, setSchedules] = useState({
        upcoming: [],
        missed: [],
        completed: []
    });
    const [activeTab, setActiveTab] = useState('completed');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [analyticsRes, upcomingRes, missedRes, completedRes] = await Promise.all([
                api.get('/schedules/analytics'),
                api.get('/schedules/upcoming'),
                api.get('/schedules/missed'),
                api.get('/schedules/completed')
            ]);

            setAnalytics(analyticsRes.data);
            setSchedules({
                upcoming: upcomingRes.data,
                missed: missedRes.data,
                completed: completedRes.data
            });
        } catch (err) {
            console.error('Error fetching profile data:', err);
        } finally {
            setLoading(false);
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

    if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading Profile...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

            {/* Analytics Header */}
            <div>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-1px' }}>Learning Insights</h1>
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
