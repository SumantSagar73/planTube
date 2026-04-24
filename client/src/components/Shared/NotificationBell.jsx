import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, MailOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const categoryLabel = {
    admin: 'Admin',
    achievement: 'Achievement',
    social: 'Social',
    reminder: 'Reminder',
    system: 'System'
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadUnreadCount = async () => {
        try {
            const res = await notificationService.getUnreadCount();
            setUnreadCount(res.unreadCount || 0);
        } catch (err) {
            console.error('Unread count failed:', err);
        }
    };

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await notificationService.getNotifications({ limit: 5 });
            setItems(res.items || []);
            setUnreadCount(res.unreadCount || 0);
        } catch (err) {
            console.error('Notification fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        loadUnreadCount();
    }, [user]);

    useEffect(() => {
        if (!user) return undefined;

        const handleNotification = (payload) => {
            setUnreadCount((count) => count + 1);
            setItems((current) => [payload, ...current].slice(0, 5));
        };

        socket.on('notification:new', handleNotification);
        return () => socket.off('notification:new', handleNotification);
    }, [user]);

    useEffect(() => {
        if (open) loadItems();
    }, [open]);

    const handleMarkRead = async (item) => {
        if (item.isRead) return;
        setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, isRead: true } : entry));
        setUnreadCount((count) => Math.max(count - 1, 0));
        try {
            await notificationService.markRead(item._id);
        } catch (err) {
            console.error('Mark notification read failed:', err);
        }
    };

    const handleOpen = async (item) => {
        await handleMarkRead(item);
        setOpen(false);
        if (item.link) navigate(item.link);
    };

    const formattedItems = useMemo(() => items, [items]);

    if (!user) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button
                className="icon-btn-deck"
                onClick={() => setOpen((v) => !v)}
                aria-label="Notifications"
                style={{ position: 'relative' }}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '999px',
                        background: 'var(--danger)',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px'
                    }}>{unreadCount}</span>
                )}
            </button>

            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
                    <div className="glass" style={{
                        position: 'absolute',
                        top: 'calc(100% + 0.6rem)',
                        right: 0,
                        width: '360px',
                        maxWidth: 'calc(100vw - 1rem)',
                        zIndex: 999,
                        padding: '0.9rem',
                        borderRadius: '18px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.35)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.8rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: '900' }}>Notifications</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{unreadCount} unread</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.45rem' }}>
                                <button className="icon-btn-deck" title="Mark all read" onClick={async () => { await notificationService.markAllRead(); setUnreadCount(0); loadItems(); }}>
                                    <CheckCheck size={16} />
                                </button>
                                <Link className="icon-btn-deck" title="Open center" to="/notifications" onClick={() => setOpen(false)}>
                                    <ExternalLink size={16} />
                                </Link>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '420px', overflowY: 'auto' }}>
                            {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}
                            {!loading && formattedItems.length === 0 && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <MailOpen size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                    No notifications yet.
                                </div>
                            )}
                            {formattedItems.map((item) => (
                                <button
                                    key={item._id}
                                    onClick={() => handleOpen(item)}
                                    style={{
                                        textAlign: 'left',
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '14px',
                                        background: item.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.08)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: 'white'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <strong style={{ fontSize: '0.85rem' }}>{item.title}</strong>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{categoryLabel[item.category] || item.category}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.45 }}>{item.message}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
