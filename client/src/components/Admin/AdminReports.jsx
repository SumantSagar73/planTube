import React, { useEffect, useState } from 'react';
import { Flag, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/dateTime';

const STATUS_META = {
    pending: { label: 'Pending', color: '#f59e0b', icon: <Clock size={13} /> },
    resolved: { label: 'Resolved', color: '#22c55e', icon: <CheckCircle size={13} /> },
    dismissed: { label: 'Dismissed', color: '#64748b', icon: <XCircle size={13} /> },
};

const REASON_LABELS = {
    spam: 'Spam', inappropriate: 'Inappropriate', copyright: 'Copyright',
    harassment: 'Harassment', misinformation: 'Misinformation', other: 'Other',
};

const AdminReports = ({ notify }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [resolving, setResolving] = useState(null);
    const [resolution, setResolution] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await adminService.getReports({ status: statusFilter, page: pagination.page });
            setReports(res.items || []);
            setPagination(res.pagination || pagination);
        } catch {
            notify?.('Failed to load reports', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, [statusFilter, pagination.page]);

    const handleResolve = async (id, status) => {
        try {
            await adminService.resolveReport(id, { status, resolution });
            notify?.(`Report ${status}`, 'success');
            setResolving(null);
            setResolution('');
            fetchReports();
        } catch {
            notify?.('Failed to update report', 'error');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>Reported Content</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{pagination.total} total reports</p>
                </div>
                <button className="btn-secondary" onClick={fetchReports}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Object.entries(STATUS_META).map(([k, v]) => (
                    <button key={k} onClick={() => setStatusFilter(k)} style={{
                        padding: '6px 16px', borderRadius: 20, border: `1px solid ${statusFilter === k ? v.color : 'rgba(255,255,255,0.1)'}`,
                        background: statusFilter === k ? `${v.color}18` : 'transparent',
                        color: statusFilter === k ? v.color : 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                        {v.icon} {v.label}
                    </button>
                ))}
            </div>

            <div className="glass-card" style={{ padding: 0, borderRadius: 20, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : (
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                                {['Type', 'Content', 'Reason', 'Reporter', 'Date', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(r => (
                                <React.Fragment key={r._id}>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{r.contentType}</span>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', maxWidth: 200 }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.contentTitle || r.contentId}</div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem' }}>{REASON_LABELS[r.reason] || r.reason}</td>
                                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.reportedBy?.name || 'Anonymous'}</td>
                                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(r.createdAt)}</td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            {r.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button onClick={() => setResolving(resolving === r._id ? null : r._id)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                                                        {resolving === r._id ? 'Cancel' : 'Action'}
                                                    </button>
                                                </div>
                                            )}
                                            {r.status !== 'pending' && (
                                                <span style={{ fontSize: '0.75rem', color: STATUS_META[r.status]?.color }}>{STATUS_META[r.status]?.label}</span>
                                            )}
                                        </td>
                                    </tr>
                                    {resolving === r._id && (
                                        <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
                                            <td colSpan={6} style={{ padding: '0.85rem 1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Resolution note (optional)</label>
                                                        <input className="styled-input" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Why resolving or dismissing?" />
                                                    </div>
                                                    <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', background: '#22c55e' }} onClick={() => handleResolve(r._id, 'resolved')}>
                                                        <CheckCircle size={14} style={{ marginRight: 4 }} /> Resolve
                                                    </button>
                                                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }} onClick={() => handleResolve(r._id, 'dismissed')}>
                                                        <XCircle size={14} style={{ marginRight: 4 }} /> Dismiss
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {!reports.length && (
                                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Flag size={32} style={{ marginBottom: '0.5rem', opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                                    No {statusFilter} reports.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Page {pagination.page} of {pagination.totalPages}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                        <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
