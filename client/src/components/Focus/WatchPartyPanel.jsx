import { useState, useEffect, useCallback } from 'react';
import { Users, X, Copy, Check, Play, Pause, LogOut, Radio } from 'lucide-react';
import socket from '../../services/socket';

const REACTIONS = ['👍', '🎉', '🔥', '💡', '😮', '❤️'];

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const WatchPartyPanel = ({ videoId, userId, playerRef, isPlaying, setIsPlaying, embedded = false }) => {
    // When embedded in the sidebar, always show content (no toggle)
    const [open, setOpen] = useState(false);
    const [inRoom, setInRoom] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [memberCount, setMemberCount] = useState(1);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [floatReactions, setFloatReactions] = useState([]); // [{id, emoji}]

    // ── Socket events from server ─────────────────────────────────────────────
    useEffect(() => {
        const onJoined = (data) => {
            setInRoom(true);
            setIsHost(data.isHost);
            setRoomCode(data.roomCode);
            setError('');
            // Guest: sync to current server time
            if (!data.isHost && playerRef.current) {
                if (data.currentTime !== undefined) {
                    playerRef.current.seekTo(data.currentTime, true);
                }
                if (data.isPlaying) {
                    playerRef.current.playVideo?.();
                    setIsPlaying(true);
                } else {
                    playerRef.current.pauseVideo?.();
                    setIsPlaying(false);
                }
            }
        };
        const onError = ({ msg }) => setError(msg);
        const onMemberCount = ({ count }) => setMemberCount(count);

        const onPlay = ({ currentTime }) => {
            if (playerRef.current) {
                playerRef.current.seekTo(currentTime, true);
                playerRef.current.playVideo?.();
                setIsPlaying(true);
            }
        };
        const onPause = ({ currentTime }) => {
            if (playerRef.current) {
                playerRef.current.seekTo(currentTime, true);
                playerRef.current.pauseVideo?.();
                setIsPlaying(false);
            }
        };
        const onSeek = ({ currentTime }) => {
            if (playerRef.current) playerRef.current.seekTo(currentTime, true);
        };
        const onReact = ({ emoji }) => {
            const id = Date.now() + Math.random();
            setFloatReactions(r => [...r, { id, emoji }]);
            setTimeout(() => setFloatReactions(r => r.filter(x => x.id !== id)), 2200);
        };

        socket.on('watch_party:joined', onJoined);
        socket.on('watch_party:error', onError);
        socket.on('watch_party:member_count', onMemberCount);
        socket.on('watch_party:play', onPlay);
        socket.on('watch_party:pause', onPause);
        socket.on('watch_party:seek', onSeek);
        socket.on('watch_party:react', onReact);

        return () => {
            socket.off('watch_party:joined', onJoined);
            socket.off('watch_party:error', onError);
            socket.off('watch_party:member_count', onMemberCount);
            socket.off('watch_party:play', onPlay);
            socket.off('watch_party:pause', onPause);
            socket.off('watch_party:seek', onSeek);
            socket.off('watch_party:react', onReact);
        };
    }, [playerRef, setIsPlaying]);

    const createRoom = () => {
        const code = genCode();
        socket.emit('watch_party:create', { roomCode: code, videoId, userId });
    };

    const joinRoom = () => {
        if (!inputCode.trim()) return;
        socket.emit('watch_party:join', { roomCode: inputCode.trim().toUpperCase(), userId });
    };

    const leaveRoom = () => {
        socket.emit('watch_party:leave', { roomCode, userId });
        setInRoom(false);
        setIsHost(false);
        setRoomCode('');
        setMemberCount(1);
    };

    const sendReaction = (emoji) => {
        socket.emit('watch_party:react', { roomCode, emoji });
    };

    // Host: intercept play/pause from FocusControls — emit to room
    useEffect(() => {
        if (!inRoom || !isHost || !playerRef.current) return;
        const getCurrentTime = () => {
            try { return playerRef.current.getCurrentTime?.() || 0; } catch { return 0; }
        };
        // We can't intercept play/pause directly from here without hooking into the player state
        // Instead expose manual sync buttons in the panel
    }, [inRoom, isHost, playerRef]);

    const hostSync = (action) => {
        if (!playerRef.current) return;
        const ct = playerRef.current.getCurrentTime?.() || 0;
        if (action === 'play') {
            playerRef.current.playVideo?.();
            setIsPlaying(true);
            socket.emit('watch_party:play', { roomCode, currentTime: ct });
        } else {
            playerRef.current.pauseVideo?.();
            setIsPlaying(false);
            socket.emit('watch_party:pause', { roomCode, currentTime: ct });
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(roomCode).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Shared panel body (used both embedded and floating) ──────────────────
    const PanelBody = () => (
        <>
            {/* Header — hidden when embedded (sidebar already shows title) */}
            {!embedded && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={16} color="#818cf8" />
                        <span style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>Watch Party</span>
                        {inRoom && <span style={{ background: '#4ade80', borderRadius: '50%', width: '7px', height: '7px', display: 'inline-block' }} />}
                    </div>
                    <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Live badge when embedded and in room */}
            {embedded && inRoom && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', padding: '6px 12px', background: 'rgba(99,102,241,0.15)', borderRadius: '20px', width: 'fit-content' }}>
                    <Radio size={12} color="#818cf8" style={{ animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc' }}>{memberCount} watching · {isHost ? 'Host' : 'Guest'}</span>
                </div>
            )}

            {!inRoom ? (
                <>
                    <button onClick={createRoom} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                        <Users size={14} style={{ marginRight: 6 }} /> Create Room (Host)
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            value={inputCode}
                            onChange={e => setInputCode(e.target.value.toUpperCase())}
                            placeholder="Enter room code"
                            maxLength={8}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                                color: 'white', padding: '8px 10px', fontSize: '0.82rem',
                                fontFamily: 'monospace', letterSpacing: '0.1em'
                            }}
                        />
                        <button onClick={joinRoom} className="btn-secondary" style={{ flexShrink: 0, padding: '8px 12px', fontSize: '0.8rem' }}>
                            Join
                        </button>
                    </div>
                    {error && <p style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '0.5rem' }}>{error}</p>}
                </>
            ) : (
                <>
                    {/* Room code box */}
                    <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#a5b4fc', fontWeight: 700, marginBottom: '4px' }}>
                            {isHost ? 'YOUR ROOM CODE — share with friends' : 'ROOM'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '0.12em' }}>
                                {roomCode}
                            </span>
                            {isHost && (
                                <button onClick={copyCode} style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)', display: 'flex' }}>
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Host sync controls */}
                    {isHost && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
                            <button onClick={() => hostSync('play')} style={{ flex: 1, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', color: '#4ade80', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                                <Play size={13} fill="#4ade80" /> Sync Play
                            </button>
                            <button onClick={() => hostSync('pause')} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#f87171', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                                <Pause size={13} /> Sync Pause
                            </button>
                        </div>
                    )}
                    {!isHost && (
                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.85rem', textAlign: 'center' }}>
                            Host controls playback — your player syncs automatically.
                        </p>
                    )}

                    {/* Reactions */}
                    <div style={{ marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.06em' }}>REACTIONS</div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {REACTIONS.map(e => (
                                <button key={e} onClick={() => sendReaction(e)} style={{ fontSize: '1.1rem', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '36px', height: '32px', cursor: 'pointer', transition: 'transform 0.1s' }}
                                    onMouseDown={ev => ev.currentTarget.style.transform = 'scale(0.85)'}
                                    onMouseUp={ev => ev.currentTarget.style.transform = 'scale(1)'}
                                >{e}</button>
                            ))}
                        </div>
                    </div>

                    <button onClick={leaveRoom} style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', padding: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <LogOut size={13} /> Leave Party
                    </button>
                </>
            )}
        </>
    );

    return (
        <>
            {/* Floating emoji reactions — always position:fixed so they float on screen */}
            {floatReactions.map(r => (
                <div key={r.id} style={{
                    position: 'fixed', bottom: '120px',
                    left: `${20 + Math.random() * 60}%`,
                    zIndex: 99999, fontSize: '2rem',
                    animation: 'floatUp 2.2s ease forwards',
                    pointerEvents: 'none'
                }}>{r.emoji}</div>
            ))}

            {/* ── Embedded mode: render panel body inline (no floating) ── */}
            {embedded ? (
                <PanelBody />
            ) : (
                <>
                    {/* Active pill when panel is closed */}
                    {inRoom && !open && (
                        <button onClick={() => setOpen(true)} style={{
                            position: 'fixed', top: '5rem', right: '1.25rem', zIndex: 9990,
                            background: 'rgba(99,102,241,0.9)', border: 'none', borderRadius: '20px',
                            color: 'white', padding: '6px 12px', display: 'flex', alignItems: 'center',
                            gap: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                            backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
                        }}>
                            <Radio size={13} style={{ animation: 'pulse 1.5s infinite' }} />
                            {memberCount} watching
                        </button>
                    )}
                    {!inRoom && !open && (
                        <button onClick={() => setOpen(true)} title="Watch Party" style={{
                            position: 'fixed', top: '5rem', right: '1.25rem', zIndex: 9990,
                            background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', color: 'rgba(255,255,255,0.6)', padding: '7px 10px',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '0.72rem', cursor: 'pointer', backdropFilter: 'blur(8px)'
                        }}>
                            <Users size={14} /> Party
                        </button>
                    )}
                    {open && (
                        <div style={{
                            position: 'fixed', top: '5rem', right: '1.25rem', zIndex: 9991,
                            width: '280px', background: 'rgba(10,14,26,0.96)',
                            border: '1px solid rgba(99,102,241,0.3)', borderRadius: '18px',
                            padding: '1.25rem', backdropFilter: 'blur(20px)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                        }}>
                            <PanelBody />
                        </div>
                    )}
                </>
            )}

            <style>{`
                @keyframes floatUp {
                    0% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-120px) scale(1.4); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </>
    );
};

export default WatchPartyPanel;
