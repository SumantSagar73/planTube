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

    const parseToSec = (d) => {
        if (!d) return 0;
        const p = d.split(':').map(Number);
        if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
        if (p.length === 2) return p[0] * 60 + p[1];
        return 0;
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
                        const durationStr = activeVideo?.duration || activeVideo?.sharedVideoId?.duration || '0:00';
                        const thumbnail = activeVideo?.thumbnail || activeVideo?.sharedVideoId?.thumbnail;
                        const hasResumePoint = resumeSeconds > 0;
                        
                        const totalSec = parseToSec(durationStr);
                        const progressPercent = totalSec > 0 ? Math.round((resumeSeconds / totalSec) * 100) : 0;

                        return (
                            <div key={activeVideo?._id || index} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', padding: '1rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                {thumbnail ? (
                                    <div style={{ width: '130px', aspectRatio: '16/9', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, position: 'relative' }}>
                                        <img src={thumbnail} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {hasResumePoint && (
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
                                                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)' }} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ width: '130px', aspectRatio: '16/9', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
                                )}

                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <p style={{ color: index === 0 ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px', margin: 0 }}>
                                            {index === 0 ? 'Resume Latest' : 'Recently Viewed'}
                                        </p>
                                        {hasResumePoint && (
                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {progressPercent}% Complete
                                            </span>
                                        )}
                                    </div>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.6rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>
                                                <Clock size={14} /> {durationStr}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleResume(item)}
                                            className={index === 0 ? 'btn-primary' : 'btn-secondary'}
                                            style={{ display: 'inline-flex', padding: '0.5rem 0.9rem', fontSize: '0.85rem', borderRadius: '10px' }}
                                        >
                                            <Play size={14} fill="currentColor" /> {index === 0 ? 'Resume' : 'View'}
                                        </button>
                                    </div>
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
