import React, { useState, useRef } from 'react';
import {
    CheckCircle, Map, AlignLeft, List as ListIcon,
    ChevronRight, Play, Users, Copy, Check, Settings,
    FileText, Type, Bold, Italic, ListOrdered, List, Code, Image, Trash2
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
    setAudioTrack,
    currentTime,
    formatTime,
    notes = [],
    onSaveNote,
    onDeleteNote,
    isAddingNote,
    setIsAddingNote,
    noteText,
    setNoteText
}) => {
    const [copyDone, setCopyDone] = useState(false);
    const textareaRef = useRef(null);

    const handleFormat = (type) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        let selected = text.substring(start, end);
        let replacement = '';

        switch (type) {
            case 'bold': replacement = `**${selected}**`; break;
            case 'italic': replacement = `*${selected}*`; break;
            case 'list': replacement = `\n- ${selected}`; break;
            case 'code': replacement = `\`${selected}\``; break;
            default: return;
        }

        const newText = text.substring(0, start) + replacement + text.substring(end);
        setNoteText(newText);
        textarea.focus();
    };

    const renderFormattedText = (text) => {
        return text.split('\n').map((line, i) => (
            <p key={i} style={{ margin: '0.25rem 0' }}>
                {line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) return <strong key={j}>{part.slice(2, -2)}</strong>;
                    if (part.startsWith('*') && part.endsWith('*')) return <em key={j}>{part.slice(1, -1)}</em>;
                    if (part.startsWith('`') && part.endsWith('`')) return <code key={j} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>{part.slice(1, -1)}</code>;
                    return part;
                })}
            </p>
        ));
    };

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
                position: 'relative',
                width: isMobile ? (showSidebar ? '100vw' : '0') : (showSidebar ? '400px' : '0'),
                height: isMobile ? (showSidebar ? '75vh' : '0') : '100vh',
                background: 'rgba(10, 10, 12, 0.98)',
                backdropFilter: 'blur(40px)',
                borderLeft: !showSidebar ? 'none' : (isMobile ? 'none' : '1px solid var(--glass-border)'),
                opacity: showSidebar ? 1 : 0,
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: showSidebar ? '-10px 0 40px rgba(0,0,0,0.5)' : 'none',
                overflow: 'hidden',
                flexShrink: 0
            }}
        >
            <div style={{ width: isMobile ? '100vw' : '400px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>
                            {sidebarTab === 'chapters' ? 'Video Map' : (sidebarTab === 'playlist' ? 'Playlist' : (sidebarTab === 'settings' ? 'Settings' : (sidebarTab === 'notes' ? 'My Notes' : 'About')))}
                        </h3>
                        {compactMode && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                 {playlist && playlist.playlistId !== 'SINGLES' && !playlist.playlistId?.startsWith('VIDEO_') && (
                                    <button onClick={() => setSidebarTab('playlist')} style={{ color: sidebarTab === 'playlist' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Playlist</button>
                                )}
                                <button onClick={() => setSidebarTab('notes')} style={{ color: sidebarTab === 'notes' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Notes</button>
                                <button onClick={() => setSidebarTab('settings')} style={{ color: sidebarTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Settings</button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowSidebar(false)}
                        className="icon-btn-deck"
                        style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)' }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                {sidebarTab === 'chapters' && video.chapters && video.chapters.length > 0 && !compactMode && (
                    <div style={{
                        position: 'sticky',
                        top: '-1.25rem',
                        background: 'rgba(10, 10, 12, 1)',
                        padding: '1.25rem 0',
                        zIndex: 10,
                        marginBottom: '0.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
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
                        <div style={{
                            position: 'sticky',
                            top: '-1.25rem',
                            background: 'rgba(10, 10, 12, 1)',
                            padding: '1.25rem 0.5rem',
                            zIndex: 10,
                            marginBottom: '1rem',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
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
                                        onClick={() => navigate(`/focus/${v._id}${playlist?._id ? `?playlistId=${playlist._id}` : ''}`)}
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
                ) : sidebarTab === 'notes' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {!isAddingNote ? (
                            <button
                                onClick={() => setIsAddingNote(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed var(--primary)',
                                    color: 'var(--primary)', padding: '1rem', borderRadius: '12px',
                                    cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>+</span> Create new note at {formatTime(currentTime)}
                            </button>
                        ) : (
                            <div style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900' }}>
                                            {formatTime(currentTime)}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleFormat('bold')} className="toolbar-btn" title="Bold"><Bold size={14} /></button>
                                            <button onClick={() => handleFormat('italic')} className="toolbar-btn" title="Italic"><Italic size={14} /></button>
                                            <button onClick={() => handleFormat('list')} className="toolbar-btn" title="Bullet List"><List size={14} /></button>
                                            <button onClick={() => handleFormat('code')} className="toolbar-btn" title="Code"><Code size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    autoFocus
                                    placeholder="Keep track of what you learn..."
                                    style={{
                                        width: '100%', minHeight: '120px', background: 'transparent',
                                        border: 'none', color: 'white', padding: '1rem',
                                        fontSize: '0.9rem', outline: 'none', resize: 'vertical'
                                    }}
                                />
                                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
                                    <button
                                        onClick={() => { setIsAddingNote(false); setNoteText(''); }}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (noteText.trim()) {
                                                onSaveNote(noteText);
                                                setNoteText('');
                                                setIsAddingNote(false);
                                            }
                                        }}
                                        disabled={!noteText.trim()}
                                        style={{
                                            background: noteText.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                            color: 'white', border: 'none', padding: '0.4rem 1rem',
                                            borderRadius: '8px', cursor: noteText.trim() ? 'pointer' : 'default',
                                            fontSize: '0.85rem', fontWeight: '700'
                                        }}
                                    >
                                        Save note
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {notes.length > 0 ? (
                                notes.map((note) => (
                                    <div
                                        key={note.id}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            padding: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <button
                                                onClick={() => handleSeek(note.time)}
                                                style={{
                                                    background: 'var(--primary)', color: 'white', border: 'none',
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem',
                                                    fontWeight: '800', cursor: 'pointer'
                                                }}
                                            >
                                                {formatTime(note.time)}
                                            </button>
                                            <button
                                                onClick={() => onDeleteNote(note.id)}
                                                style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer' }}
                                                title="Delete note"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6', wordBreak: 'break-word' }}>
                                            {renderFormattedText(note.text)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.3 }}>
                                    <FileText size={48} style={{ marginBottom: '1rem' }} />
                                    <p style={{ fontSize: '0.9rem' }}>No notes yet. Capture your thoughts!</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    </div>
                )}
            </div>
            <style>{`
                .toolbar-btn {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.5);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .toolbar-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
            `}</style>
        </div>
    </div>
);
};

export default FocusSidebar;
