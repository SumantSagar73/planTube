import React, { useEffect, useState } from 'react';
import { Users, RefreshCw, TrendingUp } from 'lucide-react';
import adminService from '../../services/adminService';

const pctColor = (pct) => {
    if (pct >= 70) return '#22c55e';
    if (pct >= 40) return '#f59e0b';
    if (pct >= 15) return '#f97316';
    return '#ef4444';
};

const pctBg = (pct) => {
    if (pct >= 70) return 'rgba(34,197,94,0.18)';
    if (pct >= 40) return 'rgba(245,158,11,0.18)';
    if (pct >= 15) return 'rgba(249,115,22,0.18)';
    return 'rgba(239,68,68,0.15)';
};

const AdminCohort = ({ notify }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            setData(await adminService.getCohortRetention());
        } catch {
            notify?.('Failed to load cohort data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const cohorts = data?.cohorts || [];
    const maxMonths = Math.max(...cohorts.map(c => c.retention?.length || 0), 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>Cohort Retention</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Monthly user cohorts — what % are still active each month</p>
                </div>
                <button className="btn-secondary" onClick={fetch}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</button>
            </div>

            <div className="glass-card" style={{ padding: '0.5rem', borderRadius: 20, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                    { color: '#22c55e', label: '≥ 70%' }, { color: '#f59e0b', label: '40–69%' },
                    { color: '#f97316', label: '15–39%' }, { color: '#ef4444', label: '< 15%' }
                ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                ))}
            </div>

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Computing cohorts...</div>
            ) : (
                <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 20, overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
                        <thead>
                            <tr style={{ textAlign: 'center' }}>
                                <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Cohort</th>
                                <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Size</th>
                                {Array.from({ length: maxMonths }, (_, i) => (
                                    <th key={i} style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Month {i}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cohorts.map((c, ci) => (
                                <tr key={ci} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.6rem 1rem', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{c.month}</td>
                                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                            <Users size={12} /> {c.size}
                                        </div>
                                    </td>
                                    {Array.from({ length: maxMonths }, (_, mi) => {
                                        const cell = c.retention?.find(r => r.month === mi);
                                        if (!cell) return <td key={mi} style={{ padding: '0.6rem 0.75rem' }} />;
                                        return (
                                            <td key={mi} style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                                                <div style={{
                                                    display: 'inline-block', padding: '4px 10px', borderRadius: 8,
                                                    background: pctBg(cell.pct), color: pctColor(cell.pct),
                                                    fontSize: '0.8rem', fontWeight: 800, minWidth: 44,
                                                }}>
                                                    {cell.pct}%
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {!cohorts.length && (
                                <tr><td colSpan={maxMonths + 2} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <TrendingUp size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                                    No cohort data yet. Needs at least 1 month of user activity.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Month 0 = signup month (always 100% for active users). Each subsequent column shows what % of that cohort logged a study session in that calendar month.
            </p>
        </div>
    );
};

export default AdminCohort;
