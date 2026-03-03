import { useState } from 'react';
import { Flame, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

const FocusPulseHeatmap = ({ data, streak }) => {
    const [viewDate, setViewDate] = useState(new Date());

    // Map heatmap data to a quickly accessible object { 'YYYY-MM-DD': seconds }
    const activityMap = (data || []).reduce((acc, curr) => {
        acc[curr.date] = curr.seconds;
        return acc;
    }, {});

    const getDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= lastDate; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const getIntensity = (seconds) => {
        if (!seconds) return 0;
        if (seconds < 600) return 1; // < 10 mins
        if (seconds < 1800) return 2; // < 30 mins
        if (seconds < 3600) return 3; // < 1 hour
        return 4; // > 1 hour
    };

    const COLORS = [
        'rgba(255,255,255,0.03)', // 0: None
        'rgba(99, 102, 241, 0.2)', // 1: Low
        'rgba(99, 102, 241, 0.4)', // 2: Mid
        'rgba(99, 102, 241, 0.7)', // 3: High
        'var(--primary)',         // 4: Max
    ];

    return (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '28px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flame size={20} fill="#f59e0b" color="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Study Streak</p>
                        <h4 style={{ fontSize: '1rem', fontWeight: '900', color: '#f59e0b' }}>{streak} Days</h4>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'white' }}>
                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                        <button onClick={() => changeMonth(-1)} className="icon-btn-deck" style={{ padding: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><ChevronLeft size={16} /></button>
                        <button onClick={() => changeMonth(1)} className="icon-btn-deck" style={{ padding: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><ChevronRightIcon size={16} /></button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginBottom: '4px' }}>{d}</span>
                ))}
                {getDays().map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} />;

                    const dateStr = date.toISOString().split('T')[0];
                    const seconds = activityMap[dateStr] || 0;
                    const intensity = getIntensity(seconds);

                    return (
                        <div key={i}
                            title={seconds > 0 ? `${Math.round(seconds / 60)} mins on ${dateStr}` : `No activity on ${dateStr}`}
                            style={{
                                aspectRatio: '1/1', borderRadius: '6px',
                                background: COLORS[intensity],
                                border: intensity > 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.02)',
                                transition: 'all 0.2s',
                                cursor: seconds > 0 ? 'pointer' : 'default',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (intensity > 0) e.currentTarget.style.transform = 'scale(1.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        />
                    );
                })}
            </div>

            <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Focus Intensity</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginRight: '4px' }}>Less</span>
                    {COLORS.map((c, i) => (
                        <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} />
                    ))}
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '4px' }}>More</span>
                </div>
            </div>
        </div>
    );
};

export default FocusPulseHeatmap;
