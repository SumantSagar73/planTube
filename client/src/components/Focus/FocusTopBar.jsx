import { ChevronLeft, List as ListIcon, Users, Keyboard } from 'lucide-react';

const FocusTopBar = ({ showControls, compactMode, isMobile, video, playlist, presenceCount, navigate, toggleShortcutsHelp }) => (
    <div
        onClick={e => e.stopPropagation()}
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: compactMode ? '0.5rem' : '1.5rem',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            opacity: showControls ? 1 : 0,
            transform: `translateY(${showControls ? '0' : '-100%'})`,
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            zIndex: 30
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', pointerEvents: 'auto' }}>
            <button
                onClick={() => {
                    if (playlist?.playlistId?.startsWith('VIDEO_')) navigate('/library');
                    else navigate(`/playlist/${playlist?._id}`);
                }}
                className="glass-hover"
                style={{
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                <ChevronLeft size={20} />
            </button>
            {!compactMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', maxWidth: isMobile ? '160px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {video.title}
                        </h2>
                        {playlist && !isMobile && (
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ListIcon size={12} /> {playlist.playlistTitle}
                            </p>
                        )}
                    </div>
                    <div
                        className="glass"
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            border: presenceCount > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                            background: presenceCount > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                            transition: 'all 0.3s ease'
                        }}
                        title={`${presenceCount} ${presenceCount === 1 ? 'person' : 'people'} watching this video live`}
                    >
                        <div style={{ position: 'relative' }}>
                            <Users size={16} color={presenceCount > 0 ? '#22c55e' : 'var(--primary)'} />
                            {presenceCount > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: '6px',
                                    height: '6px',
                                    background: '#22c55e',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 8px #22c55e',
                                    animation: 'pulse 2s infinite'
                                }}></div>
                            )}
                        </div>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: presenceCount > 0 ? '#22c55e' : 'white'
                        }}>
                            {presenceCount} {presenceCount === 1 ? 'viewer' : 'viewers'}
                        </span>
                    </div>
                </div>
            )}
        </div>

        {!isMobile && (
            <button
                onClick={toggleShortcutsHelp}
                title="Keyboard Shortcuts"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '0.4rem 0.9rem',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)',
                    letterSpacing: '0.3px',
                    marginTop: '0.15rem',
                    pointerEvents: 'auto'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
                <Keyboard size={13} />
                <kbd style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0 4px', fontSize: '0.7rem' }}>?</kbd>
                <span>shortcuts</span>
            </button>
        )}

    </div>
);

export default FocusTopBar;
