import React, { useEffect, useState } from 'react';
import { Shield, Snowflake, Trash2, Eye, RefreshCw, AlertTriangle, UserCog, Lock } from 'lucide-react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const ACTION_META = {
    user_frozen: { label: 'Frozen', color: '#38bdf8', icon: <Snowflake size={13} /> },
    user_unfrozen: { label: 'Unfrozen', color: '#22c55e', icon: <Snowflake size={13} /> },
    user_deleted: { label: 'Deleted', color: '#ef4444', icon: <Trash2 size={13} /> },
    user_wipe_approved: { label: 'Wipe Approved', color: '#ef4444', icon: <Trash2 size={13} /> },
    impersonation_start: { label: 'Shadow View', color: '#f59e0b', icon: <Eye size={13} /> },
    user_role_changed: { label: 'Role Changed', color: '#a855f7', icon: <UserCog size={13} /> },
    bulk_delete: { label: 'Bulk Delete', color: '#ef4444', icon: <Trash2 size={13} /> },
    bulk_freeze: { label: 'Bulk Freeze', color: '#38bdf8', icon: <Snowflake size={13} /> },
    bulk_set_moderator: { label: 'Bulk: Moderator', color: '#a855f7', icon: <UserCog size={13} /> },
    cache_flushed: { label: 'Cache Flushed', color: '#22c55e', icon: <Lock size={13} /> },
    maintenance_scheduled: { label: 'Maintenance Scheduled', color: '#f59e0b', icon: <AlertTriangle size={13} /> },
    ab_test_created: { label: 'A/B Test Created', color: '#6366f1', icon: <Shield size={13} /> },
};

const AdminSecurity = ({ notify }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetch = async () => {
        setLoading(true);
        try {
            setData(await adminService.getSecurityLog());
        } catch {
            notify?.('Failed to load security log', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const filtered = (data?.events || []).filter(e => !filter || e.action.includes(filter));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>Security Monitor</h2>
                    <p style={{ color: 'var(--text-muted)' }}>High-sensitivity admin actions across the platform</p>
                </div>
                <button className="btn-secondary" onClick={fetch}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Frozen Users', value: data?.stats?.frozenUsers ?? '—', color: '#38bdf8', icon: <Snowflake size={18} /> },
                    { label: 'Pending Wipes', value: data?.stats?.pendingWipes ?? '—', color: '#ef4444', icon: <Trash2 size={18} /> },
                    { label: 'Active Admins (7d)', value: data?.stats?.activeAdmins ?? '—', color: '#a855f7', icon: <Shield size={18} /> },
                    { label: 'Security Events', value: data?.events?.length ?? '—', color: '#f59e0b', icon: <AlertTriangle size={18} /> },
                ].map(s => (
                    <div key={s.label} className="glass-card" style={{ padding: '1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {React.cloneElement(s.icon, { color: s.color })}
                        </div>
                        <div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{s.value}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '20px' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, flex: 1 }}>Event Log</h3>
                    <select className="styled-input" style={{ width: 'auto', minWidth: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="">All Events</option>
                        {Object.entries(ACTION_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                                    {['Event', 'Actor', 'Target', 'IP', 'Time'].map(h => (
                                        <th key={h} style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(e => {
                                    const meta = ACTION_META[e.action] || { label: e.action, color: '#94a3b8', icon: <Shield size={13} /> };
                                    return (
                                        <tr key={e._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '3px 8px', borderRadius: 8, background: `${meta.color}18`, color: meta.color, fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {meta.icon} {meta.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>{e.actorAdminId?.name || '—'}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>{e.targetUserId?.name || '—'}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{e.ip || '—'}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(e.createdAt)}</td>
                                        </tr>
                                    );
                                })}
                                {!filtered.length && (
                                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No events found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSecurity;
