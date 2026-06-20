import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Users, BookOpen, RefreshCw } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import adminService from '../../services/adminService';

const StatCard = ({ icon, label, value, color = '#6366f1' }) => (
    <div className="glass-card" style={{ padding: '1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {React.cloneElement(icon, { color, size: 20 })}
        </div>
        <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
        </div>
    </div>
);

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#38bdf8', '#a855f7', '#f97316', '#10b981'];

const AdminContentAnalytics = ({ notify }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await adminService.getContentAnalytics();
            setData(res);
        } catch {
            notify?.('Failed to load content analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</div>;

    const importTrend = data?.recentImports?.map(d => ({ date: d._id?.slice(5), count: d.count })) || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>Content Analytics</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Playlist and import performance across the platform</p>
                </div>
                <button className="btn-secondary" onClick={fetch}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard icon={<BookOpen />} label="Total User Playlists" value={data?.totalUserPlaylists?.toLocaleString() || 0} color="#6366f1" />
                <StatCard icon={<TrendingUp />} label="Avg Completion Rate" value={`${data?.avgCompletionRate || 0}%`} color="#22c55e" />
                <StatCard icon={<BarChart2 />} label="Imports (14 days)" value={data?.recentImports?.reduce((s, d) => s + d.count, 0) || 0} color="#f59e0b" />
                <StatCard icon={<Users />} label="Top Playlist Users" value={data?.topPlaylists?.[0]?.userCount || 0} color="#ec4899" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={16} color="#6366f1" /> Import Trend (14 days)
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={importTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="importGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                            <Area type="monotone" dataKey="count" name="Imports" stroke="#6366f1" strokeWidth={2.5} fill="url(#importGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={16} color="#22c55e" /> Top Playlists by Users
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', maxHeight: 240 }}>
                        {(data?.topPlaylists || []).map((pl, i) => (
                            <div key={pl._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLORS[i % COLORS.length]}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: COLORS[i % COLORS.length], flexShrink: 0 }}>
                                    {i + 1}
                                </div>
                                {pl.thumbnail && <img src={pl.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.title || 'Untitled'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pl.userCount} users · {pl.avgProgress?.toFixed(0) || 0}% avg</div>
                                </div>
                                <div style={{ flexShrink: 0 }}>
                                    <div style={{ width: 60, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                        <div style={{ width: `${pl.avgProgress || 0}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!data?.topPlaylists?.length && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminContentAnalytics;
