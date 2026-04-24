import { Pin, PinOff, Library, Play, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActiveLibrary = ({ playlists, handleTogglePin }) => (
    <section className="dashboard-library-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Library size={18} color="var(--primary)" />
            </div>
            <h2 className="dashboard-card-title" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>Active Library</h2>
        </div>

        {playlists.length === 0 ? (
            <div className="glass" style={{
                padding: '4rem 2rem',
                borderRadius: '40px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: '1px dashed var(--glass-border)'
            }}>
                <div style={{ width: '56px', height: '56px', background: 'rgba(99,102,241,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Pin size={24} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Your Focus List is Empty</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto 2rem' }}>
                    Your most important playlists appear here. Head to the library to pin your current study goals!
                </p>
                <Link to="/library" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Visit Library <ChevronRight size={16} />
                </Link>
            </div>
        ) : (
            <div className="dashboard-library-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1.5rem',
                paddingBottom: '1.5rem',
            }}>
                {playlists.map(item => {
                    const isPlaylist = item.type === 'playlist';
                    const realId = isPlaylist ? item._id : item.dbId;
                    const thImg = item.thumbnail;
                    const urlParam = isPlaylist ? `/playlist/${item._id}` : `/focus/${item.videoDbId || item._id}`;

                    return (
                        <div key={`dash-${realId}`} className="playlist-card glass" style={{ borderRadius: '24px', overflow: 'hidden', background: 'var(--bg-card)', border: item.isPinned ? '1px solid var(--primary)' : '1px solid var(--glass-border)', position: 'relative', transition: 'all 0.3s ease' }}>
                            <Link to={urlParam} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                                    <img
                                        src={thImg || 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'}
                                        alt={item.title || item.playlistTitle}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'opacity 0.3s' }}
                                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                                        onMouseOut={e => e.currentTarget.style.opacity = 0.8}
                                    />
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleTogglePin(item); }}
                                            className="icon-btn-deck"
                                            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                                            title="Unpin"
                                        >
                                            <PinOff size={16} color="white" />
                                        </button>
                                    </div>
                                    {item.type === 'video' ? (
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '0.6rem' }}>
                                            <Play size={28} fill="white" color="white" />
                                        </div>
                                    ) : item.progress && (
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
                                            <div style={{ height: '100%', background: 'var(--primary)', width: `${Math.min(100, Math.round((item.progress.completed / item.progress.total) * 100))}%` }}></div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.25rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {item.title || item.playlistTitle}
                                    </h3>
                                    {item.type === 'playlist' && item.progress && (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {item.progress.completed} / {item.progress.total} Videos Complete
                                        </p>
                                    )}
                                    {item.type !== 'playlist' && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Single Video</p>}
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        )}
    </section>
);

export default ActiveLibrary;
