import React, { useState, useRef } from 'react';
import {
    ChevronLeft, ChevronRight, Play, CheckCircle,
    Eye, EyeOff, Map, AlignLeft, List as ListIcon,
    Maximize, ExternalLink, Monitor, FileText, Zap
} from 'lucide-react';

const FocusControls = ({
    showControls,
    uiHidden,
    isMobile,
    compactMode,
    video,
    activeChapterIndex,
    currentTime,
    duration,
    playbackRate,
    volume,
    isPlaying,
    isCompleted,
    isFrozen,
    showSidebar,
    sidebarTab,
    currentIndex,
    allVideos,
    playlist,
    handleSeekChange,
    setIsDragging,
    toggleSpeed,
    handleVolumeChange,
    handlePrevVideo,
    togglePlay,
    handleNextVideo,
    setIsHovering,
    handleToggleComplete,
    setSidebarTab,
    setShowSidebar,
    formatTime,
    isFullscreen,
    handleToggleFullscreen,
    isLoading,
    miniPlayer,
    setMiniPlayer
}) => {
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverPos, setHoverPos] = useState(0);
    const timelineRef = useRef(null);

    const handleTimelineMouseMove = (e) => {
        if (!timelineRef.current || duration <= 0) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setHoverTime(pct * duration);
        setHoverPos(pct * 100);
    };

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                width: '100%',
                padding: isMobile ? '0.75rem 1rem' : '1.25rem 2rem',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4) 50%, transparent)',
                backdropFilter: 'blur(30px) saturate(180%)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                zIndex: 100,
                opacity: (showControls && !uiHidden) ? 1 : 0,
                transform: (showControls && !uiHidden) ? 'translateY(0)' : 'translateY(100%)',
                pointerEvents: (showControls && !uiHidden) ? 'auto' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
            }}
            onMouseEnter={() => setIsHovering(true)}
        >
            {/* Active Chapter Label */}
            {video?.chapters && activeChapterIndex !== -1 && (
                <div style={{ width: '100%', textAlign: 'center', marginBottom: '0.2rem', padding: '0 1rem' }}>
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        letterSpacing: '0.5px'
                    }}>
                        {video.chapters[activeChapterIndex].title}
                    </span>
                </div>
            )}

            {/* Progress Bar Row */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'right' }}>
                    {formatTime(currentTime)}
                </span>

                <div
                    ref={timelineRef}
                    onMouseMove={handleTimelineMouseMove}
                    onMouseLeave={() => setHoverTime(null)}
                    style={{ flex: 1, position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}
                >
                    {/* Time Tooltip */}
                    {hoverTime !== null && (
                        <div style={{
                            position: 'absolute', bottom: '100%',
                            left: `${hoverPos}%`, transform: 'translateX(-50%)',
                            marginBottom: '8px', background: 'rgb(255,255,255)',
                            color: 'black', padding: '3px 7px', borderRadius: '5px',
                            fontSize: '0.72rem', fontWeight: '700', fontFamily: 'monospace',
                            whiteSpace: 'nowrap', pointerEvents: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 100
                        }}>
                            {formatTime(hoverTime)}
                            <div style={{
                                position: 'absolute', top: '100%', left: '50%',
                                transform: 'translateX(-50%)',
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderTop: '5px solid rgb(255,255,255)'
                            }} />
                        </div>
                    )}
                    {/* Chapter Markers */}
                    {duration > 0 && video?.chapters?.map((chapter, i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: `${(chapter.seconds / duration) * 100}%`,
                                width: '1px',
                                height: '8px',
                                background: 'rgba(255,255,255,0.3)',
                                zIndex: 1,
                                pointerEvents: 'none'
                            }}
                        />
                    ))}
                    <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime || 0}
                        onChange={handleSeekChange}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '2px',
                            appearance: 'none',
                            background: `linear-gradient(to right, var(--primary) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`,
                            cursor: 'pointer',
                            outline: 'none',
                            position: 'relative',
                            zIndex: 2
                        }}
                        className="custom-range"
                    />
                </div>

                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '40px' }}>
                    {formatTime(duration)}
                </span>
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', width: '100%' }}>
                {/* Left Group: Volume & Speed */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, opacity: isLoading ? 0.4 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
                    <button onClick={toggleSpeed} className="icon-btn-deck text-xs font-bold" style={{ width: '40px', fontSize: '0.8rem' }} title="Playback Speed">
                        {playbackRate}x
                    </button>

                    <div className="volume-control" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', opacity: 0.7, transition: 'opacity 0.2s' }}>
                        <div style={{ width: '3px', height: '10px', background: volume > 0 ? 'white' : 'gray', borderRadius: '1px' }} />
                        <div style={{ width: '3px', height: '14px', background: volume > 30 ? 'white' : 'gray', borderRadius: '1px' }} />
                        <div style={{ width: '3px', height: '18px', background: volume > 70 ? 'white' : 'gray', borderRadius: '1px' }} />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={handleVolumeChange}
                            style={{ width: '60px', marginLeft: '0.5rem', accentColor: 'white', height: '4px' }}
                        />
                    </div>
                </div>

                {/* Center Group: Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isLoading ? 0.6 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
                    <button onClick={handlePrevVideo} disabled={currentIndex <= 0} className="icon-btn-deck" style={{ opacity: currentIndex <= 0 ? 0.3 : 1, cursor: currentIndex <= 0 ? 'default' : 'pointer' }}>
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="deck-circle-btn"
                        style={{
                            width: '48px', height: '48px', borderRadius: '50%', background: 'white', color: 'black', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(255,255,255,0.3)'
                        }}
                    >
                        {isLoading ? (
                            <div className="spinner-small" style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid black', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : isPlaying ? (
                            <div style={{ width: '14px', height: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ width: '5px', height: '100%', background: 'black', borderRadius: '2px' }} />
                                <div style={{ width: '5px', height: '100%', background: 'black', borderRadius: '2px' }} />
                            </div>
                        ) : (
                            <Play size={24} fill="black" style={{ marginLeft: '2px' }} />
                        )}
                    </button>

                    <button onClick={handleNextVideo} disabled={currentIndex >= allVideos.length - 1} className="icon-btn-deck" style={{ opacity: currentIndex >= allVideos.length - 1 ? 0.3 : 1, cursor: currentIndex >= allVideos.length - 1 ? 'default' : 'pointer' }}>
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Right Group: Actions & Toggles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setIsHovering(false)}
                        className="icon-btn-deck"
                        title="Hide UI (Click to clear view)"
                    >
                        <EyeOff size={18} />
                    </button>

                    <button
                        onClick={() => setMiniPlayer(!miniPlayer)}
                        className={`icon-btn-deck ${miniPlayer ? 'active' : ''}`}
                        title="Mini Player (P)"
                    >
                        <Monitor size={18} />
                    </button>

                    <button
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeVideoId || video.videoId}`, '_blank')}
                        className="icon-btn-deck"
                        title="Watch on YouTube"
                    >
                        <ExternalLink size={18} />
                    </button>

                    <button
                        onClick={handleToggleFullscreen}
                        className={`icon-btn-deck ${isFullscreen ? 'active' : ''}`}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        <Maximize size={18} />
                    </button>

                    <button
                        onClick={handleToggleComplete}
                        disabled={isFrozen}
                        className={`deck-primary-btn ${isCompleted ? 'completed' : ''}`}
                        title={isFrozen ? "Progress tracking disabled while account is frozen" : (isCompleted ? "Mark Undone" : "Mark Complete")}
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', opacity: isFrozen ? 0.5 : 1, cursor: isFrozen ? 'not-allowed' : 'pointer' }}
                    >
                        <CheckCircle size={16} fill={isCompleted ? "white" : "none"} />
                        <span>{isCompleted ? 'Done' : 'Mark'}</span>
                    </button>

                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>

                    {playlist && playlist.playlistId !== 'SINGLES' && !playlist.playlistId?.startsWith('VIDEO_') && (
                        <button
                            onClick={() => setSidebarTab('playlist')}
                            className={`icon-btn-deck ${showSidebar && sidebarTab === 'playlist' ? 'active' : ''}`}
                            title="Playlist"
                        >
                            <ListIcon size={18} />
                        </button>
                    )}
                    <button
                        onClick={() => setSidebarTab('chapters')}
                        className={`icon-btn-deck ${showSidebar && sidebarTab === 'chapters' ? 'active' : ''}`}
                        title="Video Map"
                    >
                        <Map size={18} />
                    </button>
                    <button
                        onClick={() => setSidebarTab('notes')}
                        className={`icon-btn-deck ${showSidebar && sidebarTab === 'notes' ? 'active' : ''}`}
                        title="Notes"
                    >
                        <FileText size={18} />
                    </button>
                    <button
                        onClick={() => setSidebarTab('resources')}
                        className={`icon-btn-deck ${showSidebar && sidebarTab === 'resources' ? 'active' : ''}`}
                        title="Resources"
                    >
                        <Zap size={18} />
                    </button>
                    <button
                        onClick={() => setSidebarTab('description')}
                        className={`icon-btn-deck ${showSidebar && sidebarTab === 'description' ? 'active' : ''}`}
                        title="About"
                    >
                        <AlignLeft size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FocusControls;
