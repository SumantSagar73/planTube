import React from 'react';
import { Link } from 'react-router-dom';
import {
    Pin, PinOff, RefreshCw, Trash2,
    Play, Link as LinkIcon, Share2,
    Clock, CheckCircle, MoreHorizontal, Video
} from 'lucide-react';

const LibraryItem = ({
    item,
    viewMode,
    onTogglePin,
    onDelete,
    onSync,
    onShare,
    isSyncing
}) => {
    const isVideo = item.type === 'video';
    const linkTarget = isVideo
        ? `/focus/${item._id}`
        : (item.type === 'custom' ? `/custom-playlist/${item._id}` : `/playlist/${item._id}`);

    if (viewMode === 'list') {
        return (
            <tr className="list-row-item" style={{ borderBottom: '1px solid var(--glass-border)', transition: 'all 0.3s' }}>
                <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img src={item.thumbnail} alt="" style={{ width: '90px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} />
                            {item.isPinned && (
                                <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--primary)', padding: '0.2rem', borderRadius: '50%', border: '2px solid var(--bg-card)' }}>
                                    <Pin size={7} fill="white" color="white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <Link to={linkTarget} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.2rem' }}>{item.title}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                                    <span style={{ color: isVideo ? '#f59e0b' : 'var(--primary)' }}>{item.type === 'imported' ? 'PLAYLIST' : item.type.toUpperCase()}</span>
                                    <span>{item.videoCount || 1} VIDEOS</span>
                                    {typeof item.progress === 'number' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${item.progress}%`, height: '100%', background: item.progress === 100 ? '#22c55e' : 'var(--primary)' }} />
                                            </div>
                                            <span style={{ color: item.progress === 100 ? '#22c55e' : 'var(--text-muted)' }}>{item.progress}%</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    </div>
                </td>
                <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button onClick={(e) => onTogglePin(e, item)} className="list-icon-action" title={item.isPinned ? "Unpin" : "Pin"}>
                            {item.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>
                        {item.type !== 'custom' && (
                            <button onClick={(e) => onSync(e, item)} className="list-icon-action" title="Sync with YT" disabled={isSyncing}>
                                <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
                            </button>
                        )}
                        <button onClick={(e) => onShare(e, item)} className="list-icon-action" title="Share Link">
                            <Share2 size={14} />
                        </button>
                        <button onClick={(e) => onDelete(e, item)} className="list-icon-action danger" title="Remove">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </td>
                <style>{`
                    .list-row-item:hover { background: rgba(255,255,255,0.02); }
                    .list-icon-action {
                        width: 32px; height: 32px; border-radius: 8px;
                        border: 1px solid rgba(255,255,255,0.05); background: transparent;
                        color: var(--text-muted); display: flex; align-items: center; justify-content: center;
                        cursor: pointer; transition: all 0.2s;
                    }
                    .list-icon-action:hover { background: rgba(255,255,255,0.05); color: white; border-color: rgba(255,255,255,0.1); }
                    .list-icon-action.danger:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
                `}</style>
            </tr>
        );
    }

    // Grid View Compact
    return (
        <div key={item._id} className="vault-card-compact" style={{
            borderRadius: '20px', overflow: 'hidden', background: 'var(--bg-card)',
            border: item.isPinned ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
            position: 'relative', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column'
        }}>
            <Link to={linkTarget} style={{ display: 'block', textDecoration: 'none', color: 'inherit', flex: 1 }}>
                <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16/9' }}>
                    <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }} className="card-thumb" />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                        display: 'flex', alignItems: 'flex-end', padding: '1rem'
                    }}>
                        <span style={{
                            background: isVideo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                            color: isVideo ? '#f59e0b' : 'var(--primary)',
                            padding: '0.25rem 0.6rem', borderRadius: '6px',
                            fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase',
                            letterSpacing: '0.5px', border: `1px solid ${isVideo ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
                            backdropFilter: 'blur(8px)'
                        }}>
                            {item.type === 'imported' ? 'playlist' : item.type}
                        </span>
                    </div>
                    {typeof item.progress === 'number' && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.1)' }}>
                            <div style={{ width: `${item.progress}%`, height: '100%', background: item.progress === 100 ? '#22c55e' : 'var(--primary)', transition: 'width 0.5s ease' }} />
                        </div>
                    )}
                </div>
                <div style={{ padding: '1rem' }}>
                    <h3 style={{
                        fontSize: '1.05rem', fontWeight: '900', marginBottom: '0.6rem',
                        height: '2.8rem', overflow: 'hidden', lineClamp: 2,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        lineHeight: '1.3', color: 'var(--text-main)'
                    }}>
                        {item.title}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isVideo ? '#f59e0b' : 'var(--primary)' }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>
                                {item.videoCount || 1} {isVideo ? 'Video' : 'Videos'}
                            </span>
                        </div>
                        {typeof item.progress === 'number' && (
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: item.progress === 100 ? '#22c55e' : 'var(--primary)' }}>
                                {item.progress}%
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Compact Action Row */}
            <div style={{
                padding: '0.6rem 0.9rem',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)'
            }}>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button onClick={(e) => onTogglePin(e, item)} className="card-action-btn" title={item.isPinned ? "Unpin" : "Pin"}>
                        {item.isPinned ? <PinOff size={15} className="text-primary" /> : <Pin size={15} />}
                    </button>
                    {item.type !== 'custom' && (
                        <button onClick={(e) => onSync(e, item)} className="card-action-btn" title="Sync metadata" disabled={isSyncing}>
                            <RefreshCw size={15} className={isSyncing ? "spin" : ""} />
                        </button>
                    )}
                    <button onClick={(e) => onShare(e, item)} className="card-action-btn" title="Copy Link">
                        <Share2 size={15} />
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button onClick={(e) => onDelete(e, item)} className="card-action-btn danger" title="Delete">
                        <Trash2 size={15} />
                    </button>
                    <Link to={linkTarget} className="card-play-btn">
                        {isVideo ? <Play size={14} fill="white" /> : <Video size={14} />}
                    </Link>
                </div>
            </div>

            <style>{`
                .vault-card-compact:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
                .vault-card-compact:hover .card-thumb { transform: scale(1.1); }
                .card-action-btn {
                    width: 28px; height: 28px; border-radius: 6px; border: 1px solid transparent;
                    background: transparent; color: var(--text-muted); display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .card-action-btn:hover { background: rgba(255,255,255,0.05); color: white; }
                .card-action-btn.danger:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                .card-play-btn {
                    width: 30px; height: 30px; border-radius: 8px; background: var(--primary);
                    color: white; display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s; box-shadow: 0 3px 10px rgba(99, 102, 241, 0.3);
                }
                .card-play-btn:hover { transform: scale(1.1); box-shadow: 0 5px 12px rgba(99, 102, 241, 0.4); }
                .text-primary { color: var(--primary); }
            `}</style>
        </div>
    );
};

export default LibraryItem;
