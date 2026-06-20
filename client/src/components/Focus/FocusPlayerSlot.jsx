import React from 'react';
import YouTube from 'react-youtube';

const FocusPlayerSlot = ({
    mainSlotRef,
    video,
    playerOptions,
    handlePlayerStateChange,
    handlePlayerReady,
    handleVideoEnd,
    isPlaying,
    videoLoading,
}) => {
    return (
        <div
            ref={mainSlotRef}
            id="main-player-slot"
            style={{
                width: '100%', height: '100%',
                position: 'absolute', left: 0, top: 0, zIndex: 0,
                overflow: 'hidden', background: '#000',
            }}
        >
            <div
                className="youtube-player-container"
                style={{ width: '100%', height: '100%', pointerEvents: isPlaying ? 'none' : 'auto' }}
            >
                {(video.youtubeVideoId || video.videoId) ? (
                    <YouTube
                        videoId={video.youtubeVideoId || video.videoId}
                        opts={playerOptions}
                        onStateChange={handlePlayerStateChange}
                        onReady={handlePlayerReady}
                        onEnd={handleVideoEnd}
                        className="youtube-player"
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.3)',
                    }}>
                        Initializing Player...
                    </div>
                )}
            </div>

            {videoLoading && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.5)',
                }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.2)',
                        borderTop: '3px solid var(--primary)',
                        animation: 'spin 1s linear infinite',
                    }} />
                </div>
            )}
        </div>
    );
};

export default FocusPlayerSlot;
