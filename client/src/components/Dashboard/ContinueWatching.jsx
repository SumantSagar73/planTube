import { Play, Clock } from 'lucide-react';

const ContinueWatching = ({ firstPendingTask, resumeSchedule, resumeSchedules = [], navigate }) => {
    const items = (Array.isArray(resumeSchedules) && resumeSchedules.length > 0)
        ? resumeSchedules
        : (resumeSchedule ? [resumeSchedule] : []);

    const fallbackItem = !items.length && firstPendingTask ? {
        ...firstPendingTask,
        videoId: firstPendingTask.videoId,
        lastWatchedSecond: 0
    } : null;

    const visibleItems = [...items, fallbackItem].filter(Boolean).slice(0, 3);

    if (!visibleItems.length) return null;

    const handleResume = (item) => {
        const activeVideo = item?.videoId;
        const playlistId = activeVideo?.playlistId?._id || activeVideo?.playlistId;
        const resumeSeconds = item?.lastWatchedSecond || 0;
        const query = [];
        if (playlistId) query.push(`playlistId=${playlistId}`);
        if (resumeSeconds > 0) query.push(`resume=${resumeSeconds}`);
        const queryString = query.length > 0 ? `?${query.join('&')}` : '';
        navigate(`/focus/${activeVideo?._id}${queryString}`);
    };

    return (
        <section className="dashboard-continue-card" data-section="schedule">
            <div className="glass dashboard-card-shell" style={{ padding: '2rem', borderRadius: '28px', border: '1px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                <div className="dashboard-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                        <Play size={20} color="white" fill="white" />
                    </div>
                    <div>
                        <h2 className="dashboard-card-title" style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>Continue Watching</h2>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pick up where you left off</p>
                    </div>
                </div>
                <div className="dashboard-continue-body" style={{ display: 'grid', gap: '1rem' }}>
                    {visibleItems.map((item, index) => {
                        const activeVideo = item?.videoId;
                        const playlistId = activeVideo?.playlistId?._id || activeVideo?.playlistId;
                        const resumeSeconds = item?.lastWatchedSecond || 0;
                        const title = activeVideo?.title || activeVideo?.sharedVideoId?.title || 'Unknown Video';
                        const duration = activeVideo?.duration || activeVideo?.sharedVideoId?.duration || '00:00';
                        const thumbnail = activeVideo?.thumbnail || activeVideo?.sharedVideoId?.thumbnail;
                        const hasResumePoint = resumeSeconds > 0;

                        return (
                            <div key={activeVideo?._id || index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.9rem', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {thumbnail ? (
                                    <div style={{ width: '112px', aspectRatio: '16/9', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                                        <img src={thumbnail} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div style={{ width: '112px', aspectRatio: '16/9', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
                                )}

                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {index === 0 ? 'Resume Latest Session' : 'Next Up'}
                                    </p>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.6rem', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <Clock size={14} /> {duration}
                                        </span>
                                        {hasResumePoint && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                at {Math.floor(resumeSeconds / 60)}:{String(resumeSeconds % 60).padStart(2, '0')}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleResume(item)}
                                        className={index === 0 ? 'btn-primary' : 'btn-secondary'}
                                        style={{ display: 'inline-flex', padding: '0.65rem 1rem', fontSize: '0.92rem' }}
                                    >
                                        <Play size={16} fill="currentColor" /> {index === 0 ? 'Resume Session' : 'Open'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ContinueWatching;
