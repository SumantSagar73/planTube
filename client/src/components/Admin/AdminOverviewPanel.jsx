import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, RefreshCw, ShieldCheck, AlertTriangle, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { formatDateTime } from '../../utils/dateTime';
import adminService from '../../services/adminService';

const RANGE_OPTIONS = [
    { key: '7d',  label: '7D'   },
    { key: '14d', label: '14D'  },
    { key: '30d', label: '30D'  },
    { key: '3m',  label: '3M'   },
    { key: '6m',  label: '6M'   },
    { key: '1y',  label: '1Y'   },
    { key: 'custom', label: 'Custom' },
];

const RANGE_LABELS = { '7d': '7 days', '14d': '14 days', '30d': '30 days', '3m': '3 months', '6m': '6 months', '1y': '1 year' };

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
    const [chartRange, setChartRange]     = useState('7d');
    const [customFrom, setCustomFrom]     = useState('');
    const [customTo, setCustomTo]         = useState('');
    const [activityData, setActivityData] = useState(chartData?.weeklyActivity || []);
    const [loadingChart, setLoadingChart] = useState(false);

    const fetchActivity = useCallback(async (range, from, to) => {
        setLoadingChart(true);
        try {
            const d = await adminService.getChartData(range, from, to);
            setActivityData(d.weeklyActivity || []);
        } catch {
            // keep previous data on error
        } finally {
            setLoadingChart(false);
        }
    }, []);

    useEffect(() => {
        if (chartRange !== 'custom') fetchActivity(chartRange);
    }, [chartRange, fetchActivity]);

    // Seed initial data from parent prop (avoids extra request on mount)
    useEffect(() => {
        if (chartData?.weeklyActivity?.length) setActivityData(chartData.weeklyActivity);
    }, [chartData?.weeklyActivity]);

    const handleRangeClick = (key) => {
        setChartRange(key);
    };

    const applyCustomRange = () => {
        if (customFrom && customTo) fetchActivity('custom', customFrom, customTo);
    };

    const chartTitle = chartRange === 'custom'
        ? (customFrom && customTo ? `Activity (${customFrom} → ${customTo})` : 'Activity (custom range)')
        : `Activity (${RANGE_LABELS[chartRange] || chartRange})`;

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
                    {/* Chart header + filter pills */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.8rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Activity size={18} color="#60a5fa" />
                            {loadingChart ? <span style={{ opacity: 0.6 }}>{chartTitle}</span> : chartTitle}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {RANGE_OPTIONS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => handleRangeClick(key)}
                                    style={{
                                        padding: '3px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        border: chartRange === key ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.15)',
                                        background: chartRange === key ? 'rgba(96,165,250,0.18)' : 'transparent',
                                        color: chartRange === key ? '#60a5fa' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    {key === 'custom' && <Calendar size={11} />}
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom date inputs */}
                    {chartRange === 'custom' && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="styled-input"
                                style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '8px', width: '140px' }}
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="styled-input"
                                style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '8px', width: '140px' }}
                            />
                            <button
                                className="btn-primary"
                                style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                                onClick={applyCustomRange}
                                disabled={!customFrom || !customTo}
                            >
                                Apply
                            </button>
                        </div>
                    )}

                    <div style={{ width: '100%', height: 300, opacity: loadingChart ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        <div style={{ width: '100%', height: Math.max(120, (chartData?.topTopics?.length || 0) * 30) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData?.topTopics || []} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'white', fontSize: 11 }} width={90} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(10,10,12,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v) => [`${v} playlists`]} />
                                    <Bar dataKey="value" name="Playlists" radius={[0, 4, 4, 0]}>
                                        {(chartData?.topTopics || []).map((_, index) => (
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
