import { Clock, CheckCircle } from 'lucide-react';

const AgendaPanel = ({ plannedToday, activeDate, formatDate, message }) => (
    <div className="glass playlist-agenda-panel" style={{ padding: '1.5rem', borderRadius: '24px' }}>
        <div className="playlist-agenda-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} /> Agenda
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '800', padding: '0.3rem 0.8rem', background: 'rgba(99,102,241,0.1)', borderRadius: '12px' }}>
                {formatDate(activeDate)}
            </span>
        </div>
        <div className="playlist-agenda-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {plannedToday.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.5 }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🍃</div>
                    <p style={{ fontSize: '0.8rem', fontWeight: '500' }}>No tasks for this day.</p>
                </div>
            ) : (
                plannedToday.map(video => {
                    const isComp = video._scheduleStatus === 'completed';
                    return (
                        <div
                            key={video._id}
                            style={{
                                padding: '0.8rem', fontSize: '0.85rem', display: 'flex', gap: '0.8rem', alignItems: 'center',
                                borderRadius: '16px', background: isComp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                                border: isComp ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--glass-border)',
                                transition: 'all 0.3s'
                            }}
                        >
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                background: isComp ? '#16a34a' : 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '0.7rem', fontWeight: '900', flexShrink: 0
                            }}>
                                {isComp ? <CheckCircle size={14} /> : (video.position + 1)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: '700', lineHeight: '1.2', color: isComp ? '#86efac' : 'inherit' }}>{video.title}</p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{video.duration}</span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
        {message && (
            <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', fontSize: '0.8rem', color: 'white', textAlign: 'center', fontWeight: '700' }}>
                {message}
            </div>
        )}
    </div>
);

export default AgendaPanel;
