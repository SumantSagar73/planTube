import { useEffect, useState } from 'react';
import feedbackService from '../../services/feedbackService';
import { formatDateTime } from '../../utils/dateTime';

const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'in_review', label: 'In Review' },
    { value: 'planned', label: 'Planned' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
];

const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'ux', label: 'UX/UI' },
    { value: 'performance', label: 'Performance' },
    { value: 'other', label: 'Other' }
];

const priorityOptions = ['critical', 'high', 'medium', 'low'];

const priorityStyles = {
    critical: { border: '1px solid rgba(239,68,68,0.45)', color: '#fca5a5', background: 'rgba(239,68,68,0.12)' },
    high: { border: '1px solid rgba(249,115,22,0.45)', color: '#fdba74', background: 'rgba(249,115,22,0.12)' },
    medium: { border: '1px solid rgba(245,158,11,0.4)', color: '#fcd34d', background: 'rgba(245,158,11,0.12)' },
    low: { border: '1px solid rgba(34,197,94,0.35)', color: '#86efac', background: 'rgba(34,197,94,0.12)' }
};

const AdminFeedback = ({ notify }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [q, setQ] = useState('');
    const [statusCounts, setStatusCounts] = useState({});
    const [priorityCounts, setPriorityCounts] = useState({});
    const [savingId, setSavingId] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await feedbackService.getAdminFeedback({
                page,
                limit: 20,
                status: statusFilter,
                category: categoryFilter,
                q
            });
            setItems(res.items || []);
            setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
            setStatusCounts(res.statusCounts || {});
            setPriorityCounts(res.priorityCounts || {});
        } catch (err) {
            console.error('Load admin feedback failed:', err);
            notify?.(err?.response?.data?.msg || 'Failed to load feedback', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [page, statusFilter, categoryFilter]);

    const save = async (item, updates) => {
        setSavingId(item._id);
        try {
            const res = await feedbackService.updateAdminFeedback(item._id, updates);
            setItems((prev) => prev.map((it) => (it._id === item._id ? res.item : it)));
            notify?.('Feedback updated', 'success');
            load();
        } catch (err) {
            console.error('Update feedback failed:', err);
            notify?.(err?.response?.data?.msg || 'Could not update feedback', 'error');
        } finally {
            setSavingId('');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>Feedback</h2>
                <p style={{ color: 'var(--text-muted)' }}>Review user feedback in priority order, then manage resolution workflow.</p>
            </div>

            <div className="glass" style={{ padding: '1rem', borderRadius: '18px', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {['new', 'in_review', 'planned', 'resolved', 'rejected'].map((status) => (
                    <span key={status} style={{ fontSize: '0.78rem', padding: '0.25rem 0.55rem', border: '1px solid var(--glass-border)', borderRadius: '999px', color: 'var(--text-muted)' }}>
                        {status}: {statusCounts[status] || 0}
                    </span>
                ))}
            </div>

            <div className="glass admin-filters-grid" style={{ padding: '1rem', borderRadius: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem' }}>
                <select className="styled-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select className="styled-input" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
                    {categoryOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <input className="styled-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject/message/page" />
                <button className="btn-secondary" onClick={() => { setPage(1); load(); }}>Search</button>
            </div>

            <div className="glass" style={{ padding: '1rem', borderRadius: '18px', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>Queue priority</span>
                {priorityOptions.map((priority) => (
                    <span
                        key={priority}
                        style={{
                            fontSize: '0.78rem',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '999px',
                            ...priorityStyles[priority]
                        }}
                    >
                        {priority}: {priorityCounts[priority] || 0}
                    </span>
                ))}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Sorted by priority score, then newest first.</span>
            </div>

            {loading && items.length === 0 ? (
                <div className="glass" style={{ padding: '1rem', borderRadius: '18px', color: 'var(--text-muted)' }}>Loading feedback...</div>
            ) : items.length === 0 ? (
                <div className="glass" style={{ padding: '1rem', borderRadius: '18px', color: 'var(--text-muted)' }}>No feedback found.</div>
            ) : (
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {items.map((item) => (
                        <div key={item._id} className="glass" style={{ padding: '1rem', borderRadius: '16px', display: 'grid', gap: '0.65rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <div>
                                    <strong style={{ fontSize: '1rem' }}>{item.subject}</strong>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                        By {item.userId?.name || 'Unknown'} ({item.userId?.email || 'No email'})
                                    </div>
                                </div>
                                <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.35)' }}>{item.category}</span>
                                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.35)' }}>{item.impact}</span>
                                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: '999px', ...priorityStyles[(item.priorityLabel || 'low').toLowerCase()] }}>
                                        {item.priorityLabel || 'Low'} priority
                                    </span>
                                </div>
                            </div>

                            <p style={{ color: 'var(--text-main)', opacity: 0.9 }}>{item.message}</p>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                <span>Page: {item.pagePath || '-'}</span>
                                <span>•</span>
                                <span>Submitted: {formatDateTime(item.createdAt)}</span>
                                <span>•</span>
                                <span>Contact: {item.contactAllowed ? (item.contactEmail || item.userId?.email || 'Yes') : 'No'}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: '0.6rem' }} className="admin-filters-grid">
                                <select
                                    className="styled-input"
                                    value={item.status}
                                    onChange={(e) => setItems((prev) => prev.map((it) => it._id === item._id ? { ...it, status: e.target.value } : it))}
                                >
                                    {statusOptions.filter((opt) => opt.value).map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <input
                                    className="styled-input"
                                    value={item.adminNotes || ''}
                                    onChange={(e) => setItems((prev) => prev.map((it) => it._id === item._id ? { ...it, adminNotes: e.target.value } : it))}
                                    placeholder="Internal admin notes"
                                />
                                <button
                                    className="btn-primary"
                                    disabled={savingId === item._id}
                                    onClick={() => save(item, { status: item.status, adminNotes: item.adminNotes || '' })}
                                >
                                    {savingId === item._id ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Page {pagination.page} of {pagination.totalPages}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Previous</button>
                    <button className="btn-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}>Next</button>
                </div>
            </div>
        </div>
    );
};

export default AdminFeedback;
