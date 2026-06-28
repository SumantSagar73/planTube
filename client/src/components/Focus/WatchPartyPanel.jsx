import { useState, useEffect, useCallback } from 'react';
import { Users, X, Copy, Check, Play, Pause, LogOut, Radio, Link, ExternalLink, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import socket from '../../services/socket';
import api from '../../services/api';

const REACTIONS = ['👍', '🎉', '🔥', '💡', '😮', '❤️'];
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const WatchPartyPanel = ({ videoId, userId, playerRef, isPlaying, setIsPlaying, embedded = false }) => {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [inRoom, setInRoom] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [memberCount, setMemberCount] = useState(1);
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [error, setError] = useState('');
    const [floatReactions, setFloatReactions] = useState([]);

    // Room preview state — fetched when guest types a valid-length code
    const [preview, setPreview] = useState(null); // { videoId, videoTitle, thumbnail, memberCount }
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');

    // ── Socket events ─────────────────────────────────────────────────────────
    useEffect(() => {
        const onJoined = (data) => {
            setInRoom(true);
            setIsHost(data.isHost);
            setRoomCode(data.roomCode);
            setError('');
            setPreview(null);
            setInputCode('');
            if (!data.isHost && playerRef.current) {
                if (data.currentTime !== undefined) playerRef.current.seekTo(data.currentTime, true);
                if (data.isPlaying) { playerRef.current.playVideo?.(); setIsPlaying(true); }
                else { playerRef.current.pauseVideo?.(); setIsPlaying(false); }
            }
        };
        const onError = ({ msg }) => setError(msg);
        const onMemberCount = ({ count }) => setMemberCount(count);
        const onPlay = ({ currentTime }) => {
            if (playerRef.current) { playerRef.current.seekTo(currentTime, true); playerRef.current.playVideo?.(); setIsPlaying(true); }
        };
        const onPause = ({ currentTime }) => {
            if (playerRef.current) { playerRef.current.seekTo(currentTime, true); playerRef.current.pauseVideo?.(); setIsPlaying(false); }
        };
        const onSeek = ({ currentTime }) => { if (playerRef.current) playerRef.current.seekTo(currentTime, true); };
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

    // ── Room preview — auto-fetch as guest types ──────────────────────────────
    useEffect(() => {
        if (inRoom) return;
        const code = inputCode.trim().toUpperCase();
        if (code.length < 6) { setPreview(null); setPreviewError(''); return; }

        setPreviewLoading(true);
        setPreviewError('');
        const controller = new AbortController();

        api.get(`/watchparty/${code}`, { signal: controller.signal })
            .then(res => { setPreview(res.data); setPreviewError(''); })
            .catch(err => {
                if (err.name === 'CanceledError' || err.name === 'AbortError') return;
                setPreview(null);
                setPreviewError('Room not found. Check the code and try again.');
            })
            .finally(() => setPreviewLoading(false));

        return () => controller.abort();
    }, [inputCode, inRoom]);

    // ── Actions ───────────────────────────────────────────────────────────────
    const createRoom = () => {
        const code = genCode();
        let videoTitle = null, thumbnail = null;
        try {
            const data = playerRef.current?.getVideoData?.();
            videoTitle = data?.title || null;
            thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
        } catch {}
        socket.emit('watch_party:create', { roomCode: code, videoId, userId, videoTitle, thumbnail });
    };

    // Guest join — two paths:
    // 1. Already on the same video → join directly via socket
    // 2. Different video → navigate to correct Focus Mode page with ?party=CODE
    const joinRoom = () => {
        const code = inputCode.trim().toUpperCase();
        if (!code || !preview) return;

        if (preview.videoId === videoId) {
            // Already on the right video — join directly
            socket.emit('watch_party:join', { roomCode: code, userId, videoId });
        } else {
            // Navigate to the correct video; FocusMode will auto-join via ?party=CODE
            navigate(`/focus/${preview.videoId}?party=${code}`);
        }
    };

    const leaveRoom = () => {
        socket.emit('watch_party:leave', { roomCode, userId });
        setInRoom(false); setIsHost(false); setRoomCode(''); setMemberCount(1);
    };

    const sendReaction = (emoji) => socket.emit('watch_party:react', { roomCode, emoji });

    const hostSync = (action) => {
        if (!playerRef.current) return;
        const ct = playerRef.current.getCurrentTime?.() || 0;
        if (action === 'play') {
            playerRef.current.playVideo?.(); setIsPlaying(true);
            socket.emit('watch_party:play', { roomCode, currentTime: ct });
        } else {
            playerRef.current.pauseVideo?.(); setIsPlaying(false);
            socket.emit('watch_party:pause', { roomCode, currentTime: ct });
        }
    };

    const copyToClipboard = (text) => {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback for HTTP or browsers that block clipboard API
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(el);
        el.focus(); el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        return Promise.resolve();
    };

    const copyCode = () => {
        copyToClipboard(roomCode).then(() => {
            setCopied(true); setTimeout(() => setCopied(false), 2000);
        });
    };

    const copyLink = () => {
        const url = `${window.location.origin}/focus/${videoId}?party=${roomCode}`;
        copyToClipboard(url).then(() => {
            setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    // ── Panel body ────────────────────────────────────────────────────────────
    const PanelBody = () => (
        <>
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

            {embedded && inRoom && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', padding: '6px 12px', background: 'rgba(99,102,241,0.15)', borderRadius: '20px', width: 'fit-content' }}>
                    <Radio size={12} color="#818cf8" style={{ animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc' }}>{memberCount} watching · {isHost ? 'Host' : 'Guest'}</span>
                </div>
            )}

            {!inRoom ? (
                <>
                    {/* Host: create room */}
                    <button onClick={createRoom} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                        <Users size={14} style={{ marginRight: 6 }} /> Create Room (Host)
                    </button>

                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textAlign: 'center', margin: '0.5rem 0', letterSpacing: '0.06em' }}>
                        — OR JOIN WITH CODE —
                    </div>

                    {/* Guest: code input */}
                    <input
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value.toUpperCase())}
                        placeholder="Enter room code (e.g. AB3X9K)"
                        maxLength={8}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px', color: 'white', padding: '8px 12px',
                            fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '0.15em',
                            marginBottom: '0.6rem'
                        }}
                    />

                    {/* Preview card */}
                    {previewLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                            <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Looking up room...
                        </div>
                    )}

                    {preview && !previewLoading && (
                        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                                {preview.thumbnail && (
                                    <img src={preview.thumbnail} alt="" style={{ width: '56px', height: '32px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                                )}
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'white', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {preview.videoTitle || 'Watch Party Room'}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#a5b4fc', marginTop: '2px' }}>
                                        {preview.memberCount} watching
                                    </div>
                                </div>
                            </div>

                            {preview.videoId !== videoId && (
                                <div style={{ fontSize: '0.68rem', color: 'rgba(251,191,36,0.8)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ExternalLink size={11} /> You'll be taken to the correct video automatically.
                                </div>
                            )}

                            <button onClick={joinRoom} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.45rem 0' }}>
                                {preview.videoId === videoId ? 'Join Party' : 'Go & Join →'}
                            </button>
                        </div>
                    )}

                    {previewError && <p style={{ color: '#f87171', fontSize: '0.72rem', margin: '0 0 0.5rem' }}>{previewError}</p>}
                    {error && <p style={{ color: '#f87171', fontSize: '0.72rem', margin: '0 0 0.5rem' }}>{error}</p>}

                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                        Guests are automatically taken to the correct video — no manual searching needed.
                    </p>
                </>
            ) : (
                <>
                    {/* Room code + copy + share link */}
                    <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#a5b4fc', fontWeight: 700, marginBottom: '4px' }}>
                            {isHost ? 'YOUR ROOM CODE — share with friends' : 'ROOM'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isHost ? '0.5rem' : 0 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '0.12em' }}>
                                {roomCode}
                            </span>
                            <button onClick={copyCode} style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)', display: 'flex' }}>
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>

                        {/* Shareable link — only for host */}
                        {isHost && (
                            <button
                                onClick={copyLink}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: linkCopied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', color: linkCopied ? '#4ade80' : 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}
                            >
                                {linkCopied ? <Check size={12} /> : <Link size={12} />}
                                {linkCopied ? 'Link copied!' : 'Copy invite link'}
                            </button>
                        )}
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
            {/* Floating emoji reactions */}
            {floatReactions.map(r => (
                <div key={r.id} style={{ position: 'fixed', bottom: '120px', left: `${20 + Math.random() * 60}%`, zIndex: 99999, fontSize: '2rem', animation: 'floatUp 2.2s ease forwards', pointerEvents: 'none' }}>{r.emoji}</div>
            ))}

            {embedded ? (
                <PanelBody />
            ) : (
                <>
                    {inRoom && !open && (
                        <button onClick={() => setOpen(true)} style={{ position: 'fixed', top: '5rem', right: '1.25rem', zIndex: 9990, background: 'rgba(99,102,241,0.9)', border: 'none', borderRadius: '20px', color: 'white', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                            <Radio size={13} style={{ animation: 'pulse 1.5s infinite' }} />
                            {memberCount} watching
                        </button>
                    )}
                    {!inRoom && !open && (
                        <button onClick={() => setOpen(true)} title="Watch Party" style={{ position: 'fixed', top: '5rem', right: '1.25rem', zIndex: 9990, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                            <Users size={14} /> Party
                        </button>
                    )}
                    {open && (
                        <div style={{ position: 'fixed', top: '5rem', right: '1.25rem', zIndex: 9991, width: '300px', background: 'rgba(10,14,26,0.96)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '18px', padding: '1.25rem', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                            <PanelBody />
                        </div>
                    )}
                </>
            )}

            <style>{`
                @keyframes floatUp { 0% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(-120px) scale(1.4); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
                @keyframes spin { to { transform:rotate(360deg); } }
            `}</style>
        </>
    );
};

// Export a hook for FocusMode to call auto-join when ?party= is in the URL
export { WatchPartyPanel as default };
