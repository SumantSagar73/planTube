import { useState, useEffect } from 'react';
import { Target, ChevronDown, Check } from 'lucide-react';
import api from '../../services/api';

const RING_R = 36;
const RING_CIRC = 2 * Math.PI * RING_R;

const WeeklyGoalWidget = () => {
    const [goal, setGoal] = useState(null);      // { type, target }
    const [progress, setProgress] = useState(null); // { current, percentage }
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ type: 'hours', target: 5 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchGoal();
    }, []);

    const fetchGoal = async () => {
        try {
            const [profileRes, progressRes] = await Promise.all([
                api.get('/users/preferences'),
                api.get('/users/weekly-progress')
            ]);
            if (profileRes.data?.weeklyGoal?.target) {
                setGoal(profileRes.data.weeklyGoal);
                setForm({
                    type: profileRes.data.weeklyGoal.type,
                    target: profileRes.data.weeklyGoal.target
                });
            } else {
                setEditing(true);
            }
            setProgress(progressRes.data);
        } catch {}
    };

    const saveGoal = async () => {
        setSaving(true);
        try {
            await api.put('/users/weekly-goal', form);
            setGoal({ ...form });
            setEditing(false);
            const res = await api.get('/users/weekly-progress');
            setProgress(res.data);
        } catch {}
        finally { setSaving(false); }
    };

    const pct = Math.min(100, progress?.percentage || 0);
    const dashOffset = RING_CIRC * (1 - pct / 100);
    const done = pct >= 100;

    return (
        <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
            borderRadius: '16px', padding: '1.25rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Target size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>Weekly Goal</span>
                </div>
                {!editing && (
                    <button onClick={() => setEditing(true)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.72rem', color: 'var(--text-muted)',
                        padding: '2px 6px', borderRadius: '6px'
                    }}>
                        Edit
                    </button>
                )}
            </div>

            {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['hours', 'videos'].map(t => (
                            <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                                flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '0.78rem',
                                background: form.type === t ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: form.type === t ? 'white' : 'var(--text-muted)'
                            }}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="number"
                            min={1}
                            max={form.type === 'hours' ? 168 : 500}
                            value={form.target}
                            onChange={e => setForm(f => ({ ...f, target: Number(e.target.value) }))}
                            className="styled-input"
                            style={{ flex: 1 }}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {form.type === 'hours' ? 'hrs/week' : 'videos/week'}
                        </span>
                    </div>
                    <button onClick={saveGoal} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}>
                        {saving ? 'Saving...' : <><Check size={14} style={{ marginRight: 4 }} />Set Goal</>}
                    </button>
                </div>
            ) : goal ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Circular progress ring */}
                    <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
                        <circle cx="44" cy="44" r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                        <circle
                            cx="44" cy="44" r={RING_R} fill="none"
                            stroke={done ? '#10b981' : 'var(--primary)'}
                            strokeWidth="7" strokeLinecap="round"
                            strokeDasharray={RING_CIRC}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 44 44)"
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                        <text x="44" y="47" textAnchor="middle" fill={done ? '#10b981' : 'white'} fontSize="13" fontWeight="800">
                            {Math.round(pct)}%
                        </text>
                    </svg>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: done ? '#10b981' : 'var(--text-main)' }}>
                            {done ? 'Goal reached! 🎉' : `${progress?.current || 0} / ${goal.target} ${goal.type}`}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {goal.type === 'hours' ? 'hours focused this week' : 'videos completed this week'}
                        </div>
                        {!done && (
                            <div style={{ marginTop: '8px', height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 0.6s' }} />
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default WeeklyGoalWidget;
