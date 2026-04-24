import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Clock, Calendar, Award, AlertCircle,
    BarChart3, TrendingUp, Play, CheckCircle, UserPlus, Check, X, Shield, Trophy, Layout, Tag, ArrowRight, Info, MessageSquare, Lock
} from 'lucide-react';
import LoadingScreen from '../components/Shared/LoadingScreen';
import FocusPulseHeatmap from '../components/Shared/FocusPulseHeatmap';
import { useAuth } from '../context/AuthContext';

import StreakIcon from '../components/Shared/StreakIcon';

const PublicProfile = () => {
    const { username } = useParams();
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchPublicData();
    }, [username]);

    const fetchPublicData = async () => {
        try {
            const res = await api.get(`/social/profile/${username}`);
            setData(res.data);
            if (res.data.isMe) {
                // If it's the user's own profile, redirect to their dashboard or just show it?
                // Let's allow them to see their own public view.
            }
        } catch (err) {
            console.error('Error fetching public profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFriendAction = async () => {
        if (!data || !authUser) return;
        setActionLoading(true);
        try {
            if (!data.relationship) {
                // Send Request
                await api.post(`/social/request/${data.user._id}`);
                setMessage({ text: 'Request sent!', type: 'success' });
                fetchPublicData();
            } else if (data.relationship.status === 'pending' && data.relationship.isRequester) {
                // Already sent, maybe allow cancel? (Not implemented in backend yet)
            } else if (data.relationship.status === 'pending' && !data.relationship.isRequester) {
                // Respond to request
                await api.put(`/social/respond/${data.relationship.requestId}`, { status: 'accepted' });
                setMessage({ text: 'Request accepted!', type: 'success' });
                fetchPublicData();
            }
        } catch (err) {
            console.error('Friend action error:', err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingScreen message="Loading profile..." />;
    if (!data) return <div style={{ padding: '4rem', textAlign: 'center' }}>User not found.</div>;

    const { user, stats, heatmapData, relationship, isMe, isPrivate } = data;

    if (isPrivate) {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
                <div className="glass" style={{ padding: '4rem', borderRadius: '32px' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2rem' }}>
                         <img 
                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user.username || user.name || 'user')}`} 
                            alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '40px', filter: 'blur(5px) grayscale(1)' }} 
                        />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={48} className="text-primary" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem' }}>{user.name}'s Profile is Private</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Send a friend request to see their learning journey and achievements.</p>
                    
                    {!relationship ? (
                        <button onClick={handleFriendAction} className="btn-primary" style={{ padding: '1rem 2rem' }} disabled={actionLoading}>
                            <UserPlus size={20} /> Send Friend Request
                        </button>
                    ) : relationship.status === 'pending' ? (
                        <div className="glass" style={{ padding: '1rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>
                            <Clock size={20} /> Request Pending
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    const xpProgress = ((user.xp - Math.pow((user.level - 1) * 5, 2)) / (Math.pow(user.level * 5, 2) - Math.pow((user.level - 1) * 5, 2))) * 100;

    return (
        <div className="public-profile-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem', maxWidth: '1100px', margin: '0 auto' }}>
            
            <div className="public-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div className="public-profile-user-info" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <img 
                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user.username || user.name || 'user')}`} 
                            alt="avatar"
                            className="public-profile-avatar"
                            style={{
                                width: '100px', height: '100px', borderRadius: '30px',
                                background: 'rgba(255,255,255,0.05)', border: '2px solid var(--glass-border)',
                                boxShadow: stats.streak >= 3 ? `0 0 25px ${user.themeColor || '#6366f1'}` : '0 12px 40px rgba(0, 0, 0, 0.3)',
                                padding: '6px'
                            }}
                        />
                    </div>
                    <div className="public-profile-meta">
                        <h1 className="public-profile-name" style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '0.2rem' }}>{user.name}</h1>
                        <p className="public-profile-motto" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.75rem', fontStyle: 'italic', opacity: 0.8 }}>"{user.motto || 'Keep focusing, keep growing.'}"</p>
                        <div className="public-profile-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="level-badge" style={{ background: user.themeColor || '#6366f1', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '900' }}>LEVEL {user.level}</span>
                            <span className="username-badge" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>@{user.username}</span>
                        </div>
                    </div>
                </div>

                {!isMe && (
                    <div className="public-profile-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                        {!relationship ? (
                            <button onClick={handleFriendAction} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }} disabled={actionLoading}>
                                <UserPlus size={18} /> Add Friend
                            </button>
                        ) : relationship.status === 'pending' && relationship.isRequester ? (
                            <button className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }} disabled>
                                <Clock size={18} /> Request Sent
                            </button>
                        ) : relationship.status === 'pending' && !relationship.isRequester ? (
                            <button onClick={handleFriendAction} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }} disabled={actionLoading}>
                                <Check size={18} /> Accept Request
                            </button>
                        ) : (
                            <div className="glass" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontWeight: '800', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <CheckCircle size={18} /> Friends
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="public-profile-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Stats Grid */}
                    <div className="stats-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { label: 'Focus Hours', value: stats.totalFocusHours, color: '#6366f1', icon: Clock },
                            { label: 'Videos Done', value: stats.totalCompleted, color: '#22c55e', icon: CheckCircle },
                            { label: 'Best Streak', value: `${stats.bestStreak} Days`, color: '#f59e0b', icon: Award },
                            { label: 'Current Streak', value: `${stats.streak} Days`, color: '#ef4444', icon: StreakIcon }
                        ].map((s, i) => (
                            <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                                <div style={{ color: s.color, marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                                    <s.icon size={24} />
                                </div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.2rem' }}>{s.value}</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Heatmap */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '28px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <BarChart3 size={20} className="text-primary" /> Learning Pulse
                        </h3>
                        <FocusPulseHeatmap data={heatmapData} streak={stats.streak} />
                    </div>

                    {/* Trophies */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '28px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Trophy size={20} className="text-primary" /> Achievements
                        </h3>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            {user.badges.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', opacity: 0.6 }}>No badges earned yet.</p>
                            ) : (
                                user.badges.map((badge, i) => (
                                    <div key={i} title={badge.description} style={{ textAlign: 'center', width: '80px' }}>
                                        <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>{badge.icon}</div>
                                        <p style={{ fontSize: '0.7rem', fontWeight: '700' }}>{badge.name}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '1.75rem', borderRadius: '28px' }}>
                         <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Info size={20} className="text-primary" /> About {user.name}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>MEMBER SINCE</p>
                                <p style={{ fontWeight: '800' }}>{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>RANK</p>
                                <p style={{ fontWeight: '800' }}>#{Math.floor(1000 / (user.level || 1)) + 42} Globally</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1.75rem', borderRadius: '28px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Tag size={20} className="text-primary" /> Topics
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                            {['Javascript', 'React', 'Fullstack'].map(tag => (
                                <span key={tag} style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
