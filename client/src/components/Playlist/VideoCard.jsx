import { Link } from 'react-router-dom';
import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import useIsMobile from '../../hooks/useIsMobile';

const VideoCard = ({ video, playlistId, schedule, user, activeDate, formatDate, onSchedule, onRemoveSchedule, onToggleCompletion }) => {
    const isCompleted = schedule?.status === 'completed';
    const isPlanned = schedule && schedule.scheduledDate;
    const isMobile = useIsMobile(600);

    return (
        <div
            id={`video-${video._id}`}
            className="glass-hover playlist-video-card"
            style={{
                padding: isMobile ? '0.75rem' : '1rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.75rem' : '1.5rem',
                background: isCompleted ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)',
                border: isCompleted ? '2px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--glass-border)',
                opacity: isCompleted ? 0.9 : 1,
                transition: 'all 0.3s ease',
                minWidth: 0
            }}
            onMouseEnter={e => !isCompleted && (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={e => !isCompleted && (e.currentTarget.style.borderColor = 'var(--glass-border)')}
        >
            <Link
                className="playlist-video-link"
                to={`/focus/${video._id}${playlistId ? `?playlistId=${playlistId}` : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1.5rem', flex: 1, textDecoration: 'none', color: 'inherit', minWidth: 0 }}
            >
                {!isMobile && (
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: isCompleted ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.03)', width: '30px', textAlign: 'center' }}>
                        {(video.position + 1).toString().padStart(2, '0')}
                    </div>
                )}
                {video.thumbnail && (
                    <img src={video.thumbnail} alt="" style={{ width: isMobile ? '80px' : '120px', height: isMobile ? '45px' : '68px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', marginBottom: '0.2rem', fontWeight: '700', color: isCompleted ? '#86efac' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {video.title}
                    </h3>
                    <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> {video.duration || '0:00'}
                        </div>
                        {isPlanned && (
                            <span style={{ color: isCompleted ? '#86efac' : 'var(--primary)', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Calendar size={12} /> {formatDate(schedule.scheduledDate.split('T')[0])}
                            </span>
                        )}
                        {video.tags && video.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.25rem', overflow: 'hidden', flex: 1, whiteSpace: 'nowrap' }}>
                                {video.tags.map(tag => (
                                    <span key={tag} style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </Link>

            <div className="playlist-video-actions" style={{ display: 'flex', gap: isMobile ? '0.5rem' : '1rem', alignItems: 'center', flexShrink: 0 }}>
                {user && (
                    !isPlanned ? (
                        <button
                            onClick={(e) => { e.preventDefault(); onSchedule(video._id); }}
                            disabled={isCompleted}
                            className="btn-secondary"
                            style={{
                                padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1.2rem',
                                borderRadius: '10px',
                                opacity: isCompleted ? 0.5 : 1,
                                cursor: isCompleted ? 'not-allowed' : 'pointer',
                                fontSize: isMobile ? '0.75rem' : '0.85rem'
                            }}
                        >
                            Plan
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.preventDefault(); onRemoveSchedule(video._id); }}
                            style={{ background: 'none', color: 'var(--danger)', opacity: 0.5, cursor: 'pointer', padding: 0, border: 'none' }}
                            title="Remove from plan"
                        >
                            <XCircle size={isMobile ? 18 : 22} />
                        </button>
                    )
                )}
                <button
                    onClick={(e) => { e.preventDefault(); onToggleCompletion(video._id); }}
                    style={{
                        width: isMobile ? '32px' : '42px', 
                        height: isMobile ? '32px' : '42px', 
                        borderRadius: isMobile ? '8px' : '12px',
                        background: isCompleted ? '#16a34a' : 'rgba(255,255,255,0.03)',
                        color: 'white', border: isCompleted ? 'none' : '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                    }}
                    title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                >
                    <CheckCircle size={isMobile ? 18 : 24} fill={isCompleted ? 'white' : 'none'} strokeWidth={isCompleted ? 0 : 2} />
                </button>
            </div>
        </div>
    );
};

export default VideoCard;
