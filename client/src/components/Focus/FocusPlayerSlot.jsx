import React from 'react';
import { Play, Maximize2, X, ExternalLink } from 'lucide-react';
import YouTube from 'react-youtube';

const miniBtn = {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    width: '32px', height: '32px',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
};



const FocusPlayerSlot = ({
    mainSlotRef,
    video,
    isMobile,
    playerOptions,
    handlePlayerStateChange,
    handlePlayerReady,
    handleVideoEnd,
    isPlaying,
    videoLoading,
    initialLoading,
    togglePlay,
    miniPlayer,
    onExpandMiniPlayer,
    onCloseMiniPlayer,
    toggleNativePiP,
}) => (
    <>
        {/* Player container */}
        <div
            ref={mainSlotRef}
            id="main-player-slot"
            style={miniPlayer ? {
                position: 'fixed',
                bottom: isMobile ? '5.5rem' : '1.5rem',
                right: isMobile ? '0.8rem' : '1.5rem',
                width: isMobile ? 'min(92vw, 320px)' : '320px',
                height: isMobile ? 'min(52vw, 180px)' : '180px',
                zIndex: 9999,
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.15)',
                background: '#000',
                transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                border: '1px solid rgba(255,255,255,0.1)'
            } : {
                width: '100%',
                height: '100%',
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 0,
                overflow: 'hidden',
                background: '#000',
                transition: 'all 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
        >
            {/* pointer-events: none when playing so clicks fall through to FocusMode parent (togglePlay)
                AND so Chrome's native PiP button stays accessible on the underlying <video> */}
            <div
                className="youtube-player-container"
                style={{
                    width: '100%', height: '100%',
                    pointerEvents: (isPlaying && !miniPlayer) ? 'none' : 'auto'
                }}
            >
                {(video.youtubeVideoId || video.videoId) ? (
                    <YouTube
                        videoId={(video.youtubeVideoId || video.videoId)}
                        opts={playerOptions}
                        onStateChange={handlePlayerStateChange}
                        onReady={handlePlayerReady}
                        onEnd={handleVideoEnd}
                        className="youtube-player"
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            transform: 'scale(1)',
                            transition: 'transform 0.5s ease'
                        }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                        Initializing Player...
                    </div>
                )}
            </div>

            {/* Simple Mini player controls (individual buttons, no full-area overlay) */}
            {miniPlayer && (
                <>
                    {/* Top Right: Close */}
                    <button
                        onClick={e => { e.stopPropagation(); onCloseMiniPlayer(); }}
                        className="mini-hover-btn"
                        title="Exit mini player"
                        style={{
                            position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                            background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
                            width: '26px', height: '26px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s'
                        }}
                    >
                        <X size={14} />
                    </button>

                    <button
                        onClick={e => { e.stopPropagation(); onExpandMiniPlayer(); }}
                        className="mini-hover-btn"
                        title="Back to full player"
                        style={{
                            position: 'absolute', bottom: '8px', right: '8px', zIndex: 10,
                            background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
                            width: '26px', height: '26px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s'
                        }}
                    >
                        <Maximize2 size={13} />
                    </button>

                    {/* Bottom Left: Native PiP */}
                    <button
                        onClick={e => { e.stopPropagation(); toggleNativePiP(); }}
                        className="mini-hover-btn"
                        title="Open Browser Native PiP"
                        style={{
                            position: 'absolute', bottom: '8px', left: '8px', zIndex: 10,
                            background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
                            width: '26px', height: '26px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s'
                        }}
                    >
                        <ExternalLink size={13} />
                    </button>
                    
                    <style>{`
                        #main-player-slot:hover .mini-hover-btn {
                            opacity: 1 !important;
                        }
                    `}</style>
                </>
            )}
        </div>

        {/* Pause overlay — NO blur so on-screen code stays readable */}
        {/* Pause overlay removed as requested */}

        {/* No click mask needed — pointer-events: none on the iframe wrapper
            lets clicks reach the FocusMode parent div which calls togglePlay */}

        {/* Loading overlay */}
        {videoLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: 'rgba(0,0,0,0.5)' }}>
                <div className="spinner" style={{ width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        )}

    </>
);

export default FocusPlayerSlot;
