import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const SkillTree = ({ videos, schedulesMap }) => {
    // Group videos into rows of 3 for the snake pattern
    const itemsPerRow = 3;
    const rows = [];
    for (let i = 0; i < videos.length; i += itemsPerRow) {
        rows.push(videos.slice(i, i + itemsPerRow));
    }

    return (
        <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '5rem', maxWidth: '1000px', margin: '0 auto' }}>
            {rows.map((row, rowIdx) => {
                const isEvenRow = rowIdx % 2 !== 0;
                return (
                    <div
                        key={rowIdx}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            flexDirection: isEvenRow ? 'row-reverse' : 'row',
                            position: 'relative',
                        }}
                    >
                        {row.map((video, colIdx) => {
                            const absoluteIdx = rowIdx * itemsPerRow + colIdx;
                            const schedule = schedulesMap[video._id];
                            const isCompleted = schedule?.status === 'completed';
                            const isLast = absoluteIdx === videos.length - 1;

                            // Connection logic: 
                            // 1. Right connection: if not last in row-array
                            const showsRightConnection = colIdx < row.length - 1;

                            // 2. Down connection: if last in row-array AND not last video overall
                            const showsDownConnection = colIdx === row.length - 1 && !isLast;

                            return (
                                <div key={video._id} style={{ position: 'relative', width: '260px', flexShrink: 0 }}>
                                    <Link
                                        to={`/focus/${video._id}`}
                                        className="skill-card glass-hover"
                                        style={{
                                            display: 'block',
                                            padding: '1.5rem',
                                            borderRadius: '28px',
                                            background: 'var(--bg-card)',
                                            border: isCompleted ? '2.5px solid #22c55e' : '1px solid var(--glass-border)',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            textAlign: 'center',
                                            zIndex: 2,
                                            position: 'relative',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            boxShadow: isCompleted ? '0 10px 25px rgba(34, 197, 94, 0.15)' : '0 8px 20px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 1.25rem' }}>
                                            <img
                                                src={video.thumbnail}
                                                alt=""
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: `3px solid ${isCompleted ? '#22c55e' : 'rgba(255,255,255,0.05)'}`,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                                                }}
                                            />
                                            {isCompleted && (
                                                <div style={{
                                                    position: 'absolute', bottom: '-4px', right: '-4px',
                                                    width: '26px', height: '26px', borderRadius: '50%',
                                                    background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: '4px solid var(--bg-card)',
                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                                                }}>
                                                    <CheckCircle size={14} color="white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '900', marginBottom: '0.4rem', color: isCompleted ? '#86efac' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {video.title}
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: isCompleted ? '#4ade80' : 'var(--text-muted)', fontWeight: '800', letterSpacing: '1px' }}>
                                            LEVEL {absoluteIdx + 1}
                                        </p>
                                    </Link>

                                    {/* Horizontal Snake Connection */}
                                    {showsRightConnection && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            [isEvenRow ? 'right' : 'left']: '100%',
                                            width: 'calc(100% / 2.5)',
                                            height: '2.5px',
                                            background: isCompleted ? '#22c55e' : 'rgba(255,255,255,0.08)',
                                            zIndex: 1,
                                            transform: 'translateY(-50%)',
                                            opacity: isCompleted ? 0.8 : 0.3
                                        }} />
                                    )}

                                    {/* Vertical Snake Transition */}
                                    {showsDownConnection && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '50%',
                                            width: '2.5px',
                                            height: '5.5rem',
                                            background: isCompleted ? '#22c55e' : 'rgba(255,255,255,0.08)',
                                            zIndex: 1,
                                            transform: 'translateX(-50%)',
                                            opacity: isCompleted ? 0.8 : 0.3
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
            <style>{`
                .skill-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    border-color: var(--primary) !important;
                }
            `}</style>
        </div>
    );
};

export default SkillTree;
