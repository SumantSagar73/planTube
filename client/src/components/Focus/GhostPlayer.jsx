import React, { useState, useEffect, useRef } from 'react';
import {
    Play, Pause, SkipForward, SkipBack,
    Zap, X, Maximize2, Move
} from 'lucide-react';

const GhostPlayer = ({
    video,
    isPlaying,
    playbackRate,
    onTogglePlay,
    onToggleSpeed,
    onNext,
    onPrev,
    onClose,
    children, // This will be the main YouTube player container
    onPositionChange
}) => {
    const [opacity, setOpacity] = useState(1);
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const ghostRef = useRef(null);

    // Draggable Logic
    const handleMouseDown = (e) => {
        if (e.target.closest('.drag-handle')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragStart.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 250, e.clientY - dragStart.y));
                const newPos = { x: newX, y: newY };
                setPosition(newPos);
                if (onPositionChange) onPositionChange(newPos);
            }
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, onPositionChange]);

    return (
        <div
            ref={ghostRef}
            className="custom-ghost-player"
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '400px',
                height: '225px',
                zIndex: 9999,
                opacity: opacity,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: '#000',
                transition: isDragging ? 'none' : 'opacity 0.3s ease, transform 0.3s ease',
                transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Header / Drag Handle */}
            <div
                className="drag-handle"
                style={{
                    height: '36px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    cursor: 'grab',
                    userSelect: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
                onMouseDown={handleMouseDown}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Move size={14} className="text-zinc-500" />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'white', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {video?.title || "Ghost Player"}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={onClose}
                        className="ghost-close-btn"
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Video Content */}
            <div className="ghost-video-content" style={{ flex: 1, position: 'relative' }}>
                {children}

                {/* Overlay Controls (on hover) */}
                <div className="ghost-controls-overlay">
                    <div className="ghost-row" style={{ justifyContent: 'center', gap: '15px' }}>
                        <button className="ghost-btn" onClick={onPrev}><SkipBack size={16} /></button>
                        <button
                            className="ghost-btn-play"
                            onClick={onTogglePlay}
                        >
                            {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                        </button>
                        <button className="ghost-btn" onClick={onNext}><SkipForward size={16} /></button>
                    </div>

                    <div className="ghost-row" style={{ marginTop: '10px' }}>
                        <button className="ghost-rate-btn" onClick={onToggleSpeed}>
                            {playbackRate}x
                        </button>
                        <div className="ghost-opacity-wrapper">
                            <Zap size={14} style={{ color: opacity < 1 ? '#6366f1' : '#94a3b8' }} />
                            <input
                                type="range"
                                min="0.2" max="1" step="0.05"
                                value={opacity}
                                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                className="ghost-slider"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .ghost-controls-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 20px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                .ghost-video-content:hover .ghost-controls-overlay {
                    opacity: 1;
                    pointer-events: auto;
                }
                .ghost-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .ghost-btn, .ghost-rate-btn {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                    backdrop-filter: blur(5px);
                }
                .ghost-btn:hover, .ghost-rate-btn:hover {
                    background: rgba(255,255,255,0.2);
                    transform: scale(1.05);
                }
                .ghost-btn-play {
                    background: #6366f1;
                    border: none;
                    color: white;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                    transition: all 0.2s;
                }
                .ghost-btn-play:hover {
                    transform: scale(1.1);
                    background: #4f46e5;
                }
                .ghost-rate-btn {
                    font-size: 0.7rem;
                    font-weight: 800;
                    min-width: 40px;
                    justify-content: center;
                }
                .ghost-opacity-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0,0,0,0.4);
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .ghost-slider {
                    width: 60px;
                    height: 4px;
                    appearance: none;
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                    outline: none;
                }
                .ghost-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .ghost-close-btn:hover {
                    background: rgba(239, 68, 68, 0.2) !important;
                    color: #ef4444 !important;
                }
            `}</style>
        </div>
    );
};

export default GhostPlayer;
