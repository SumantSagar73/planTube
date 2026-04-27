import { useEffect, useState } from 'react';
import { Activity, RefreshCw, Users } from 'lucide-react';
import adminService from '../../services/adminService';

const AdminLivePresence = ({ notify }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (silent = false) => {
        silent ? setRefreshing(true) : setLoading(true);
        try {
            const res = await adminService.getLivePresence();
            setItems(res.items || []);
        } catch (err) {
            console.error('Load live presence failed:', err);
            notify?.(err?.response?.data?.msg || 'Failed to load live presence', 'error');
        } finally {
            silent ? setRefreshing(false) : setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const timer = setInterval(() => load(true), 15000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>Live Presence</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Users currently connected to PlanTube.</p>
                </div>
                <button className="btn-secondary" onClick={() => load(true)}>
                    <RefreshCw size={14} style={{ marginRight: 6 }} /> {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="glass" style={{ padding: '1rem', borderRadius: '18px', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <Activity size={16} color="#22c55e" />
                <span style={{ fontWeight: 800 }}>Online users: {items.length}</span>
            </div>

            {loading && items.length === 0 ? (
                <div className="glass" style={{ padding: '1rem', borderRadius: '18px', color: 'var(--text-muted)' }}>Loading live presence...</div>
            ) : items.length === 0 ? (
                <div className="glass" style={{ padding: '1rem', borderRadius: '18px', color: 'var(--text-muted)' }}>No one is currently online.</div>
            ) : (
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {items.map((item) => (
                        <div key={item._id} className="glass" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '14px', background: `${item.themeColor || '#6366f1'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.themeColor || '#6366f1' }}>
                                    <Users size={20} />
                                </div>
                                <div>
                                    <strong style={{ display: 'block' }}>{item.name}</strong>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>@{item.username} • {item.email}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(34,197,94,0.4)', color: '#86efac' }}>
                                    online
                                </span>
                                <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-muted)' }}>
                                    {item.connectionCount} session{item.connectionCount === 1 ? '' : 's'}
                                </span>
                                <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.35)', color: '#c4b5fd' }}>
                                    Level {item.level || 1}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminLivePresence;