import React, { useEffect, useMemo, useState } from 'react';
import { Send, Megaphone, Users, Star, Search, X, UserPlus, UsersRound, User } from 'lucide-react';
import adminService from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { formatDateTime } from '../../utils/dateTime';

const AdminNotifications = ({ notify }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('high');
    const [category, setCategory] = useState('admin');
    const [audience, setAudience] = useState('all');
    const [recipientSearch, setRecipientSearch] = useState('');
    const [recipientResults, setRecipientResults] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [sending, setSending] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await notificationService.getAdminHistory({ page: historyPage, limit: 20 });
            setHistoryItems(res.items || []);
            setHistoryPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        } catch (err) {
            console.error('History load failed:', err);
            notify?.(err?.response?.data?.msg || 'Could not load notification history', 'error');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [historyPage]);

    useEffect(() => {
        if (audience === 'all') return;

        const timer = setTimeout(async () => {
            if (!recipientSearch.trim()) {
                setRecipientResults([]);
                return;
            }

            setLoadingRecipients(true);
            try {
                const res = await adminService.getUsers({ q: recipientSearch.trim(), limit: 10, page: 1 });
                setRecipientResults(res.items || []);
            } catch (err) {
                console.error('Recipient search failed:', err);
                setRecipientResults([]);
            } finally {
                setLoadingRecipients(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [audience, recipientSearch]);

    const selectedBulkUsers = useMemo(
        () => recipientResults.filter((user) => selectedUserIds.includes(user._id)),
        [recipientResults, selectedUserIds]
    );

    const toggleBulkUser = (userId) => {
        setSelectedUserIds((current) => (
            current.includes(userId)
                ? current.filter((id) => id !== userId)
                : [...current, userId]
        ));
    };

    const sendBroadcast = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        if (audience === 'single' && !selectedUserId) {
            notify?.('Choose a user to send to.', 'error');
            return;
        }

        if (audience === 'users' && selectedUserIds.length === 0) {
            notify?.('Select at least one user to send to.', 'error');
            return;
        }

        setSending(true);
        try {
            const res = await notificationService.broadcastAdmin({
                title,
                message,
                category,
                priority,
                audience,
                userId: audience === 'single' ? selectedUserId : undefined,
                userIds: audience === 'users' ? selectedUserIds : undefined
            });
            notify?.(`Broadcast sent to ${res.sentCount || 0} users`, 'success');
            setTitle('');
            setMessage('');
            setAudience('all');
            setRecipientSearch('');
            setRecipientResults([]);
            setSelectedUserId('');
            setSelectedUserIds([]);
            setHistoryPage(1);
            loadHistory();
        } catch (err) {
            notify?.(err?.response?.data?.msg || 'Failed to send broadcast', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="admin-notifications-page" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '900px' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>Notifications</h2>
                <p style={{ color: 'var(--text-muted)' }}>Broadcast admin messages and important updates to all users instantly.</p>
            </div>

            <form onSubmit={sendBroadcast} className="glass" style={{ padding: '1.25rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="admin-filters-grid-two">
                    <div>
                        <label className="input-label">Title</label>
                        <input className="styled-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Maintenance tonight" />
                    </div>
                    <div>
                        <label className="input-label">Category</label>
                        <select className="styled-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="admin">Admin</option>
                            <option value="system">System</option>
                            <option value="reminder">Reminder</option>
                            <option value="achievement">Achievement</option>
                            <option value="social">Social</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="input-label">Audience</label>
                    <select className="styled-input" value={audience} onChange={(e) => setAudience(e.target.value)}>
                        <option value="all">All Users</option>
                        <option value="single">Single User</option>
                        <option value="users">Selected Users</option>
                    </select>
                </div>

                {audience === 'single' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label className="input-label">Find user</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                <input
                                    className="styled-input"
                                    value={recipientSearch}
                                    onChange={(e) => setRecipientSearch(e.target.value)}
                                    placeholder="Search by name, username, or email"
                                    style={{ paddingLeft: '2rem' }}
                                />
                            </div>
                        </div>

                        {recipientSearch && (
                            <div className="glass" style={{ padding: '0.75rem', borderRadius: '16px', display: 'grid', gap: '0.45rem' }}>
                                {loadingRecipients && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Searching users...</div>}
                                {!loadingRecipients && recipientResults.length === 0 && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching users found.</div>
                                )}
                                {recipientResults.map((user) => (
                                    <button
                                        key={user._id}
                                        type="button"
                                        onClick={() => setSelectedUserId(user._id)}
                                        className="glass-hover"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '0.75rem',
                                            padding: '0.7rem 0.85rem',
                                            borderRadius: '12px',
                                            border: selectedUserId === user._id ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.06)',
                                            background: selectedUserId === user._id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                            color: 'white',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 800 }}>{user.name}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{user.username} · {user.email}</div>
                                        </div>
                                        <User size={16} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedUserId && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="btn-secondary" style={{ pointerEvents: 'none' }}>
                                    <User size={14} style={{ marginRight: 6 }} /> Selected user
                                </span>
                                <button type="button" className="icon-btn-deck" onClick={() => setSelectedUserId('')} aria-label="Clear selected user">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {audience === 'users' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label className="input-label">Search and pick users</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                <input
                                    className="styled-input"
                                    value={recipientSearch}
                                    onChange={(e) => setRecipientSearch(e.target.value)}
                                    placeholder="Search users to add to the bulk list"
                                    style={{ paddingLeft: '2rem' }}
                                />
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '0.75rem', borderRadius: '16px', display: 'grid', gap: '0.45rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                <UsersRound size={14} /> Pick one or more users from the search results.
                            </div>
                            {loadingRecipients && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Searching users...</div>}
                            {!loadingRecipients && recipientResults.length === 0 && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching users found.</div>
                            )}
                            {recipientResults.map((user) => {
                                const selected = selectedUserIds.includes(user._id);
                                return (
                                    <button
                                        key={user._id}
                                        type="button"
                                        onClick={() => toggleBulkUser(user._id)}
                                        className="glass-hover"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '0.75rem',
                                            padding: '0.7rem 0.85rem',
                                            borderRadius: '12px',
                                            border: selected ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.06)',
                                            background: selected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                            color: 'white',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 800 }}>{user.name}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{user.username} · {user.email}</div>
                                        </div>
                                        <UserPlus size={16} style={{ opacity: selected ? 1 : 0.55 }} />
                                    </button>
                                );
                            })}
                        </div>

                        {selectedBulkUsers.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                                {selectedBulkUsers.map((user) => (
                                    <span key={user._id} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Users size={14} /> {user.name}
                                        <button type="button" onClick={() => toggleBulkUser(user._id)} style={{ background: 'none', border: 'none', color: 'inherit', display: 'inline-flex' }}>
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="input-label">Message</label>
                    <textarea className="styled-input" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write the announcement..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="admin-filters-grid-two">
                    <div>
                        <label className="input-label">Priority</label>
                        <select className="styled-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end' }}>
                        <button className="btn-primary" type="submit" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
                            <Send size={16} style={{ marginRight: 6 }} /> {sending ? 'Sending...' : audience === 'all' ? 'Send to All Users' : audience === 'single' ? 'Send to User' : 'Send to Selected Users'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Megaphone size={14} /> Instant delivery</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Users size={14} /> All users, one user, or selected users</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Star size={14} /> Stored in inbox</span>
                </div>
            </form>

            <div className="glass" style={{ padding: '1.25rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900' }}>Delivery History</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Track which notification was sent to which user.
                        </p>
                    </div>
                    <button type="button" className="btn-secondary" onClick={loadHistory} disabled={historyLoading}>
                        Refresh
                    </button>
                </div>

                {historyLoading && historyItems.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>Loading history...</div>
                ) : historyItems.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>No broadcast history yet.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                        {historyItems.map((item) => (
                            <div key={item._id} style={{ border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '0.75rem 0.85rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 800 }}>{item.title}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '0.15rem' }}>{item.message}</div>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}>
                                        {item.priority}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.45rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                    <span>To: {item.recipient?.name || 'Unknown'} ({item.recipient?.email || 'No email'})</span>
                                    <span>•</span>
                                    <span>By: {item.admin?.name || 'Admin'}</span>
                                    <span>•</span>
                                    <span>{formatDateTime(item.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        Page {historyPagination.page} of {historyPagination.totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={historyPage <= 1}
                            onClick={() => setHistoryPage((p) => Math.max(p - 1, 1))}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={historyPage >= historyPagination.totalPages}
                            onClick={() => setHistoryPage((p) => Math.min(p + 1, historyPagination.totalPages))}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
