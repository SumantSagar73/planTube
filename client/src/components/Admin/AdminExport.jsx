import React, { useState } from 'react';
import { Download, Users, BookOpen, Activity, FileText, Calendar } from 'lucide-react';
import adminService from '../../services/adminService';

const EXPORT_TYPES = [
    { id: 'users', label: 'Users', desc: 'All accounts — name, email, role, streak, XP, join date', icon: <Users size={22} />, color: '#6366f1' },
    { id: 'playlists', label: 'Playlists', desc: 'All imported playlists with creator and YouTube ID', icon: <BookOpen size={22} />, color: '#22c55e' },
    { id: 'activity', label: 'Study Activity', desc: 'Daily study seconds per user — full history', icon: <Activity size={22} />, color: '#f59e0b' },
    { id: 'audit', label: 'Audit Logs', desc: 'All admin actions with actor, target, and IP', icon: <FileText size={22} />, color: '#ec4899' },
];

const AdminExport = ({ notify }) => {
    const [selected, setSelected] = useState('users');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            await adminService.bulkExport(selected, { dateFrom, dateTo });
            notify?.(`${selected} export downloaded`, 'success');
        } catch {
            notify?.('Export failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const active = EXPORT_TYPES.find(t => t.id === selected);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>Data Export Centre</h2>
                <p style={{ color: 'var(--text-muted)' }}>Download any dataset as CSV for analysis or compliance</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {EXPORT_TYPES.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSelected(t.id)}
                        className="glass-card"
                        style={{
                            padding: '1.4rem', borderRadius: 20, border: `2px solid ${selected === t.id ? t.color : 'transparent'}`,
                            background: selected === t.id ? `${t.color}0d` : 'rgba(255,255,255,0.03)',
                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        }}
                    >
                        <div style={{ color: t.color, marginBottom: '0.75rem' }}>{t.icon}</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{t.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.desc}</div>
                    </button>
                ))}
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="#6366f1" /> Date Range (optional)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>From</label>
                        <input type="date" className="styled-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>To</label>
                        <input type="date" className="styled-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn-primary"
                        onClick={handleExport}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', borderRadius: 14, fontSize: '0.88rem' }}
                    >
                        <Download size={16} /> {loading ? 'Exporting...' : `Export ${active?.label || ''} CSV`}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        Leave date range empty to export all records. Large exports may take a moment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminExport;
