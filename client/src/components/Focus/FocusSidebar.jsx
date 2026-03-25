import React, { useState } from 'react';
import {
    CheckCircle, Map, AlignLeft, List as ListIcon,
    ChevronDown, Play, Users, Copy, Check, Settings
} from 'lucide-react';

const FocusSidebar = ({
    showSidebar,
    setShowSidebar,
    sidebarTab,
    setSidebarTab,
    video,
    playlist,
    allVideos,
    schedule,
    playlistSchedules,
    activeChapterIndex,
    handleSeek,
    toggleChapter,
    navigate,
    videoId,
    isMobile,
    compactMode,
    chapterRefs,
    presenceCount,
    captionTracks = [],
    currentCaptionTrack,
    audioTracks = [],
    currentAudioTrack,
    setCaptionTrack,
    setAudioTrack
}) => {
    const [copyDone, setCopyDone] = useState(false);

    const handleCopyDescription = () => {
        if (!video?.description) return;
        navigator.clipboard.writeText(video.description).then(() => {
            setCopyDone(true);
            setTimeout(() => setCopyDone(false), 2000);
        });
    };

    if (!video) return null;

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: isMobile ? '100%' : '400px',
                height: isMobile ? (showSidebar ? '75vh' : '0') : 'calc(100vh - 100px)',
                maxHeight: isMobile ? '75vh' : '700px',
                background: 'rgba(10, 10, 12, 0.98)',
                backdropFilter: 'blur(40px)',
                borderTopLeftRadius: '32px',
                borderTopRightRadius: isMobile ? '32px' : '0',
                borderLeft: isMobile ? 'none' : '1px solid var(--glass-border)',
                borderTop: '1px solid var(--glass-border)',
                transform: `translateY(${showSidebar ? '0' : '100%'})`,
                opacity: showSidebar ? 1 : 0,
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-10px -10px 40px rgba(0,0,0,0.5)',
                pointerEvents: showSidebar ? 'auto' : 'none',
                overflow: 'hidden'
            }}
        >
            {/* Sidebar Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                        {sidebarTab === 'chapters' ? 'Video Map' : (sidebarTab === 'playlist' ? 'Playlist' : (sidebarTab === 'settings' ? 'Settings' : 'About'))}
                    </h3>
                    {compactMode && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button onClick={() => setSidebarTab('chapters')} style={{ color: sidebarTab === 'chapters' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Chapters</button>
                            <button onClick={() => setSidebarTab('description')} style={{ color: sidebarTab === 'description' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Info</button>
                            {playlist && playlist.playlistId !== 'SINGLES' && !playlist.playlistId?.startsWith('VIDEO_') && (
                                <button onClick={() => setSidebarTab('playlist')} style={{ color: sidebarTab === 'playlist' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Playlist</button>
                            )}
                            <button onClick={() => setSidebarTab('settings')} style={{ color: sidebarTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Settings</button>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowSidebar(false)}
                    className="icon-btn-deck"
                    style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)' }}
                >
                    <ChevronDown size={18} />
                </button>
            </div>

            {/* Sidebar Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                {sidebarTab === 'chapters' && video.chapters && video.chapters.length > 0 && !compactMode && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)' }}>Course Progress</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)' }}>
                                {schedule ? Math.round((schedule.completedChapters?.length / video.chapters.length) * 100) : 0}%
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${schedule ? (schedule.completedChapters?.length / video.chapters.length) * 100 : 0}%`,
                                height: '100%',
                                background: 'var(--primary)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                )}

                {sidebarTab === 'chapters' ? (
                    <>
                        {video.chapters && video.chapters.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {video.chapters.map((chapter, idx) => {
                                    const isDone = schedule?.completedChapters?.includes(idx);
                                    const isActive = idx === activeChapterIndex;

                                    return (
                                        <div
                                            key={idx}
                                            ref={el => chapterRefs.current[idx] = el}
                                            className="glass-hover"
                                            style={{
                                                background: isActive ? 'rgba(99, 102, 241, 0.15)' : (isDone ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                                                border: isActive ? '1px solid var(--primary)' : (isDone ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'),
                                                borderRadius: '16px',
                                                padding: '0.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                                            }}
                                        >
                                            {isActive && (
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)' }} />
                                            )}

                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleChapter(idx); }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: isDone ? '#22c55e' : 'rgba(255,255,255,0.2)',
                                                    display: 'flex',
                                                    padding: '0.4rem',
                                                    borderRadius: '10px',
                                                    transition: 'all 0.2s',
                                                    zIndex: 2,
                                                    marginLeft: isActive ? '0.5rem' : '0'
                                                }}
                                                className="hover-bg-glass"
                                                title={isDone ? "Mark as incomplete" : "Mark as complete"}
                                            >
                                                <CheckCircle size={20} fill={isDone ? '#22c55e' : 'none'} strokeWidth={isDone ? 2 : 1.5} />
                                            </button>

                                            <button
                                                onClick={() => handleSeek(chapter.seconds)}
                                                style={{
                                                    flex: 1,
                                                    background: 'none',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    padding: '0.5rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.1rem',
                                                    zIndex: 2
                                                }}
                                            >
                                                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isActive ? 'white' : (isDone ? 'rgba(255,255,255,0.4)' : '#ffffff'), textDecoration: isDone ? 'line-through' : 'none' }}>
                                                    {chapter.title}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', opacity: (isDone && !isActive) ? 0.5 : 1 }}>
                                                    {chapter.timestamp}
                                                </span>
                                            </button>

                                            {isActive && <div style={{ marginRight: '0.5rem' }}><div className="pulsing-dot" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} /></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                                <Map size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                                <p style={{ fontSize: '0.9rem' }}>No chapters found for this video.</p>
                            </div>
                        )}
                    </>
                ) : sidebarTab === 'playlist' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '0 0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>Playlist Progress</span>
                                <span>{Math.round((playlistSchedules.filter(s => s.status === 'completed').length / (allVideos.length || 1)) * 100)}%</span>
                            </div>
                            <div className="progress-container" style={{ height: '6px' }}>
                                <div
                                    className="progress-bar"
                                    style={{ width: `${(playlistSchedules.filter(s => s.status === 'completed').length / (allVideos.length || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {allVideos.map((v, idx) => {
                                const isActive = v._id === videoId;
                                const vSchedule = playlistSchedules.find(s => {
                                    const sVid = (typeof s.videoId === 'object') ? s.videoId._id : s.videoId;
                                    return sVid === v._id;
                                });
                                const isDone = vSchedule?.status === 'completed';

                                return (
                                    <div
                                        key={v._id}
                                        onClick={() => navigate(`/focus/${v._id}`)}
                                        className="glass-hover"
                                        style={{
                                            padding: '0.75rem', borderRadius: '12px',
                                            background: isActive ? 'var(--primary)' : (isDone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.02)'),
                                            border: isActive ? '1px solid var(--primary)' : (isDone ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'),
                                            cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.8rem', fontWeight: '900', color: isActive ? 'white' : (isDone ? '#4ade80' : 'var(--text-muted)'), minWidth: '20px' }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: isActive ? 'white' : (isDone ? '#86efac' : 'var(--text-main)'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</p>
                                            <p style={{ fontSize: '0.7rem', color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{v.duration}</p>
                                        </div>
                                        {isActive && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
                                                <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }}></div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'white' }}>{presenceCount} Live</span>
                                                <Play size={12} fill="white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : sidebarTab === 'settings' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Captions Section */}
                        <div>
                            <h4 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Captions & Subtitles</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div 
                                    onClick={() => setCaptionTrack(null)}
                                    className="glass-hover"
                                    style={{
                                        padding: '0.75rem', borderRadius: '12px',
                                        background: !currentCaptionTrack ? 'var(--primary)' : 'rgba(255, 255, 255, 0.02)',
                                        border: !currentCaptionTrack ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Off</span>
                                    {!currentCaptionTrack && <Check size={16} />}
                                </div>
                                {captionTracks.map((track) => {
                                    const isActive = currentCaptionTrack && currentCaptionTrack.languageCode === track.languageCode && currentCaptionTrack.kind === track.kind;
                                    return (
                                        <div 
                                            key={`${track.languageCode}-${track.kind}`}
                                            onClick={() => setCaptionTrack(track)}
                                            className="glass-hover"
                                            style={{
                                                padding: '0.75rem', borderRadius: '12px',
                                                background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.02)',
                                                border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                                                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                                {track.name || track.languageName} {track.kind === 'asr' ? '(Auto-generated)' : ''}
                                            </span>
                                            {isActive && <Check size={16} />}
                                        </div>
                                    );
                                })}
                                {captionTracks.length === 0 && (
                                    <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>No captions available for this video.</p>
                                )}
                            </div>
                        </div>

                        {/* Audio Tracks Section */}
                        {audioTracks.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Audio Language</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {audioTracks.map((track) => {
                                        const isActive = currentAudioTrack && currentAudioTrack.languageCode === track.languageCode;
                                        return (
                                            <div 
                                                key={track.languageCode}
                                                onClick={() => setAudioTrack(track)}
                                                className="glass-hover"
                                                style={{
                                                    padding: '0.75rem', borderRadius: '12px',
                                                    background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.02)',
                                                    border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                                                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}
                                            >
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{track.name || track.languageName}</span>
                                                {isActive && <Check size={16} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Copy description button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                            <button
                                onClick={handleCopyDescription}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    background: copyDone ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                                    border: copyDone ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                    color: copyDone ? '#4ade80' : 'rgba(255,255,255,0.6)',
                                    borderRadius: '8px', padding: '0.35rem 0.75rem',
                                    fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                title="Copy description to clipboard"
                            >
                                {copyDone ? <Check size={13} /> : <Copy size={13} />}
                                {copyDone ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {video.description ? (
                                video.description.split(/((?:https?:\/\/|www\.)[^\s]+)/g).map((part, i) => {
                                    if (part.match(/^(https?:\/\/|www\.)/)) {
                                        const url = part.startsWith('www.') ? 'https://' + part : part;
                                        return <a key={i} href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{part}</a>;
                                    }
                                    return part;
                                })
                            ) : <p style={{ opacity: 0.5 }}>No description available.</p>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FocusSidebar;
