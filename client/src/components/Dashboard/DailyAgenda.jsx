import { Check, Play, Clock, ListChecks } from 'lucide-react';

const DailyAgenda = ({ todayTasks, completedTodayCount, progressPercent, navigate }) => (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '28px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ListChecks size={20} color="var(--accent)" />
                    </div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)' }}>Daily Agenda</h2>
                </div>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                        <circle cx="25" cy="25" r="22" fill="none" stroke="var(--glass-border)" strokeWidth="4" />
                        <circle cx="25" cy="25" r="22" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray={`${Math.PI * 44}`} strokeDashoffset={`${Math.PI * 44 * (1 - progressPercent / 100)}`} style={{ transition: 'stroke-dashoffset 1s ease' }} strokeLinecap="round" />
                    </svg>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{Math.round(progressPercent)}%</span>
                </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
                {completedTodayCount} / {todayTasks.length} Done Today
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {todayTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                        <Check size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>All caught up!</p>
                        <p style={{ fontSize: '0.9rem' }}>No sessions scheduled for today.</p>
                    </div>
                ) : (
                    todayTasks.map((t) => (
                        <div key={t._id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem', background: t.status === 'completed' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)',
                            borderRadius: '16px', border: t.status === 'completed' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.2s', opacity: t.status === 'completed' ? 0.7 : 1
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                                <button
                                    onClick={() => navigate(`/focus/${t.videoId?._id}`)}
                                    className="icon-btn-deck"
                                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: t.status === 'completed' ? '#22c55e' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                                >
                                    {t.status === 'completed' ? <Check size={20} /> : <Play size={20} fill="currentColor" />}
                                </button>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    <p style={{ fontWeight: '700', fontSize: '0.95rem', color: t.status === 'completed' ? '#22c55e' : 'white', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {t.videoId?.title || 'Unknown Video'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={12} /> {t.videoId?.duration || '00:00'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </aside>
);

export default DailyAgenda;
