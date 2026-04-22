import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    Coffee, 
    Zap, 
    Volume2, 
    Eye, 
    EyeOff, 
    Play, 
    Pause, 
    RefreshCw,
    Wind,
    CloudRain,
    Waves,
    Trees
} from 'lucide-react';

const FocusLeftRail = ({
    isMonkMode,
    setIsMonkMode,
    pomodoro,
    setPomodoro,
    ambientSound,
    setAmbientSound,
    glassBlur,
    accentColor
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSounds, setShowSounds] = useState(false);

    const toggleTimer = () => {
        setPomodoro(prev => ({ ...prev, isActive: !prev.isActive }));
    };

    const resetTimer = () => {
        const resetSeconds = pomodoro.mode === 'focus' ? 25 * 60 : (pomodoro.mode === 'shortBreak' ? 5 * 60 : 15 * 60);
        setPomodoro(prev => ({ ...prev, isActive: false, secondsLeft: resetSeconds }));
    };

    const switchMode = (mode) => {
        const seconds = mode === 'focus' ? 25 * 60 : (mode === 'shortBreak' ? 5 * 60 : 15 * 60);
        setPomodoro({ mode, secondsLeft: seconds, isActive: false });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const soundscapes = [
        { id: 'none', name: 'None', icon: <Volume2 size={16} />, color: 'rgba(255,255,255,0.4)' },
        { id: 'rain', name: 'Rain', icon: <CloudRain size={16} />, color: '#60a5fa' },
        { id: 'lofi', name: 'Lo-Fi', icon: <Wind size={16} />, color: '#f472b6' },
        { id: 'waves', name: 'Waves', icon: <Waves size={16} />, color: '#2dd4bf' },
        { id: 'forest', name: 'Forest', icon: <Trees size={16} />, color: '#4ade80' },
    ];

    return (
        <div 
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => { setIsExpanded(false); setShowSounds(false); }}
            style={{
                position: 'fixed',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000, // Top priority
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                pointerEvents: 'auto', // Enable hit-area
                paddingRight: '200px', // Hit area buffer
                marginLeft: '-10px', // Slight overlap with edge
            }}
        >
            {/* Main Rail */}
            <div 
                className="glass"
                style={{
                    width: isExpanded ? '64px' : '20px', // Slightly wider handle
                    height: isMonkMode ? '220px' : '280px',
                    borderRadius: '0 20px 20px 0',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderLeft: '4px solid var(--primary)', // Visual indicator
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                    overflow: 'hidden',
                    boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
                    backdropFilter: `blur(${glassBlur}px)`,
                    pointerEvents: 'auto'
                }}
            >
                {isExpanded && (
                    <>
                        {/* Monk Mode Toggle */}
                        <button 
                            onClick={() => setIsMonkMode(!isMonkMode)}
                            className={`rail-btn ${isMonkMode ? 'active' : ''}`}
                            title={isMonkMode ? "Exit Monk Mode" : "Enter Monk Mode"}
                            style={{ color: isMonkMode ? accentColor : 'white' }}
                        >
                            {isMonkMode ? <EyeOff size={22} /> : <Eye size={22} />}
                        </button>

                        {/* Pomodoro Indicator */}
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div 
                                onClick={toggleTimer}
                                className={`rail-timer-circle ${pomodoro.isActive ? 'playing' : ''}`}
                                style={{ 
                                    borderColor: pomodoro.mode === 'focus' ? accentColor : '#4ade80',
                                    cursor: 'pointer'
                                }}
                            >
                                {pomodoro.isActive ? <Pause size={12} /> : <Play size={12} style={{marginLeft: '2px'}} />}
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '800', marginTop: '4px', opacity: 0.7 }}>
                                {formatTime(pomodoro.secondsLeft)}
                            </span>
                        </div>

                        {/* Soundscape Selector */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowSounds(!showSounds); }}
                            className={`rail-btn ${ambientSound !== 'none' ? 'active' : ''}`}
                            title="Ambient Soundscapes"
                            style={{ color: ambientSound !== 'none' ? accentColor : 'white' }}
                        >
                            <Volume2 size={22} />
                        </button>

                        {/* Reset / Settings */}
                        <button 
                            onClick={resetTimer}
                            className="rail-btn"
                            title="Reset Timer"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Sound Flyout */}
            {isExpanded && showSounds && (
                <div 
                    className="glass"
                    style={{
                        marginLeft: '1rem',
                        padding: '0.75rem',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        pointerEvents: 'auto',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        animation: 'fadeInLeft 0.3s ease',
                        backdropFilter: `blur(${glassBlur}px)`
                    }}
                >
                    {soundscapes.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setAmbientSound(s.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: ambientSound === s.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: ambientSound === s.id ? s.color : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                width: '120px'
                            }}
                        >
                            {s.icon}
                            <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{s.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Timer Flyout (Modes) */}
            {isExpanded && !showSounds && !isMonkMode && (
                <div 
                    className="glass"
                    style={{
                        marginLeft: '1rem',
                        padding: '0.5rem',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        pointerEvents: 'auto',
                        border: '1px solid rgba(255,255,255,0.1)',
                        animation: 'fadeInLeft 0.3s ease'
                    }}
                >
                    {['focus', 'shortBreak', 'longBreak'].map(m => (
                        <button
                            key={m}
                            onClick={() => switchMode(m)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: pomodoro.mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: pomodoro.mode === m ? accentColor : 'rgba(255,255,255,0.4)',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {m.replace(/([A-Z])/g, ' $1')}
                        </button>
                    ))}
                </div>
            )}

            <style>{`
                .rail-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .rail-btn:hover, .rail-btn.active {
                    opacity: 1;
                    transform: scale(1.1);
                }
                .rail-timer-circle {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }
                .rail-timer-circle.playing {
                    animation: pulse-border 2s infinite;
                }
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.2); }
                    70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
                    100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
                }
                @keyframes fadeInLeft {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default FocusLeftRail;
