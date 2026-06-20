import { useState, useEffect, useRef } from 'react';
import {
    Map, Plus, Trash2, Lock, Unlock, CheckCircle,
    GripVertical, BookOpen, RefreshCw, Trophy, Flame, Target
} from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// ── Drag-to-reorder hook ─────────────────────────────────────────────────────
const useDrag = (items, setItems) => {
    const dragIdx = useRef(null);
    const onDragStart = (i) => { dragIdx.current = i; };
    const onDragOver = (e, i) => {
        e.preventDefault();
        if (dragIdx.current === null || dragIdx.current === i) return;
        const next = [...items];
        const [moved] = next.splice(dragIdx.current, 1);
        next.splice(i, 0, moved);
        dragIdx.current = i;
        setItems(next);
    };
    const onDragEnd = () => { dragIdx.current = null; };
    return { onDragStart, onDragOver, onDragEnd };
};

// ── SVG circular progress ring ───────────────────────────────────────────────
const ProgressRing = ({ progress, size = 56, stroke = 4, done, locked }) => {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - progress / 100);
    const color = done ? '#10b981' : locked ? 'rgba(255,255,255,0.12)' : 'var(--primary)';
    const trackColor = done ? 'rgba(16,185,129,0.15)' : locked ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.12)';
    return (
        <svg width={size} height={size} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                stroke={color} strokeWidth={stroke} fill="none"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
            />
        </svg>
    );
};

// ── Single roadmap node ──────────────────────────────────────────────────────
const RoadmapNode = ({ node, index, isLocked, isCurrent, totalNodes, onRemove, onDragStart, onDragOver, onDragEnd, onNavigate }) => {
    const [hovered, setHovered] = useState(false);
    const progress = node.totalVideos > 0 ? Math.round((node.completedVideos / node.totalVideos) * 100) : 0;
    const done = progress === 100;
    const isLast = index === totalNodes - 1;

    const statusColor = done ? '#10b981' : isLocked ? 'rgba(255,255,255,0.2)' : isCurrent ? 'var(--primary)' : 'var(--primary)';
    const statusBg = done ? 'rgba(16,185,129,0.15)' : isLocked ? 'rgba(255,255,255,0.04)' : 'rgba(var(--primary-rgb,99,102,241),0.12)';

    return (
        <div style={{ display: 'flex', gap: '0', opacity: isLocked ? 0.6 : 1, transition: 'opacity 0.3s' }}>

            {/* Left: number + connector line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px', flexShrink: 0 }}>
                {/* Step circle */}
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: done ? 'linear-gradient(135deg,#10b981,#059669)' : isLocked
                        ? 'rgba(255,255,255,0.06)'
                        : isCurrent
                            ? 'linear-gradient(135deg,var(--primary),#8b5cf6)'
                            : 'rgba(99,102,241,0.18)',
                    border: `2px solid ${done ? '#10b981' : isLocked ? 'rgba(255,255,255,0.1)' : 'var(--primary)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: done ? '0 0 16px rgba(16,185,129,0.3)' : isCurrent ? '0 0 20px rgba(99,102,241,0.35)' : 'none',
                    transition: 'all 0.4s',
                    marginTop: '8px',
                }}>
                    {done
                        ? <CheckCircle size={18} color="#fff" />
                        : isLocked
                            ? <Lock size={14} color="rgba(255,255,255,0.3)" />
                            : <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#fff' }}>{index + 1}</span>
                    }
                </div>
                {/* Connector line */}
                {!isLast && (
                    <div style={{
                        width: '2px', flex: 1, minHeight: '32px', marginTop: '4px',
                        background: done
                            ? 'linear-gradient(to bottom,#10b981,rgba(16,185,129,0.3))'
                            : 'rgba(255,255,255,0.07)',
                    }} />
                )}
            </div>

            {/* Right: card */}
            <div
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    flex: 1,
                    marginLeft: '16px',
                    marginBottom: '16px',
                    borderRadius: '18px',
                    border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : isLocked ? 'rgba(255,255,255,0.07)' : isCurrent ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.09)'}`,
                    background: done
                        ? 'rgba(16,185,129,0.07)'
                        : isLocked
                            ? 'rgba(255,255,255,0.02)'
                            : isCurrent
                                ? 'rgba(99,102,241,0.09)'
                                : 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(12px)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    cursor: isLocked ? 'not-allowed' : 'grab',
                    transform: hovered && !isLocked ? 'translateY(-2px)' : 'none',
                    boxShadow: hovered && !isLocked
                        ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${done ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`
                        : 'none',
                }}
            >
                {/* Status strip at top */}
                {isCurrent && !done && (
                    <div style={{
                        background: 'linear-gradient(90deg,var(--primary),#8b5cf6)',
                        height: '3px',
                    }} />
                )}
                {done && (
                    <div style={{ background: 'linear-gradient(90deg,#10b981,#059669)', height: '3px' }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px' }}>
                    {/* Drag grip */}
                    <div style={{ color: 'rgba(255,255,255,0.18)', cursor: 'grab', flexShrink: 0 }}>
                        <GripVertical size={16} />
                    </div>

                    {/* Progress ring + thumbnail */}
                    <div style={{ position: 'relative', flexShrink: 0, width: '56px', height: '56px' }}>
                        <ProgressRing progress={progress} size={56} stroke={4} done={done} locked={isLocked} />
                        {/* Thumbnail inside ring */}
                        {node.thumbnail && (
                            <img
                                src={node.thumbnail} alt=""
                                style={{
                                    position: 'absolute',
                                    top: '8px', left: '8px',
                                    width: '40px', height: '40px',
                                    borderRadius: '50%', objectFit: 'cover',
                                    filter: isLocked ? 'grayscale(1) brightness(0.4)' : done ? 'brightness(0.85)' : 'none',
                                    transition: 'filter 0.3s',
                                    display: 'block',
                                }}
                            />
                        )}
                        {/* Percent label inside ring when no thumb */}
                        {!node.thumbnail && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', fontWeight: 800, color: statusColor,
                                transform: 'rotate(90deg)',
                            }}>
                                {progress}%
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title + badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span style={{
                                fontWeight: 700, fontSize: '0.9rem',
                                color: isLocked ? 'rgba(255,255,255,0.35)' : '#f8fafc',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                maxWidth: '240px',
                            }}>
                                {node.playlistTitle}
                            </span>
                            {done && (
                                <span style={{
                                    fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px',
                                    borderRadius: '20px', background: 'rgba(16,185,129,0.18)',
                                    color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                                    letterSpacing: '0.5px',
                                }}>
                                    DONE
                                </span>
                            )}
                            {isCurrent && !done && (
                                <span style={{
                                    fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px',
                                    borderRadius: '20px', background: 'rgba(99,102,241,0.2)',
                                    color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)',
                                    letterSpacing: '0.5px', animation: 'pulse 2s ease-in-out infinite',
                                }}>
                                    IN PROGRESS
                                </span>
                            )}
                            {isLocked && (
                                <span style={{
                                    fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px',
                                    borderRadius: '20px', background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                                    letterSpacing: '0.5px',
                                }}>
                                    LOCKED
                                </span>
                            )}
                        </div>

                        {/* Progress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progress}%`, height: '100%',
                                    background: done ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,var(--primary),#8b5cf6)',
                                    borderRadius: '3px',
                                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                                }} />
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                                {node.completedVideos}/{node.totalVideos}
                            </span>
                        </div>

                        {isLocked && (
                            <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>
                                Complete the previous step to unlock
                            </p>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                        {!isLocked && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onNavigate(node.playlistId); }}
                                style={{
                                    background: done ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2))',
                                    border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.35)'}`,
                                    borderRadius: '10px', padding: '6px 12px',
                                    cursor: 'pointer',
                                    color: done ? '#10b981' : '#a5b4fc',
                                    fontSize: '0.72rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <BookOpen size={12} />
                                {done ? 'Review' : 'Open'}
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                            style={{
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
                                borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: '#f87171',
                                display: 'flex', alignItems: 'center',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Playlist picker item ─────────────────────────────────────────────────────
const PickerItem = ({ item, onAdd }) => {
    const pl = item.playlist || item;
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={() => onAdd(item)}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '10px 12px', borderRadius: '12px', border: 'none',
                background: hov ? 'rgba(99,102,241,0.12)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.15s',
            }}
        >
            {pl.thumbnail
                ? <img src={pl.thumbnail} alt="" style={{ width: '52px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: '52px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={16} color="#a5b4fc" />
                  </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pl.title || pl.playlistTitle}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    {item.videoCount ?? item.totalVideos ?? 0} videos · {item.completedCount ?? item.completedVideos ?? 0} done
                </div>
            </div>
            <Plus size={15} color="#a5b4fc" style={{ flexShrink: 0 }} />
        </button>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Roadmap = () => {
    const navigate = useNavigate();
    const [nodes, setNodes] = useState(() => {
        try { return JSON.parse(localStorage.getItem('roadmap_nodes') || '[]'); }
        catch { return []; }
    });
    const [playlists, setPlaylists] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [prereqMode, setPrereqMode] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { onDragStart, onDragOver, onDragEnd } = useDrag(nodes, (next) => {
        setNodes(next);
        localStorage.setItem('roadmap_nodes', JSON.stringify(next));
    });

    useEffect(() => { fetchPlaylists(); }, []);
    useEffect(() => { localStorage.setItem('roadmap_nodes', JSON.stringify(nodes)); }, [nodes]);

    const fetchPlaylists = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await api.get('/playlists/library');
            setPlaylists(res.data || []);
            setNodes(prev => prev.map(n => {
                const match = res.data.find(p =>
                    String(p.playlist?._id) === String(n.playlistId) ||
                    String(p._id) === String(n.playlistId)
                );
                if (!match) return n;
                const pl = match.playlist || match;
                return {
                    ...n,
                    playlistTitle: pl.title || pl.playlistTitle || n.playlistTitle,
                    thumbnail: pl.thumbnail || n.thumbnail,
                    totalVideos: match.videoCount ?? match.totalVideos ?? n.totalVideos,
                    completedVideos: match.completedCount ?? match.completedVideos ?? n.completedVideos,
                };
            }));
        } catch { }
        finally { setLoading(false); setRefreshing(false); }
    };

    const addPlaylist = (item) => {
        const pl = item.playlist || item;
        const id = String(pl._id);
        if (nodes.find(n => String(n.playlistId) === id)) return;
        setNodes(prev => [...prev, {
            playlistId: id,
            playlistTitle: pl.title || pl.playlistTitle,
            thumbnail: pl.thumbnail,
            totalVideos: item.videoCount ?? item.totalVideos ?? 0,
            completedVideos: item.completedCount ?? item.completedVideos ?? 0,
        }]);
        setShowPicker(false);
    };

    const removeNode = (i) => setNodes(prev => prev.filter((_, idx) => idx !== i));

    const isNodeLocked = (index) => {
        if (!prereqMode || index === 0) return false;
        const prev = nodes[index - 1];
        if (!prev) return false;
        return prev.totalVideos > 0 && prev.completedVideos < prev.totalVideos;
    };

    const addedIds = new Set(nodes.map(n => String(n.playlistId)));
    const availablePlaylists = playlists.filter(p => {
        const pl = p.playlist || p;
        return !addedIds.has(String(pl._id));
    });

    // Overall stats
    const totalVideos = nodes.reduce((s, n) => s + (n.totalVideos || 0), 0);
    const completedVideos = nodes.reduce((s, n) => s + (n.completedVideos || 0), 0);
    const completedNodes = nodes.filter((n) => n.totalVideos > 0 && n.completedVideos >= n.totalVideos).length;
    const overallPct = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    const allDone = nodes.length > 0 && completedNodes === nodes.length;

    // Find current active node index (first non-done, non-locked)
    const currentNodeIndex = nodes.findIndex((n, i) => {
        const done = n.totalVideos > 0 && n.completedVideos >= n.totalVideos;
        return !done && !isNodeLocked(i);
    });

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>

            {/* ── Hero banner ───────────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.14) 50%, rgba(16,185,129,0.08) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                padding: '2.5rem 2rem 2rem',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(99,102,241,0.06)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(16,185,129,0.05)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '16px',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                            flexShrink: 0,
                        }}>
                            <Map size={26} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.5px' }}>
                                Learning Roadmap
                            </h1>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                                {allDone && nodes.length > 0
                                    ? '🎉 You completed your entire roadmap!'
                                    : 'Sequence playlists and unlock them step by step'}
                            </p>
                        </div>
                    </div>

                    {/* Stats row */}
                    {nodes.length > 0 && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                            <StatPill icon={<Trophy size={13} />} label="Steps done" value={`${completedNodes}/${nodes.length}`} color="#f59e0b" />
                            <StatPill icon={<Flame size={13} />} label="Videos done" value={`${completedVideos}/${totalVideos}`} color="#ef4444" />
                            <StatPill icon={<Target size={13} />} label="Overall" value={`${overallPct}%`} color="#6366f1" />

                            {/* Master progress bar */}
                            <div style={{ width: '100%', marginTop: '0.5rem' }}>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${overallPct}%`, height: '100%',
                                        background: allDone
                                            ? 'linear-gradient(90deg,#10b981,#059669)'
                                            : 'linear-gradient(90deg,#6366f1,#8b5cf6,#10b981)',
                                        borderRadius: '3px',
                                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                                    }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main content ─────────────────────────────────────────────── */}
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.25rem' }}>

                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowPicker(p => !p)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '9px 18px', borderRadius: '12px',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            border: 'none', color: '#fff', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.82rem',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                        <Plus size={15} /> Add Playlist
                    </button>

                    <button
                        onClick={() => setPrereqMode(m => !m)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '9px 16px', borderRadius: '12px',
                            border: `1px solid ${prereqMode ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
                            background: prereqMode ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                            color: prereqMode ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        {prereqMode ? <Lock size={13} /> : <Unlock size={13} />}
                        {prereqMode ? 'Sequential' : 'Free order'}
                    </button>

                    <button
                        onClick={() => fetchPlaylists(true)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                            cursor: 'pointer', color: 'rgba(255,255,255,0.45)',
                            transition: 'all 0.2s',
                        }}
                        title="Refresh progress"
                    >
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                    </button>
                </div>

                {/* Picker dropdown */}
                {showPicker && (
                    <div style={{
                        marginBottom: '1.5rem',
                        background: 'rgba(15,23,42,0.96)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        borderRadius: '18px',
                        padding: '0.75rem',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
                        maxHeight: '280px', overflowY: 'auto',
                    }}>
                        <p style={{ margin: '0 0 8px 8px', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Your Library
                        </p>
                        {loading ? (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>Loading...</div>
                        ) : availablePlaylists.length === 0 ? (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>All playlists are already in your roadmap.</div>
                        ) : (
                            availablePlaylists.map(item => (
                                <PickerItem key={(item.playlist || item)._id} item={item} onAdd={addPlaylist} />
                            ))
                        )}
                    </div>
                )}

                {/* Empty state */}
                {nodes.length === 0 && !showPicker && (
                    <div style={{
                        textAlign: 'center', padding: '5rem 2rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        borderRadius: '24px',
                    }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 1.5rem',
                            background: 'rgba(99,102,241,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Map size={36} color="rgba(99,102,241,0.5)" />
                        </div>
                        <h3 style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.6rem' }}>
                            No roadmap yet
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '2rem', maxWidth: '360px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                            Add playlists to build a sequential learning path. Each step unlocks after the previous one is complete.
                        </p>
                        <button
                            onClick={() => setShowPicker(true)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '11px 24px', borderRadius: '14px',
                                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                border: 'none', color: '#fff', cursor: 'pointer',
                                fontWeight: 700, fontSize: '0.88rem',
                                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                            }}
                        >
                            <Plus size={16} /> Add First Playlist
                        </button>
                    </div>
                )}

                {/* Roadmap nodes */}
                {nodes.length > 0 && (
                    <div>
                        {nodes.map((node, i) => (
                            <RoadmapNode
                                key={node.playlistId}
                                node={node}
                                index={i}
                                totalNodes={nodes.length}
                                isLocked={isNodeLocked(i)}
                                isCurrent={i === currentNodeIndex}
                                onRemove={removeNode}
                                onDragStart={onDragStart}
                                onDragOver={onDragOver}
                                onDragEnd={onDragEnd}
                                onNavigate={(pid) => navigate(`/playlist/${pid}`)}
                            />
                        ))}

                        {/* Finish line */}
                        <div style={{
                            textAlign: 'center', marginTop: '0.5rem', padding: '1.5rem',
                            background: allDone ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                            borderRadius: '16px', border: `1px solid ${allDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                            {allDone ? (
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
                                    <p style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Roadmap Complete!</p>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: '4px' }}>Amazing work — you finished every step.</p>
                                </div>
                            ) : (
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem', margin: 0 }}>
                                    Keep going · {nodes.length - completedNodes} step{nodes.length - completedNodes !== 1 ? 's' : ''} remaining
                                </p>
                            )}
                        </div>

                        {nodes.length > 1 && (
                            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.18)', marginTop: '1rem' }}>
                                Drag cards to reorder · Changes save automatically
                            </p>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%,100% { opacity: 1; }
                    50% { opacity: 0.65; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

// ── Stat pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ icon, label, value, color }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '6px 14px', borderRadius: '20px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(8px)',
    }}>
        <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
);

export default Roadmap;
