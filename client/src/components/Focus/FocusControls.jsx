import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Play, CheckCircle,
    Eye, EyeOff, Map, AlignLeft, List as ListIcon,
    Maximize, ExternalLink, FileText, Zap, MoreHorizontal,
    Lock, Unlock, BrainCircuit, Users, Layers, X
} from 'lucide-react';
import useFeatureFlags from '../../hooks/useFeatureFlags';

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
    isLocked,
    setIsLocked
}) => {
    const { isEnabled } = useFeatureFlags();
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverPos, setHoverPos] = useState(0);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showMobileSheet, setShowMobileSheet] = useState(false);
    const timelineRef = useRef(null);
    const moreMenuRef = useRef(null);

    useEffect(() => {
        if (!showMoreMenu) return;
        const handleOutsideClick = (e) => {
            if (!moreMenuRef.current) return;
            if (!moreMenuRef.current.contains(e.target)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [showMoreMenu]);

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
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: isMobile ? '34px' : '40px', textAlign: 'right' }}>
                    {formatTime(currentTime)}
                </span>

                <div
                    ref={timelineRef}
                    onMouseMove={handleTimelineMouseMove}
                    onMouseLeave={() => setHoverTime(null)}
                    style={{
                        flex: 1, position: 'relative',
                        height: '20px',
                        display: 'flex', alignItems: 'center',
                        transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
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
                        onChange={isLocked ? null : handleSeekChange}
                        onMouseDown={() => !isLocked && setIsDragging(true)}
                        onMouseUp={() => !isLocked && setIsDragging(false)}
                        disabled={isLocked}
                        style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '4px',
                            appearance: 'none',
                            background: `linear-gradient(to right, var(--primary) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`,
                            cursor: 'pointer',
                            outline: 'none',
                            position: 'relative',
                            zIndex: 2,
                            transition: 'height 0.25s ease'
                        }}
                        className="custom-range"
                    />
                </div>

                <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: isMobile ? '34px' : '40px' }}>
                    {formatTime(duration)}
                </span>
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0.6rem' : '1.5rem', width: '100%' }}>
                {/* Left Group: Volume & Speed */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start', opacity: isLoading ? 0.4 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
                    <button 
                        onClick={() => !isLocked && toggleSpeed()} 
                        disabled={isLocked}
                        className="icon-btn-deck text-xs font-bold" 
                        style={{ width: isMobile ? '52px' : '40px', fontSize: isMobile ? '0.75rem' : '0.8rem', opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }} 
                        title={isLocked ? "Controls Locked" : "Playback Speed"}
                    >
                        {playbackRate}x
                    </button>

                    {!isMobile && <div className="volume-control" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', opacity: 0.7, transition: 'opacity 0.2s' }}>
                        <div style={{ width: '3px', height: '10px', background: volume > 0 ? 'white' : 'gray', borderRadius: '1px' }} />
                        <div style={{ width: '3px', height: '14px', background: volume > 30 ? 'white' : 'gray', borderRadius: '1px' }} />
                        <div style={{ width: '3px', height: '18px', background: volume > 70 ? 'white' : 'gray', borderRadius: '1px' }} />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={handleVolumeChange}
                            disabled={isLocked}
                            style={{ width: '60px', marginLeft: '0.5rem', accentColor: isLocked ? 'gray' : 'white', height: '4px', opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        />
                    </div>}
                </div>

                {/* Center Group: Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem', opacity: isLoading ? 0.6 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
                    <button onClick={handlePrevVideo} disabled={currentIndex <= 0} className="icon-btn-deck" style={{ opacity: currentIndex <= 0 ? 0.3 : 1, cursor: currentIndex <= 0 ? 'default' : 'pointer' }}>
                        <ChevronLeft size={isMobile ? 20 : 24} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="deck-circle-btn"
                        style={{
                            width: isMobile ? '44px' : '48px', height: isMobile ? '44px' : '48px', borderRadius: '50%', background: 'white', color: 'black', border: 'none',
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
                            <Play size={isMobile ? 21 : 24} fill="black" style={{ marginLeft: '2px' }} />
                        )}
                    </button>

                    <button onClick={handleNextVideo} disabled={currentIndex >= allVideos.length - 1} className="icon-btn-deck" style={{ opacity: currentIndex >= allVideos.length - 1 ? 0.3 : 1, cursor: currentIndex >= allVideos.length - 1 ? 'default' : 'pointer' }}>
                        <ChevronRight size={isMobile ? 20 : 24} />
                    </button>
                </div>

                {/* Right Group: Actions & Toggles */}
                {isMobile ? (
                    <>
                        {/* Mobile: compact 4-button strip + More sheet */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                            {/* Mark Complete */}
                            <button
                                onClick={handleToggleComplete}
                                disabled={isFrozen || isLocked}
                                className={`deck-primary-btn ${isCompleted ? 'completed' : ''}`}
                                style={{ flex: 1, padding: '0.4rem 0', fontSize: '0.75rem', opacity: (isFrozen || isLocked) ? 0.5 : 1, cursor: (isFrozen || isLocked) ? 'not-allowed' : 'pointer', justifyContent: 'center' }}
                            >
                                <CheckCircle size={15} fill={isCompleted ? 'white' : 'none'} />
                                <span>{isCompleted ? 'Done' : 'Mark'}</span>
                            </button>

                            {/* Fullscreen */}
                            <button
                                onClick={() => !isLocked && handleToggleFullscreen()}
                                className={`icon-btn-deck ${isFullscreen ? 'active' : ''}`}
                                disabled={isLocked}
                                style={{ opacity: isLocked ? 0.3 : 1 }}
                                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            >
                                <Maximize size={18} />
                            </button>

                            {/* Lock */}
                            {isEnabled('feat_lock_mode') && (
                                <button
                                    onClick={() => setIsLocked(!isLocked)}
                                    className={`icon-btn-deck ${isLocked ? 'active' : ''}`}
                                    title={isLocked ? 'Unlock' : 'Lock'}
                                    style={{ background: isLocked ? 'var(--primary)' : 'transparent', color: isLocked ? 'white' : 'inherit' }}
                                >
                                    {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                                </button>
                            )}

                            {/* More — opens bottom sheet */}
                            <button
                                onClick={() => !isLocked && setShowMobileSheet(true)}
                                className="icon-btn-deck"
                                disabled={isLocked}
                                style={{ opacity: isLocked ? 0.3 : 1 }}
                                title="More options"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                        </div>

                        {/* Bottom sheet overlay */}
                        {showMobileSheet && (
                            <>
                                {/* Backdrop */}
                                <div
                                    onClick={() => setShowMobileSheet(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.55)' }}
                                />
                                {/* Sheet */}
                                <div style={{
                                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9001,
                                    background: 'rgba(10,14,26,0.98)', borderTop: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '20px 20px 0 0', padding: '1rem 1.25rem 2rem',
                                    backdropFilter: 'blur(24px)'
                                }}>
                                    {/* Drag handle */}
                                    <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 1rem' }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>More Options</span>
                                        <button onClick={() => setShowMobileSheet(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Grid of options */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                                        {[
                                            { icon: <FileText size={20} />, label: 'Notes', tab: 'notes', enabled: isEnabled('feat_notes') },
                                            { icon: <Map size={20} />, label: 'Chapters', tab: 'chapters', enabled: true },
                                            ...(playlist && playlist.playlistId !== 'SINGLES' && !playlist.playlistId?.startsWith('VIDEO_')
                                                ? [{ icon: <ListIcon size={20} />, label: 'Playlist', tab: 'playlist', enabled: true }]
                                                : []),
                                            { icon: <Users size={20} />, label: 'Party', tab: 'party', enabled: true },
                                            { icon: <BrainCircuit size={20} />, label: 'AI', tab: 'brainstorm', enabled: isEnabled('feat_ai_brainstorm') },
                                            { icon: <Layers size={20} />, label: 'Cards', tab: 'flashcards', enabled: true },
                                            { icon: <Zap size={20} />, label: 'Resources', tab: 'resources', enabled: true },
                                            { icon: <AlignLeft size={20} />, label: 'About', tab: 'description', enabled: true },
                                        ].filter(o => o.enabled).map(opt => (
                                            <button
                                                key={opt.tab}
                                                onClick={() => { setSidebarTab(opt.tab); setShowSidebar(true); setShowMobileSheet(false); }}
                                                className={`icon-btn-deck ${showSidebar && sidebarTab === opt.tab ? 'active' : ''}`}
                                                style={{ flexDirection: 'column', gap: '0.35rem', height: '64px', fontSize: '0.68rem', fontWeight: 600, borderRadius: '12px', padding: '0.5rem 0', background: showSidebar && sidebarTab === opt.tab ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                            >
                                                {opt.icon}
                                                {opt.label}
                                            </button>
                                        ))}

                                        {/* Utility actions */}
                                        <button
                                            onClick={() => { window.open(`https://www.youtube.com/watch?v=${video?.youtubeVideoId || video?.videoId}`, '_blank'); setShowMobileSheet(false); }}
                                            className="icon-btn-deck"
                                            style={{ flexDirection: 'column', gap: '0.35rem', height: '64px', fontSize: '0.68rem', fontWeight: 600, borderRadius: '12px', padding: '0.5rem 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                        >
                                            <ExternalLink size={20} />
                                            YouTube
                                        </button>
                                        <button
                                            onClick={() => { setIsHovering(false); setShowMobileSheet(false); }}
                                            className="icon-btn-deck"
                                            style={{ flexDirection: 'column', gap: '0.35rem', height: '64px', fontSize: '0.68rem', fontWeight: 600, borderRadius: '12px', padding: '0.5rem 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                        >
                                            <EyeOff size={20} />
                                            Hide UI
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'flex-end', position: 'relative' }}>
                        {/* Watch Party */}
                        <button
                            onClick={() => !isLocked && (setSidebarTab('party'), setShowSidebar(true))}
                            className={`icon-btn-deck ${showSidebar && sidebarTab === 'party' ? 'active' : ''}`}
                            disabled={isLocked}
                            title={isLocked ? "Controls Locked" : "Watch Party"}
                            style={{ opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        >
                            <Users size={18} />
                        </button>

                        <button
                            onClick={() => !isLocked && handleToggleFullscreen()}
                            className={`icon-btn-deck ${isFullscreen ? 'active' : ''}`}
                            disabled={isLocked}
                            title={isLocked ? "Controls Locked" : (isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen")}
                            style={{ opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        >
                            <Maximize size={18} />
                        </button>

                        {isEnabled('feat_lock_mode') && (
                            <button
                                onClick={() => setIsLocked(!isLocked)}
                                className={`icon-btn-deck ${isLocked ? 'active' : ''}`}
                                title={isLocked ? "Unlock Screen" : "Lock Screen Controls"}
                                style={{ background: isLocked ? 'var(--primary)' : 'transparent', color: isLocked ? 'white' : 'inherit' }}
                            >
                                {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                            </button>
                        )}

                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 0.2rem' }}></div>

                        {playlist && playlist.playlistId !== 'SINGLES' && !playlist.playlistId?.startsWith('VIDEO_') && (
                            <button
                                onClick={() => !isLocked && setSidebarTab('playlist')}
                                className={`icon-btn-deck ${showSidebar && sidebarTab === 'playlist' ? 'active' : ''}`}
                                disabled={isLocked}
                                title={isLocked ? "Controls Locked" : "Playlist"}
                                style={{ opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                            >
                                <ListIcon size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => !isLocked && setSidebarTab('chapters')}
                            className={`icon-btn-deck ${showSidebar && sidebarTab === 'chapters' ? 'active' : ''}`}
                            disabled={isLocked}
                            title={isLocked ? "Controls Locked" : "Video Map"}
                            style={{ opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        >
                            <Map size={18} />
                        </button>
                        {isEnabled('feat_notes') && (
                            <button
                                onClick={() => !isLocked && setSidebarTab('notes')}
                                className={`icon-btn-deck ${showSidebar && sidebarTab === 'notes' ? 'active' : ''}`}
                                disabled={isLocked}
                                title={isLocked ? "Controls Locked" : "Notes"}
                                style={{ opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                            >
                                <FileText size={18} />
                            </button>
                        )}
                        {isEnabled('feat_ai_brainstorm') && (
                            <button
                                onClick={() => !isLocked && setSidebarTab('brainstorm')}
                                className={`icon-btn-deck ${showSidebar && sidebarTab === 'brainstorm' ? 'active' : ''}`}
                                disabled={isLocked}
                                title={isLocked ? "Controls Locked" : "Brainstorm"}
                                style={{ opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                            >
                                <BrainCircuit size={18} />
                            </button>
                        )}

                        <button
                            onClick={() => { if (!isLocked) { setSidebarTab('flashcards'); setShowSidebar(true); } }}
                            className={`icon-btn-deck ${showSidebar && sidebarTab === 'flashcards' ? 'active' : ''}`}
                            disabled={isLocked}
                            title={isLocked ? "Controls Locked" : "Flashcards"}
                            style={{ opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        >
                            <Layers size={18} />
                        </button>

                        <button
                            onClick={() => !isLocked && handleToggleComplete()}
                            disabled={isLocked || isFrozen}
                            className={`deck-primary-btn ${isCompleted ? 'completed' : ''}`}
                            title={isLocked ? "Controls Locked" : (isFrozen ? "Progress tracking disabled while account is frozen" : (isCompleted ? "Mark Undone" : "Mark Complete"))}
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', opacity: (isLocked || isFrozen) ? 0.5 : 1, cursor: (isLocked || isFrozen) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                        >
                            <CheckCircle size={16} fill={isCompleted ? "white" : "none"} />
                            <span>{isCompleted ? 'Done' : 'Mark'}</span>
                        </button>


                        <div ref={moreMenuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => !isLocked && setShowMoreMenu(prev => !prev)}
                                className={`icon-btn-deck ${showMoreMenu ? 'active' : ''}`}
                                disabled={isLocked}
                                title={isLocked ? "Controls Locked" : "More options"}
                                style={{ opacity: isLocked ? 0.3 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                            >
                                <MoreHorizontal size={18} />
                            </button>

                            {showMoreMenu && (
                                <div className="glass" style={{
                                    position: 'absolute',
                                    right: 0,
                                    bottom: 'calc(100% + 0.6rem)',
                                    minWidth: '240px',
                                    padding: '0.6rem',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.35rem',
                                    zIndex: 120
                                }}>
                                    <button onClick={() => { setIsHovering(false); setShowMoreMenu(false); }} className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}>
                                        <EyeOff size={15} /> Hide UI
                                    </button>
                                    <button onClick={() => { window.open(`https://www.youtube.com/watch?v=${video.youtubeVideoId || video.videoId}`, '_blank'); setShowMoreMenu(false); }} className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}>
                                        <ExternalLink size={15} /> Watch on YouTube
                                    </button>

                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.2rem 0' }} />
                                    <button onClick={() => { setSidebarTab('resources'); setShowMoreMenu(false); }} className={`btn-secondary ${showSidebar && sidebarTab === 'resources' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}>
                                        <Zap size={15} /> Resources
                                    </button>
                                    <button onClick={() => { setSidebarTab('description'); setShowMoreMenu(false); }} className={`btn-secondary ${showSidebar && sidebarTab === 'description' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}>
                                        <AlignLeft size={15} /> About
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FocusControls;
