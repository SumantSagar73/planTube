import { Play, Clock } from 'lucide-react';

const ContinueWatching = ({ firstPendingTask, resumeSchedule, navigate }) => {
    const resumeVideo = resumeSchedule?.videoId;
    const fallbackVideo = firstPendingTask?.videoId;
    const activeVideo = resumeVideo || fallbackVideo;

    if (!activeVideo) return null;

    const playlistId = activeVideo?.playlistId?._id || activeVideo?.playlistId;
    const resumeSeconds = resumeSchedule?.lastWatchedSecond || 0;
    const title = activeVideo?.title || activeVideo?.sharedVideoId?.title || 'Unknown Video';
    const duration = activeVideo?.duration || activeVideo?.sharedVideoId?.duration || '00:00';
    const thumbnail = activeVideo?.thumbnail || activeVideo?.sharedVideoId?.thumbnail;

    const handleResume = () => {
        const query = [];
        if (playlistId) query.push(`playlistId=${playlistId}`);
        if (resumeSeconds > 0) query.push(`resume=${resumeSeconds}`);
        const queryString = query.length > 0 ? `?${query.join('&')}` : '';
        navigate(`/focus/${activeVideo?._id}${queryString}`);
    };

    return (
        <section className="dashboard-continue-card">
            <div className="glass dashboard-card-shell" style={{ padding: '2rem', borderRadius: '28px', border: '1px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                <div className="dashboard-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                        <Play size={20} color="white" fill="white" />
                    </div>
                    <h2 className="dashboard-card-title" style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)' }}>Continue Watching</h2>
                </div>
                <div className="dashboard-continue-body" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {resumeVideo ? 'Resume Latest Session' : 'Next Up Today'}
                        </p>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.4 }}>
                            {title}
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <Clock size={16} /> {duration}
                            </span>
                            {resumeVideo && resumeSeconds > 0 && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    at {Math.floor(resumeSeconds / 60)}:{String(resumeSeconds % 60).padStart(2, '0')}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleResume}
                            className="btn-primary"
                            style={{ display: 'inline-flex', padding: '0.8rem 2rem', fontSize: '1rem' }}
                        >
                            <Play size={18} fill="currentColor" /> Resume Session
                        </button>
                    </div>
                    {thumbnail && (
                        <div className="dashboard-continue-thumb" style={{ width: '200px', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                            <img src={thumbnail} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ContinueWatching;
