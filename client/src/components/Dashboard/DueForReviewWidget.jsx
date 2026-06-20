import { useState, useEffect } from 'react';
import { Brain, ChevronRight, Check, X, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const QualityBtn = ({ label, q, onClick, color }) => (
    <button onClick={() => onClick(q)} style={{
        flex: 1, padding: '6px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: `${color}22`, color, fontWeight: 700, fontSize: '0.72rem',
        transition: 'background 0.15s'
    }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}44`}
        onMouseLeave={e => e.currentTarget.style.background = `${color}22`}
    >{label}</button>
);

const DueForReviewWidget = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [reviewing, setReviewing] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        fetch();
    }, []);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await api.get('/schedules/due-for-review');
            setItems(res.data || []);
            setCurrent(0);
            setDone(false);
        } catch {}
        finally { setLoading(false); }
    };

    const submitReview = async (quality) => {
        if (reviewing) return;
        setReviewing(true);
        try {
            await api.post(`/schedules/${items[current]._id}/review`, { quality });
            if (current + 1 >= items.length) {
                setDone(true);
            } else {
                setCurrent(c => c + 1);
            }
        } catch {}
        finally { setReviewing(false); }
    };

    if (loading) return null;
    if (items.length === 0) return null;

    const item = items[current];

    return (
        <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: '16px', padding: '1.25rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Brain size={18} color="#8b5cf6" />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>Spaced Repetition</span>
                    <span style={{
                        background: 'rgba(139,92,246,0.2)', color: '#a78bfa',
                        borderRadius: '20px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 800
                    }}>{items.length} due</span>
                </div>
                <button onClick={fetch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {done ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <Check size={28} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontWeight: 700, color: '#10b981', fontSize: '0.88rem' }}>All caught up!</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>Great work on today's reviews.</p>
                </div>
            ) : (
                <>
                    {/* Card */}
                    <div style={{
                        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                        borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem'
                    }}>
                        <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {current + 1} / {items.length}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.playlist?.playlistTitle || 'Playlist'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {item.video?.title || 'Video'}
                        </div>
                        <button
                            onClick={() => navigate(`/focus/${item.video?._id || item._id}`)}
                            style={{
                                marginTop: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                fontSize: '0.72rem', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0
                            }}
                        >
                            <ChevronRight size={13} /> Open in Focus
                        </button>
                    </div>

                    {/* Quality rating */}
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>How well did you remember it?</p>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <QualityBtn label="Blank" q={1} onClick={submitReview} color="#ef4444" />
                        <QualityBtn label="Hard" q={2} onClick={submitReview} color="#f97316" />
                        <QualityBtn label="OK" q={3} onClick={submitReview} color="#f59e0b" />
                        <QualityBtn label="Good" q={4} onClick={submitReview} color="#22c55e" />
                        <QualityBtn label="Easy" q={5} onClick={submitReview} color="#10b981" />
                    </div>
                </>
            )}
        </div>
    );
};

export default DueForReviewWidget;
