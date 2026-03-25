import React from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
    { keys: ['Space', 'K'], label: 'Play / Pause' },
    { keys: ['←', 'J'], label: 'Seek back 10s' },
    { keys: ['→', 'L'], label: 'Seek forward 10s' },
    { keys: ['↑'], label: 'Volume up 10%' },
    { keys: ['↓'], label: 'Volume down 10%' },
    { keys: ['M'], label: 'Mute / Unmute' },
    { keys: ['F'], label: 'Fullscreen' },
    { keys: ['Z'], label: 'Zen Mode' },
    { keys: ['C'], label: 'Mark Complete' },
    { keys: ['Shift + N'], label: 'Next video' },
    { keys: ['Shift + P'], label: 'Previous video' },
    { keys: ['P'], label: 'Picture-in-Picture' },
    { keys: ['>'], label: 'Speed up' },
    { keys: ['<'], label: 'Speed down' },
    { keys: ['?'], label: 'Toggle this help' },
];

const KeyboardShortcutsHelp = ({ onClose }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                }}
            />

            {/* Panel */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 201,
                    background: 'rgba(18, 18, 22, 0.95)',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '2rem',
                    width: 'min(520px, 92vw)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
                    color: 'white',
                    animation: 'shortcutsFadeIn 0.2s ease',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Keyboard size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Keyboard Shortcuts</h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Focus Mode controls</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            width: '34px', height: '34px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Shortcut Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem 2rem',
                }}>
                    {SHORTCUTS.map(({ keys, label }) => (
                        <div
                            key={label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.45rem 0',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                {keys.map(k => (
                                    <kbd
                                        key={k}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0.15rem 0.5rem',
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderBottom: '2px solid rgba(255,255,255,0.08)',
                                            borderRadius: '6px',
                                            fontSize: '0.72rem',
                                            fontFamily: 'monospace',
                                            fontWeight: 600,
                                            color: 'rgba(255,255,255,0.85)',
                                            minWidth: '24px',
                                            textAlign: 'center',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {k}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer hint */}
                <p style={{ textAlign: 'center', marginTop: '1.25rem', marginBottom: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
                    Press <kbd style={{ padding: '0.1rem 0.4rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', fontSize: '0.7rem' }}>?</kbd> to close
                </p>
            </div>

            <style>{`
                @keyframes shortcutsFadeIn {
                    from { opacity: 0; transform: translate(-50%, -48%); }
                    to   { opacity: 1; transform: translate(-50%, -50%); }
                }
            `}</style>
        </>
    );
};

export default KeyboardShortcutsHelp;
