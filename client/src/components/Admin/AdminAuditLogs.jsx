import React, { useEffect, useMemo, useState } from 'react';
import { FileClock, Search } from 'lucide-react';
import adminService from '../../services/adminService';

const AdminAuditLogs = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            setLoading(true);
            try {
                const res = await adminService.getAuditLogs({ q: debouncedSearch, page, limit: 20 });
                if (!mounted) return;
                setItems(res.items || []);
                setPagination(res.pagination || { page: 1, totalPages: 1, total: 0, limit: 20 });
            } catch (err) {
                console.error('Audit logs fetch failed:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        run();
        return () => { mounted = false; };
    }, [debouncedSearch, page]);

    const rows = useMemo(() => items.map((log) => ({
        id: log._id,
        action: log.action,
        actor: log.actorAdminId?.name || 'Unknown admin',
        target: log.targetUserId?.email || '-',
        when: new Date(log.createdAt).toLocaleString(),
        details: JSON.stringify(log.metadata || {})
    })), [items]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '900' }}>Audit Trail</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{pagination.total} admin actions logged</p>
                </div>

                <div style={{ position: 'relative', minWidth: '260px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        className="styled-input"
                        style={{ paddingLeft: '2rem' }}
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                        placeholder="Search action or reason"
                    />
                </div>
            </div>

            <div className="glass-card" style={{ borderRadius: '18px', overflow: 'hidden' }}>
                <div className="admin-table-wrap" style={{ maxHeight: '480px', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left' }}>
                                <th style={{ padding: '0.9rem' }}>Action</th>
                                <th style={{ padding: '0.9rem' }}>Actor</th>
                                <th style={{ padding: '0.9rem' }}>Target</th>
                                <th style={{ padding: '0.9rem' }}>When</th>
                                <th style={{ padding: '0.9rem' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <td style={{ padding: '0.9rem' }}><FileClock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{row.action}</td>
                                    <td style={{ padding: '0.9rem' }}>{row.actor}</td>
                                    <td style={{ padding: '0.9rem' }}>{row.target}</td>
                                    <td style={{ padding: '0.9rem' }}>{row.when}</td>
                                    <td style={{ padding: '0.9rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{row.details}</td>
                                </tr>
                            ))}
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }} colSpan={5}>No audit rows match this filter.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Prev</button>
                <button className="btn-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}>Next</button>
            </div>
        </div>
    );
};

export default AdminAuditLogs;
