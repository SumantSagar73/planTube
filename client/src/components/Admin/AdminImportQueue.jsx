import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const AdminImportQueue = ({ notify }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try { setData(await adminService.getImportQueue()); }
        catch { notify?.('Failed to load import queue', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const recent = data?.recent || [];
    const stale = data?.stats?.staleCount || 0;
    const total = data?.stats?.totalSynced || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>Import Queue</h2>
                    <p style={{ color: 'var(--text-muted)' }}>YouTube playlist sync status across the platform</p>
                </div>
                <button className="btn-secondary" onClick={fetch}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Total Synced', value: total, color: '#6366f1', icon: <Database size={18} /> },
                    { label: 'Stale (7d+)', value: stale, color: stale > 0 ? '#f59e0b' : '#22c55e', icon: stale > 0 ? <AlertCircle size={18} /> : <CheckCircle size={18} /> },
                    { label: 'Showing', value: recent.length, color: '#38bdf8', icon: <Clock size={18} /> },
                ].map(s => (
                    <div key={s.label} className="glass-card" style={{ padding: '1.2rem', borderRadius: 16, display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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

            {stale > 0 && (
                <div style={{ padding: '0.85rem 1.25rem', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertCircle size={16} color="#f59e0b" />
                    <span style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
                        <strong>{stale} playlists</strong> haven't synced in over 7 days. Users may be seeing outdated video lists.
                    </span>
                </div>
            )}

            <div className="glass-card" style={{ padding: 0, borderRadius: 20, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading sync data...</div>
                ) : (
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                                {['Playlist', 'Owner', 'Last Synced', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recent.map(pl => {
                                const ageMs = pl.lastSyncedAt ? Date.now() - new Date(pl.lastSyncedAt).getTime() : Infinity;
                                const isStale = ageMs > 7 * 24 * 60 * 60 * 1000;
                                const hasError = !!pl.syncError;
                                return (
                                    <tr key={pl._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {pl.thumbnail && <img src={pl.thumbnail} alt="" style={{ width: 40, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pl.playlistTitle || 'Untitled'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{pl.playlistId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {pl.userId?.name || '—'}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: isStale ? '#f59e0b' : 'var(--text-muted)' }}>
                                            {pl.lastSyncedAt ? formatDateTime(pl.lastSyncedAt) : 'Never'}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            {hasError ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: '0.75rem' }}><AlertCircle size={12} /> Error</span>
                                            ) : isStale ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: '0.75rem' }}><Clock size={12} /> Stale</span>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e', fontSize: '0.75rem' }}><CheckCircle size={12} /> Fresh</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {!recent.length && (
                                <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sync data found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminImportQueue;
