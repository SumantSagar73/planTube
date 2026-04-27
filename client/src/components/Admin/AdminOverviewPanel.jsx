import React from 'react';
import { Activity, TrendingUp, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { formatDateTime } from '../../utils/dateTime';

const StatCard = ({ icon, label, value, trend, suffix }) => (
    <div className="glass-card" style={{
        padding: '1rem',
        borderRadius: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--glass-border)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
            {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <strong style={{ fontSize: '1.5rem' }}>{value}</strong>
            {trend !== null && trend !== undefined && (
                <span style={{ fontSize: '0.72rem', color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
                    {trend >= 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        {suffix && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{suffix}</div>}
    </div>
);

const AdminOverviewPanel = ({ stats, health, chartData, fetchOverview, autoRefresh, setAutoRefresh, statCards }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1.5px', color: 'var(--text-main)' }}>
                        Admin Command Center
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
                        Last updated: {stats?.lastUpdatedAt ? formatDateTime(stats.lastUpdatedAt) : 'N/A'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => fetchOverview(false)}>
                        <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
                    </button>
                    <button
                        className="btn-secondary"
                        style={{ borderColor: autoRefresh ? 'rgba(16,185,129,0.5)' : undefined }}
                        onClick={() => setAutoRefresh((v) => !v)}
                    >
                        Auto Refresh: {autoRefresh ? 'On' : 'Off'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
                {statCards.map((item) => (
                    <StatCard key={item.label} {...item} />
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }} className="admin-overview-grid">
                <div data-section="admin-analytics" className="glass-card" style={{ padding: '1rem', borderRadius: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        <Activity size={18} color="#60a5fa" /> Activity (7 days)
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,12,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                                <Area type="monotone" dataKey="studyMins" name="Study Minutes" stroke="#60a5fa" strokeWidth={2.6} fillOpacity={1} fill="url(#colorStudy)" />
                                <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#34d399" strokeWidth={2.6} fillOpacity={1} fill="url(#colorActive)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div data-section="admin-health" className="glass-card" style={{ padding: '1rem', borderRadius: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
                            <ShieldCheck size={18} color={health?.status === 'ok' ? '#22c55e' : '#ef4444'} />
                            System Health
                        </h3>
                        <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.85rem' }}>
                            <span>Status: <strong style={{ color: health?.status === 'ok' ? '#22c55e' : '#ef4444' }}>{health?.status || 'unknown'}</strong></span>
                            <span>DB: <strong>{health?.dbState || 'unknown'}</strong></span>
                            <span>DB Latency: <strong>{health?.dbLatencyMs ?? '--'}ms</strong></span>
                            <span>Uptime: <strong>{health?.uptimeHours ?? '--'}h</strong></span>
                            <span>Memory: <strong>{health?.memoryUsedMb ?? '--'} MB</strong></span>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem', borderRadius: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.7rem' }}>
                            <AlertTriangle size={16} color="#f59e0b" /> Active Alerts
                        </h3>
                        <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.85rem' }}>
                            <span>Frozen users: <strong>{stats?.frozenUsers || 0}</strong></span>
                            <span>Pending wipe requests: <strong>{stats?.pendingWipes || 0}</strong></span>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem', borderRadius: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.7rem' }}>
                            <TrendingUp size={16} color="#f472b6" /> Top Topics
                        </h3>
                        <div style={{ width: '100%', height: Math.max(120, chartData.topTopics.length * 30) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.topTopics} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'white', fontSize: 11 }} width={90} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(10,10,12,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v) => [`${v} playlists`]} />
                                    <Bar dataKey="value" name="Playlists" radius={[0, 4, 4, 0]}>
                                        {chartData.topTopics.map((_, index) => (
                                            <Cell key={`topic-${index}`} fill={['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverviewPanel;
