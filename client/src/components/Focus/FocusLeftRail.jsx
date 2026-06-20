import React, { useState } from 'react';
import {
    Clock, Coffee, Zap, Volume2,
    Play, Pause, RefreshCw, Wind, CloudRain, Waves, Trees,
    Settings
} from 'lucide-react';

const FocusLeftRail = ({
    pomodoro, setPomodoro,
    pomodoroSessions, pomodoroSettings, setPomodoroSettings,
    ambientSound, setAmbientSound,
    glassBlur, accentColor
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSounds, setShowSounds] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const cfg = pomodoroSettings || { focusMins: 25, shortBreakMins: 5, longBreakMins: 15 };

    const toggleTimer = () => setPomodoro(prev => ({ ...prev, isActive: !prev.isActive }));

    const resetTimer = () => {
        const secs = pomodoro.mode === 'focus'
            ? cfg.focusMins * 60
            : pomodoro.mode === 'shortBreak'
                ? cfg.shortBreakMins * 60
                : cfg.longBreakMins * 60;
        setPomodoro(prev => ({ ...prev, isActive: false, secondsLeft: secs }));
    };

    const switchMode = (mode) => {
        const secs = mode === 'focus'
            ? cfg.focusMins * 60
            : mode === 'shortBreak'
                ? cfg.shortBreakMins * 60
                : cfg.longBreakMins * 60;
        setPomodoro({ mode, secondsLeft: secs, isActive: false });
    };

    const updateSetting = (key, val) => {
        const n = Math.max(1, Math.min(90, parseInt(val) || 1));
        const next = { ...cfg, [key]: n };
        setPomodoroSettings(next);
        // If current mode matches, reset timer to new duration
        if (
            (key === 'focusMins' && pomodoro.mode === 'focus') ||
            (key === 'shortBreakMins' && pomodoro.mode === 'shortBreak') ||
            (key === 'longBreakMins' && pomodoro.mode === 'longBreak')
        ) {
            setPomodoro(prev => ({ ...prev, isActive: false, secondsLeft: n * 60 }));
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = (() => {
        const total = pomodoro.mode === 'focus'
            ? cfg.focusMins * 60
            : pomodoro.mode === 'shortBreak'
                ? cfg.shortBreakMins * 60
                : cfg.longBreakMins * 60;
        return total > 0 ? 1 - pomodoro.secondsLeft / total : 0;
    })();

    // SVG ring for timer
    const R = 14, C = 2 * Math.PI * R;
    const strokeDash = C * progress;

    const modeColor = pomodoro.mode === 'focus' ? accentColor : '#4ade80';

    const soundscapes = [
        { id: 'none', name: 'None', icon: <Volume2 size={14} />, color: 'rgba(255,255,255,0.4)' },
        { id: 'rain', name: 'Rain', icon: <CloudRain size={14} />, color: '#60a5fa' },
        { id: 'lofi', name: 'Lo-Fi', icon: <Wind size={14} />, color: '#f472b6' },
        { id: 'waves', name: 'Waves', icon: <Waves size={14} />, color: '#2dd4bf' },
        { id: 'forest', name: 'Forest', icon: <Trees size={14} />, color: '#4ade80' },
    ];

    const completedFull = Math.floor(pomodoroSessions / 4);
    const completedPartial = pomodoroSessions % 4;

    return (
        <div
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => { setIsExpanded(false); setShowSounds(false); setShowSettings(false); }}
            style={{
                position: 'fixed', left: 0, top: '50%',
                transform: 'translateY(-50%)', zIndex: 1000,
                display: 'flex', flexDirection: 'row', alignItems: 'center',
                pointerEvents: 'auto', paddingRight: '220px', marginLeft: '-10px',
            }}
        >
            {/* Main Rail */}
            <div
                className="glass"
                style={{
                    width: isExpanded ? '66px' : '20px',
                    height: '260px',
                    borderRadius: '0 20px 20px 0',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderLeft: `4px solid ${modeColor}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: '1.2rem',
                    transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                    overflow: 'hidden',
                    boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
                    backdropFilter: `blur(${glassBlur}px)`,
                    pointerEvents: 'auto'
                }}
            >
                {isExpanded && (
                    <>
                        {/* Timer ring + time */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ position: 'relative', width: '36px', height: '36px', cursor: 'pointer' }} onClick={toggleTimer}>
                                <svg width="36" height="36" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                                    <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                                    <circle
                                        cx="18" cy="18" r={R} fill="none"
                                        stroke={modeColor} strokeWidth="2.5"
                                        strokeDasharray={`${strokeDash} ${C}`}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dasharray 1s linear' }}
                                    />
                                </svg>
                                <div style={{
                                    position: 'absolute', inset: 0, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {pomodoro.isActive
                                        ? <Pause size={11} color="white" />
                                        : <Play size={11} color="white" style={{ marginLeft: '2px' }} />}
                                </div>
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: 800, opacity: 0.75, letterSpacing: '0.5px' }}>
                                {formatTime(pomodoro.secondsLeft)}
                            </span>
                            {/* Session dots: 4 dots per round */}
                            <div style={{ display: 'flex', gap: '2px', marginTop: '1px' }}>
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} style={{
                                        width: '5px', height: '5px', borderRadius: '50%',
                                        background: i < completedPartial ? modeColor : 'rgba(255,255,255,0.2)',
                                        transition: 'background 0.3s'
                                    }} />
                                ))}
                            </div>
                            {completedFull > 0 && (
                                <span style={{ fontSize: '8px', opacity: 0.5 }}>×{completedFull}</span>
                            )}
                        </div>

                        {/* Soundscape */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSounds(!showSounds); setShowSettings(false); }}
                            className={`rail-btn ${ambientSound !== 'none' ? 'active' : ''}`}
                            title="Ambient Soundscapes"
                            style={{ color: ambientSound !== 'none' ? accentColor : 'white' }}
                        >
                            <Volume2 size={20} />
                        </button>

                        {/* Settings */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowSounds(false); }}
                            className={`rail-btn ${showSettings ? 'active' : ''}`}
                            title="Timer Settings"
                            style={{ color: showSettings ? accentColor : 'white' }}
                        >
                            <Settings size={18} />
                        </button>

                        {/* Reset */}
                        <button onClick={resetTimer} className="rail-btn" title="Reset Timer">
                            <RefreshCw size={16} />
                        </button>
                    </>
                )}
            </div>

            {/* Mode Flyout */}
            {isExpanded && !showSounds && !showSettings && (
                <div className="glass" style={{
                    marginLeft: '0.75rem', padding: '0.5rem', borderRadius: '14px',
                    display: 'flex', flexDirection: 'column', gap: '0.2rem',
                    pointerEvents: 'auto', border: '1px solid rgba(255,255,255,0.1)',
                    animation: 'fadeInLeft 0.25s ease', backdropFilter: `blur(${glassBlur}px)`
                }}>
                    {[
                        { id: 'focus', label: 'Focus', mins: cfg.focusMins, icon: <Zap size={11} /> },
                        { id: 'shortBreak', label: 'Short Break', mins: cfg.shortBreakMins, icon: <Coffee size={11} /> },
                        { id: 'longBreak', label: 'Long Break', mins: cfg.longBreakMins, icon: <Clock size={11} /> },
                    ].map(m => (
                        <button key={m.id} onClick={() => switchMode(m.id)} style={{
                            padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none',
                            background: pomodoro.mode === m.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                            color: pomodoro.mode === m.id ? modeColor : 'rgba(255,255,255,0.45)',
                            fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap'
                        }}>
                            {m.icon} {m.label} <span style={{ opacity: 0.5 }}>{m.mins}m</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Sound Flyout */}
            {isExpanded && showSounds && (
                <div className="glass" style={{
                    marginLeft: '0.75rem', padding: '0.6rem', borderRadius: '14px',
                    display: 'flex', flexDirection: 'column', gap: '0.35rem',
                    pointerEvents: 'auto', border: '1px solid rgba(255,255,255,0.1)',
                    animation: 'fadeInLeft 0.25s ease', backdropFilter: `blur(${glassBlur}px)`
                }}>
                    {soundscapes.map(s => (
                        <button key={s.id} onClick={() => setAmbientSound(s.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none',
                            background: ambientSound === s.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: ambientSound === s.id ? s.color : 'rgba(255,255,255,0.55)',
                            cursor: 'pointer', transition: 'all 0.2s', width: '110px'
                        }}>
                            {s.icon}
                            <span style={{ fontSize: '0.73rem', fontWeight: 700 }}>{s.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Settings Flyout */}
            {isExpanded && showSettings && (
                <div className="glass" style={{
                    marginLeft: '0.75rem', padding: '0.8rem', borderRadius: '14px',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                    pointerEvents: 'auto', border: '1px solid rgba(255,255,255,0.1)',
                    animation: 'fadeInLeft 0.25s ease', backdropFilter: `blur(${glassBlur}px)`, minWidth: '160px'
                }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.5, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'white' }}>Timer Settings</span>
                    {[
                        { key: 'focusMins', label: 'Focus', color: accentColor },
                        { key: 'shortBreakMins', label: 'Short Break', color: '#4ade80' },
                        { key: 'longBreakMins', label: 'Long Break', color: '#60a5fa' },
                    ].map(({ key, label, color }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', flex: 1 }}>{label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <button
                                    onClick={() => updateSetting(key, (cfg[key] || 1) - 1)}
                                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >−</button>
                                <span style={{ color, fontWeight: 800, fontSize: '0.78rem', minWidth: '22px', textAlign: 'center' }}>
                                    {cfg[key]}m
                                </span>
                                <button
                                    onClick={() => updateSetting(key, (cfg[key] || 1) + 1)}
                                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >+</button>
                            </div>
                        </div>
                    ))}
                    {pomodoroSessions > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                            {pomodoroSessions} session{pomodoroSessions !== 1 ? 's' : ''} completed today
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .rail-btn {
                    background: none; border: none; color: white; cursor: pointer;
                    opacity: 0.55; transition: all 0.25s;
                    display: flex; align-items: center; justify-content: center;
                    padding: 4px;
                }
                .rail-btn:hover, .rail-btn.active { opacity: 1; transform: scale(1.1); }
                @keyframes fadeInLeft {
                    from { opacity: 0; transform: translateX(-8px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default FocusLeftRail;
