import React, { useEffect, useMemo, useState } from 'react';
import { Search, Eye, Shield, ShieldAlert, Trash2, Mail, Hash, Snowflake, Download, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminConfirmModal from './AdminConfirmModal';

const getParam = (params, key, fallback = '') => params.get(key) || fallback;

const AdminUsers = ({ onViewDetails, onImpersonate, notify }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [confirmState, setConfirmState] = useState(null);

    const query = getParam(searchParams, 'uq', '');
    const role = getParam(searchParams, 'urole', '');
    const frozen = getParam(searchParams, 'ufrozen', '');
    const wipeRequested = getParam(searchParams, 'uwipe', '');
    const sortBy = getParam(searchParams, 'usortBy', 'createdAt');
    const sortOrder = getParam(searchParams, 'usortOrder', 'desc');
    const page = Math.max(parseInt(getParam(searchParams, 'upage', '1'), 10) || 1, 1);
    const [searchInput, setSearchInput] = useState(query);

    const updateParam = (key, value, resetPage = false) => {
        const next = new URLSearchParams(searchParams);
        if (!value) next.delete(key);
        else next.set(key, String(value));
        if (resetPage) next.set('upage', '1');
        setSearchParams(next);
    };

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== query) {
                updateParam('uq', searchInput, true);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, query]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminService.getUsers({
                q: query,
                role,
                frozen,
                wipeRequested,
                sortBy,
                sortOrder,
                page,
                limit: 20
            });
            setUsers(res.items || []);
            setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        } catch (err) {
            console.error('Users fetch failed:', err);
            notify?.('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [query, role, frozen, wipeRequested, sortBy, sortOrder, page]);

    const runAction = async (action, successMessage) => {
        try {
            await action();
            notify?.(successMessage, 'success');
            fetchUsers();
        } catch (err) {
            notify?.(err?.response?.data?.msg || 'Action failed', 'error');
        }
    };

    const promptRoleToggle = (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        setConfirmState({
            title: `Change ${user.name}'s role`,
            message: `This will make ${user.name} a ${newRole}. Continue?`,
            confirmLabel: 'Apply Role',
            danger: false,
            onConfirm: () => runAction(() => adminService.updateUserRole(user._id, newRole), 'Role updated')
        });
    };

    const promptFreezeToggle = (user) => {
        setConfirmState({
            title: `${user.isFrozen ? 'Unfreeze' : 'Freeze'} ${user.name}`,
            message: user.isFrozen
                ? 'This account will regain normal access.'
                : 'This account will be blocked from normal usage until unfrozen.',
            confirmLabel: user.isFrozen ? 'Unfreeze' : 'Freeze',
            danger: false,
            onConfirm: () => runAction(() => adminService.freezeUser(user._id), user.isFrozen ? 'User unfrozen' : 'User frozen')
        });
    };

    const promptDelete = (user) => {
        setConfirmState({
            title: `Delete ${user.name}`,
            message: 'This permanently removes the account and related records. This cannot be undone.',
            confirmLabel: 'Delete User',
            requirePhrase: 'DELETE',
            danger: true,
            onConfirm: () => runAction(() => adminService.deleteUser(user._id), 'User deleted')
        });
    };

    const promptWipeApprove = (user) => {
        setConfirmState({
            title: `Approve wipe for ${user.name}`,
            message: 'This immediately performs a full data wipe by deleting the user and related data.',
            confirmLabel: 'Approve Wipe',
            requirePhrase: 'WIPE',
            danger: true,
            onConfirm: () => runAction(() => adminService.approveWipe(user._id), 'Wipe approved and user removed')
        });
    };

    const statusText = useMemo(() => {
        if (loading) return 'Loading user registry...';
        if (!pagination.total) return 'No users found for this filter.';
        return `Showing ${users.length} of ${pagination.total} users`;
    }, [loading, pagination.total, users.length]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>User Registry</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{statusText}</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={fetchUsers} aria-label="Refresh users">
                        <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => adminService.exportUsersCsv({ q: query, role, frozen, wipeRequested, sortBy, sortOrder })}
                        aria-label="Export users as CSV"
                    >
                        <Download size={14} style={{ marginRight: 6 }} /> Export CSV
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0.6rem' }} className="admin-filters-grid">
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        className="styled-input"
                        style={{ paddingLeft: '2rem' }}
                        placeholder="Search name, email, username"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <select className="styled-input" value={role} onChange={(e) => updateParam('urole', e.target.value, true)} aria-label="Filter role">
                    <option value="">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users</option>
                </select>
                <select className="styled-input" value={frozen} onChange={(e) => updateParam('ufrozen', e.target.value, true)} aria-label="Filter frozen status">
                    <option value="">Freeze: Any</option>
                    <option value="true">Frozen</option>
                    <option value="false">Not Frozen</option>
                </select>
                <select className="styled-input" value={wipeRequested} onChange={(e) => updateParam('uwipe', e.target.value, true)} aria-label="Filter wipe status">
                    <option value="">Wipe: Any</option>
                    <option value="true">Wipe Requested</option>
                    <option value="false">No Wipe Request</option>
                </select>
                <select
                    className="styled-input"
                    value={`${sortBy}:${sortOrder}`}
                    onChange={(e) => {
                        const [nextSortBy, nextSortOrder] = e.target.value.split(':');
                        updateParam('usortBy', nextSortBy, false);
                        updateParam('usortOrder', nextSortOrder, true);
                    }}
                    aria-label="Sort users"
                >
                    <option value="createdAt:desc">Newest Joined</option>
                    <option value="createdAt:asc">Oldest Joined</option>
                    <option value="name:asc">Name A-Z</option>
                    <option value="name:desc">Name Z-A</option>
                </select>
            </div>

            <div className="glass-card" style={{ padding: 0, borderRadius: '20px', overflow: 'hidden' }}>
                <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}>
                                <th style={{ padding: '1rem' }}>Identity</th>
                                <th style={{ padding: '1rem' }}>Activity</th>
                                <th style={{ padding: '1rem' }}>Joined</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <div style={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: 10,
                                                background: u.role === 'admin' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.08)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800
                                            }}>{u.name?.charAt(0) || '?'}</div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <strong>{u.name}</strong>
                                                    {u.isFrozen && <Snowflake size={14} color="#38bdf8" />}
                                                    {u.wipeRequested && <Trash2 size={14} color="#ef4444" />}
                                                </div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Mail size={12} /> {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.84rem' }}>
                                        {u.playlistCount || 0} playlists / {u.groupCount || 0} groups
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <button className="icon-btn" aria-label="View details" onClick={() => onViewDetails(u._id)}><Hash size={15} /></button>
                                            <button className="icon-btn" aria-label="Impersonate user" onClick={() => onImpersonate(u)}><Eye size={15} /></button>
                                            <button className="icon-btn" aria-label="Toggle role" onClick={() => promptRoleToggle(u)}>{u.role === 'admin' ? <ShieldAlert size={15} /> : <Shield size={15} />}</button>
                                            <button className="icon-btn" aria-label="Toggle freeze" onClick={() => promptFreezeToggle(u)}><Snowflake size={15} /></button>
                                            <button className="icon-btn" aria-label="Delete user" onClick={() => promptDelete(u)}><Trash2 size={15} /></button>
                                            {u.wipeRequested && (
                                                <button className="btn-primary" style={{ background: '#ef4444', padding: '0.45rem 0.65rem' }} onClick={() => promptWipeApprove(u)}>
                                                    Approve Wipe
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && users.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '1rem', color: 'var(--text-muted)' }}>No users match the current filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Page {pagination.page} of {pagination.totalPages}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" disabled={pagination.page <= 1} onClick={() => updateParam('upage', Math.max(pagination.page - 1, 1), false)}>Previous</button>
                    <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => updateParam('upage', Math.min(pagination.page + 1, pagination.totalPages), false)}>Next</button>
                </div>
            </div>

            <AdminConfirmModal
                open={!!confirmState}
                title={confirmState?.title}
                message={confirmState?.message}
                confirmLabel={confirmState?.confirmLabel}
                requirePhrase={confirmState?.requirePhrase}
                danger={confirmState?.danger}
                onCancel={() => setConfirmState(null)}
                onConfirm={async () => {
                    const onConfirm = confirmState?.onConfirm;
                    setConfirmState(null);
                    if (onConfirm) await onConfirm();
                }}
            />
        </div>
    );
};

export default AdminUsers;
