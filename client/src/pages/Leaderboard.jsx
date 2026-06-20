import { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, Clock, Users, RefreshCw, Crown, Lock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const fmtTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h >= 1) return `${h}h ${m}m`;
    return `${m}m`;
};

const medalColor = (rank) => {
    if (rank === 1) return '#f59e0b';
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#cd7c3d';
    return 'rgba(255,255,255,0.2)';
};

const RankBadge = ({ rank }) => (
    <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: rank <= 3 ? medalColor(rank) : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: rank <= 3 ? '0.8rem' : '0.75rem',
        color: rank <= 3 ? '#0f172a' : 'rgba(255,255,255,0.5)',
        border: rank <= 3 ? 'none' : '1px solid rgba(255,255,255,0.1)',
    }}>
        {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
    </div>
);

const LeaderRow = ({ entry, isMe }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.9rem',
        padding: '0.75rem 1rem', borderRadius: '12px',
        background: isMe ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
        border: isMe ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.05)',
        transition: 'background 0.2s',
    }}
        onMouseEnter={e => !isMe && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        onMouseLeave={e => !isMe && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
    >
        <RankBadge rank={entry.rank} />

        {/* Avatar */}
        <div style={{
            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
            background: entry.themeColor || '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.85rem', color: 'white',
        }}>
            {(entry.name || entry.username || '?')[0].toUpperCase()}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {entry.name || entry.username}
                {isMe && <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: '#6366f1', fontWeight: 800 }}>YOU</span>}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                Lv.{entry.level || 1} · {entry.xp || 0} XP
            </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={13} color="#f59e0b" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                    {entry.bestStreak || 0}d
                </span>
            </div>
            <div style={{
                background: 'rgba(99,102,241,0.2)', borderRadius: '8px',
                padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px'
            }}>
                <Clock size={12} color="#6366f1" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#a5b4fc' }}>
                    {fmtTime(entry.weeklySeconds)}
                </span>
            </div>
        </div>
    </div>
);

const Leaderboard = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('global');
    const [globalData, setGlobalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupData, setGroupData] = useState(null);

    useEffect(() => {
        fetchGlobal();
        if (user) fetchGroups();
    }, []);

    const fetchGlobal = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get('/leaderboard/global');
            setGlobalData(res.data);
        } catch { setError('Failed to load leaderboard.'); }
        finally { setLoading(false); }
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data || []);
        } catch {}
    };

    const fetchGroup = async (gid) => {
        setLoading(true); setError('');
        setSelectedGroup(gid);
        try {
            const res = await api.get(`/leaderboard/group/${gid}`);
            setGroupData(res.data);
        } catch { setError('Failed to load group leaderboard.'); }
        finally { setLoading(false); }
    };

    const entries = tab === 'global'
        ? (globalData?.leaderboard || [])
        : (groupData?.leaderboard || []);

    const myId = user?._id || user?.id;

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1rem 4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Trophy size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>Leaderboard</h1>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>This week's top learners · resets every Monday</p>
                </div>
                <button onClick={fetchGlobal} style={{
                    marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center'
                }}>
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button onClick={() => setTab('global')} style={{
                    padding: '7px 18px', borderRadius: '20px', border: 'none', fontWeight: 700,
                    fontSize: '0.8rem', cursor: 'pointer',
                    background: tab === 'global' ? '#6366f1' : 'rgba(255,255,255,0.06)',
                    color: tab === 'global' ? 'white' : 'rgba(255,255,255,0.5)'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Crown size={13} /> Global</span>
                </button>
                {user && groups.length > 0 && (
                    <button onClick={() => setTab('group')} style={{
                        padding: '7px 18px', borderRadius: '20px', border: 'none', fontWeight: 700,
                        fontSize: '0.8rem', cursor: 'pointer',
                        background: tab === 'group' ? '#6366f1' : 'rgba(255,255,255,0.06)',
                        color: tab === 'group' ? 'white' : 'rgba(255,255,255,0.5)'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={13} /> My Groups</span>
                    </button>
                )}
            </div>

            {/* Group selector */}
            {tab === 'group' && groups.length > 0 && (
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {groups.map(g => (
                        <button key={g._id} onClick={() => fetchGroup(g._id)} style={{
                            padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                            background: selectedGroup === g._id ? 'rgba(99,102,241,0.25)' : 'transparent',
                            color: selectedGroup === g._id ? '#a5b4fc' : 'rgba(255,255,255,0.5)'
                        }}>
                            {g.groupName}
                        </button>
                    ))}
                </div>
            )}

            {/* My rank card (global) */}
            {tab === 'global' && globalData?.myRank && (
                <div style={{
                    background: globalData.myRank.isPublic ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${globalData.myRank.isPublic ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '14px', padding: '0.75rem 1rem', marginBottom: '1rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {globalData.myRank.isPublic
                            ? <Zap size={16} color="#6366f1" />
                            : <Lock size={16} color="rgba(255,255,255,0.35)" />
                        }
                        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, flex: 1 }}>
                            Your rank this week: <strong style={{ color: 'white' }}>#{globalData.myRank.rank}</strong>
                            {' '}· {fmtTime(globalData.myRank.weeklySeconds)} focused
                            {!globalData.myRank.isPublic && (
                                <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}> · hidden from leaderboard</span>
                            )}
                        </span>
                    </div>
                    {!globalData.myRank.isPublic && (
                        <div style={{ marginTop: '0.5rem', paddingLeft: '1.75rem', fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)' }}>
                            <Lock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            Your profile is private — go to{' '}
                            <a href="/profile" style={{ color: '#a5b4fc', textDecoration: 'underline' }}>Profile settings</a>
                            {' '}and make it public to claim your spot on the leaderboard.
                        </div>
                    )}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                    <RefreshCw className="spin" size={28} style={{ color: '#6366f1', marginBottom: '0.75rem' }} />
                    <p>Loading...</p>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                    <p>{error}</p>
                    <button onClick={fetchGlobal} className="btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
                </div>
            ) : entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                    <Trophy size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p style={{ fontWeight: 600 }}>
                        {tab === 'group' && !selectedGroup
                            ? 'Select a group above to see its leaderboard.'
                            : 'No activity recorded this week yet. Start studying to appear here!'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {entries.map(entry => (
                        <LeaderRow
                            key={String(entry.userId)}
                            entry={entry}
                            isMe={myId && String(entry.userId) === String(myId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
