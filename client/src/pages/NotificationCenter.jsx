import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Filter, MailOpen, BellRing, Archive, Megaphone } from 'lucide-react';
import notificationService from '../services/notificationService';
import LoadingScreen from '../components/Shared/LoadingScreen';

const tabs = [
    { id: 'all', label: 'All', icon: BellRing },
    { id: 'unread', label: 'Unread', icon: MailOpen },
    { id: 'admin', label: 'Admin', icon: Megaphone },
    { id: 'achievement', label: 'Achievements', icon: CheckCheck },
    { id: 'social', label: 'Social', icon: Filter },
    { id: 'reminder', label: 'Reminders', icon: Archive },
    { id: 'system', label: 'System', icon: BellRing }
];

const NotificationCenter = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [page, setPage] = useState(1);

    const load = async () => {
        setLoading(true);
        try {
            const res = await notificationService.getNotifications({
                page,
                limit: 20,
                category: activeTab === 'all' || activeTab === 'unread' ? '' : activeTab,
                unreadOnly: activeTab === 'unread' ? 'true' : 'false'
            });
            setItems(res.items || []);
            setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        } catch (err) {
            console.error('Load notifications failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [activeTab, page]);

    const markAllRead = async () => {
        await notificationService.markAllRead();
        load();
    };

    const markRead = async (id) => {
        await notificationService.markRead(id);
        load();
    };

    const archive = async (id) => {
        await notificationService.archive(id);
        load();
    };

    if (loading && items.length === 0) return <LoadingScreen message="Opening notifications..." />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-1.5px' }}>Notification Center</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{pagination.total} total notifications</p>
                </div>
                <button className="btn-secondary" onClick={markAllRead}>
                    <CheckCheck size={14} style={{ marginRight: 6 }} /> Mark all read
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className="btn-secondary"
                            onClick={() => { setActiveTab(tab.id); setPage(1); }}
                            style={activeTab === tab.id ? { borderColor: 'rgba(99,102,241,0.85)', color: '#818cf8' } : undefined}
                        >
                            <Icon size={14} style={{ marginRight: 6 }} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.length === 0 && !loading && (
                    <div className="glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '20px' }}>
                        No notifications found for this filter.
                    </div>
                )}

                {items.map((item) => (
                    <div key={item._id} className="glass" style={{ padding: '1rem', borderRadius: '18px', border: item.isRead ? '1px solid var(--glass-border)' : '1px solid rgba(99,102,241,0.35)', background: item.isRead ? 'var(--bg-card)' : 'rgba(99,102,241,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                                    <strong style={{ fontSize: '1rem' }}>{item.title}</strong>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.category}</span>
                                    {!item.isRead && <span style={{ fontSize: '0.68rem', background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '0.15rem 0.5rem' }}>New</span>}
                                </div>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.6rem' }}>{item.message}</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0 }}>
                                {!item.isRead && <button className="btn-secondary" onClick={() => markRead(item._id)}>Read</button>}
                                <button className="btn-secondary" onClick={() => archive(item._id)}>
                                    <Archive size={14} style={{ marginRight: 6 }} /> Archive
                                </button>
                            </div>
                        </div>
                        {item.link && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <Link to={item.link} className="btn-primary" style={{ display: 'inline-flex' }}>
                                    Open
                                </Link>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Page {pagination.page} of {pagination.totalPages}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Previous</button>
                    <button className="btn-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}>Next</button>
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
