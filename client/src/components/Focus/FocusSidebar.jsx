import React, { useState, useRef, useEffect } from 'react';
import { getAIHeaders } from '../../utils/aiConfig';
import useFeatureFlags from '../../hooks/useFeatureFlags';
import {
    CheckCircle, Map, AlignLeft, List as ListIcon,
    ChevronRight, Play, Users, Copy, Check, Settings,
    FileText, Type, Bold, Italic, ListOrdered, List, Code, Image, Trash2, Zap,
    Tag, X, ExternalLink, RefreshCw, Pencil, Lightbulb, Sparkles, BrainCircuit, Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AdSense from '../Shared/AdSense';
import api from '../../services/api';
import WatchPartyPanel from './WatchPartyPanel';

// ─── Flashcard Panel ──────────────────────────────────────────────────────────
const FlashcardPanel = ({ videoId, notes }) => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [idx, setIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadCards();
    }, [videoId]);

    const loadCards = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/videos/${videoId}/flashcards`);
            setCards(res.data?.flashcards || []);
        } catch { setCards([]); }
        finally { setLoading(false); }
    };

    const generate = async () => {
        setGenerating(true); setError('');
        try {
            const notesText = (notes || []).map(n => n.text).join('\n');
            const res = await api.post(`/videos/${videoId}/generate-flashcards`, { notesText }, { headers: getAIHeaders() });
            setCards(res.data?.flashcards || []);
            setIdx(0); setFlipped(false);
        } catch (e) {
            setError(e.response?.data?.msg || 'Failed to generate flashcards.');
        }
        finally { setGenerating(false); }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>;

    if (cards.length === 0) return (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <BrainCircuit size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1rem', margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                No flashcards yet. Generate them from your notes or the video description.
            </p>
            {error && <p style={{ color: '#f87171', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{error}</p>}
            <button onClick={generate} disabled={generating} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <Sparkles size={14} /> {generating ? 'Generating...' : 'Generate with AI'}
            </button>
        </div>
    );

    const card = cards[idx];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Card */}
            <div
                onClick={() => setFlipped(f => !f)}
                style={{
                    minHeight: '160px', borderRadius: '16px', cursor: 'pointer',
                    background: flipped ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${flipped ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '1.5rem', textAlign: 'center',
                    transition: 'background 0.25s, border 0.25s'
                }}
            >
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {flipped ? 'Answer' : 'Question'} · tap to flip
                </div>
                <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'white', lineHeight: 1.5, margin: 0 }}>
                    {flipped ? card.answer : card.question}
                </p>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); }}
                    disabled={idx === 0}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 14px', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>
                    ←
                </button>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{idx + 1} / {cards.length}</span>
                <button onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
                    disabled={idx === cards.length - 1}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 14px', cursor: idx === cards.length - 1 ? 'default' : 'pointer', opacity: idx === cards.length - 1 ? 0.3 : 1 }}>
                    →
                </button>
            </div>

            {/* Regenerate */}
            <button onClick={generate} disabled={generating} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)',
                borderRadius: '10px', padding: '6px', cursor: 'pointer', fontSize: '0.72rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
            }}>
                <RefreshCw size={12} /> {generating ? 'Generating...' : 'Regenerate'}
            </button>
        </div>
    );
};


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
    onEditNote,
    editingNoteId,
    onCancelNote,
    isAddingNote,
    setIsAddingNote,
    noteText,
    setNoteText,
    glassBlur,
    setGlassBlur,
    accentColor,
    setAccentColor,
    isLocked,
    onUpdateChapters,
    onUpdateVideo,
    isFrozen,
    onPauseVideo,
    brainstormPlan = '',
    isBrainstormLoading = false,
    onRegenerateBrainstorm,
    suggestedQuestions = [],
    chatMessages = [],
    isChatLoading = false,
    onSendMessage,
    // Watch Party (embedded tab)
    partyVideoId,
    partyUserId,
    partyPlayerRef,
    partyIsPlaying,
    partySetIsPlaying,
}) => {
    const { isEnabled } = useFeatureFlags();
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);
    const [copyPlanDone, setCopyPlanDone] = useState(false);
    const [copyMsgDone, setCopyMsgDone] = useState(null); // stores index of message being copied
    const [copyDone, setCopyDone] = useState(false);
    const [isEditingChapters, setIsEditingChapters] = useState(false);
    const [editableChapters, setEditableChapters] = useState([]);
    
    // Word count calculation for notes
    const currentWordCount = noteText ? noteText.trim().split(/\s+/).filter(Boolean).length : 0;
    const isOverLimit = currentWordCount > 1000;

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);
    const [newChapter, setNewChapter] = useState({ title: '', timestamp: '' });
    
    // Keywords (Tags) state
    const [tempTag, setTempTag] = useState('');
    
    // Custom Resources state
    const [isAddingResource, setIsAddingResource] = useState(false);
    const [newResource, setNewResource] = useState({ label: '', url: '' });

    const handleDownloadNotes = () => {
        if (!notes || notes.length === 0) return;
        
        let content = `# Notes for: ${video?.title || 'Video'}\n`;
        content += `Source: https://www.youtube.com/watch?v=${video?.youtubeVideoId || video?.videoId}\n`;
        content += `Exported on: ${new Date().toLocaleString()}\n\n`;
        content += `---\n\n`;
        
        notes.forEach(note => {
            content += `### [${formatTime(note.time)}]\n${note.text}\n\n`;
        });
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(video?.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadAllNotes = () => {
        let content = `# All My Video Notes (planTube)\n`;
        content += `Exported on: ${new Date().toLocaleString()}\n\n`;
        content += `This file contains notes consolidated from all videos you've watched.\n\n`;
        
        let found = false;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('notes_')) {
                found = true;
                const videoNotes = JSON.parse(localStorage.getItem(key));
                if (videoNotes.length === 0) continue;
                
                const vidId = key.replace('notes_', '');
                content += `## Video ID: ${vidId}\n`;
                videoNotes.forEach(note => {
                    content += `### [${formatTime(note.time)}]\n${note.text}\n\n`;
                });
                content += `\n---\n\n`;
            }
        }
        
        if (!found) {
            alert("No notes found to export.");
            return;
        }
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantube_all_notes_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        if (!notes || notes.length === 0) return;

        // Create a temporary container for PDF content
        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.color = '#333';
        element.style.fontFamily = "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        element.style.lineHeight = '1.6';

        // Basic Markdown to HTML converter for Brainstorm section
        const mdToHtml = (md) => {
            if (!md) return '';
            return md
                .replace(/^### (.*$)/gim, '<h3 style="color:' + accentColor + '; margin-top: 20px; font-size: 16px; font-weight: 800;">$1</h3>')
                .replace(/^## (.*$)/gim, '<h2 style="color:' + accentColor + '; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 28px; font-size: 18px; font-weight: 900;">$1</h2>')
                .replace(/^# (.*$)/gim, '<h1 style="color:' + accentColor + '; font-size: 22px; font-weight: 900;">$1</h1>')
                .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 6px; font-size: 13px;">$1</li>')
                .replace(/^\- (.*$)/gim, '<li style="margin-bottom: 6px; font-size: 13px;">$1</li>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*)\*/gim, '<em>$1</em>')
                .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" style="color:' + accentColor + '; text-decoration: none;">$1</a>')
                .replace(/\n\n/g, '<p style="margin-bottom: 10px;"></p>')
                .replace(/\n/g, '<br/>');
        };

        let htmlContent = `
            <div style="border-bottom: 3px solid ${accentColor}; padding-bottom: 20px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h1 style="margin: 0; color: ${accentColor}; font-size: 28px; font-weight: 900; letter-spacing: -1px;">planTube</h1>
                    <div style="text-align: right; font-size: 10px; color: #999;">PERSONAL LEARNING REPORT</div>
                </div>
                <div style="margin-top: 20px;">
                    <p style="margin: 0; font-size: 20px; font-weight: 800; color: #000; line-height: 1.2;">${video?.title || 'Video Notes'}</p>
                    <p style="margin: 8px 0 0 0; font-size: 11px; color: #666;"><strong>Channel:</strong> ${video?.author || 'Unknown Author'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;"><strong>Link:</strong> https://www.youtube.com/watch?v=${video?.youtubeVideoId || video?.videoId}</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                </div>
            </div>
            <div style="margin-bottom: 40px;">
                <h2 style="font-size: 16px; color: #000; background: #f4f4f5; padding: 8px 15px; border-radius: 8px; margin-bottom: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Video Overview</h2>
                <div style="font-size: 13px; color: #555; background: #fff; border-left: 4px solid ${accentColor}; padding: 15px 20px; border-radius: 0 12px 12px 0; line-height: 1.6; margin-bottom: 30px;">
                    ${video?.description ? video.description.slice(0, 500) + (video.description.length > 500 ? '...' : '') : 'No description available for this video.'}
                </div>
            </div>
            
            <div style="margin-bottom: 40px;">
                <h2 style="font-size: 16px; color: #000; background: #f4f4f5; padding: 8px 15px; border-radius: 8px; margin-bottom: 25px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">My Timestamped Notes</h2>
                <div style="display: flex; flex-direction: column; gap: 25px;">
        `;

        notes.forEach(note => {
            htmlContent += `
                <div style="margin-bottom: 24px; page-break-inside: avoid;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                        <span style="background: ${accentColor}; color: white; padding: 3px 12px; border-radius: 6px; font-size: 12px; font-weight: 900; font-family: monospace;">
                            ${formatTime(note.time)}
                        </span>
                        <span style="height: 1px; flex: 1; background: #eee;"></span>
                    </div>
                    <div style="font-size: 14px; color: #333; white-space: pre-wrap; padding: 0 5px; line-height: 1.7;">
                        ${note.text}
                    </div>
                </div>
            `;
        });

        htmlContent += `</div></div>`;

        // Include AI Brainstorm if it exists
        if (brainstormPlan && brainstormPlan.trim()) {
            htmlContent += `
                <div style="margin-top: 40px; page-break-before: always; border-top: 2px solid ${accentColor}10; padding-top: 30px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px;">
                        <div style="background: ${accentColor}; color: white; padding: 10px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 .94 4.96 2.5 2.5 0 0 0 4.01 1.5M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1-.94 4.96 2.5 2.5 0 0 1-4.01 1.5M12 4.5V21m0-16.5L9 7m3-2.5 3 2.5M12 21l-3-2.5m3 2.5 3-2.5"/></svg>
                        </div>
                        <h2 style="font-size: 22px; color: #000; margin: 0; font-weight: 950; letter-spacing: -0.5px;">AI Brainstorming & Summary</h2>
                    </div>
                    <div style="font-size: 14px; color: #333; background: #fff; padding: 0; border-radius: 0; line-height: 1.8;">
                        ${mdToHtml(brainstormPlan)}
                    </div>
                </div>
            `;
        }

        element.innerHTML = htmlContent;

        const opt = {
            margin:       15,
            filename:     `${(video?.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Load html2pdf and generate
        const generate = () => {
            window.html2pdf().from(element).set(opt).save().then(() => {
                if (btn) {
                    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> <span style="font-size: 0.75rem; font-weight: 800;">Export PDF</span>`;
                    btn.disabled = false;
                }
            });
        };

        if (window.html2pdf) {
            generate();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = generate;
            document.head.appendChild(script);
        }
    };

    const textareaRef = useRef(null);

    const startEditing = () => {
        setEditableChapters(video.chapters || []);
        setIsEditingChapters(true);
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tempTag.trim()) {
            const currentTags = video.tags || [];
            if (!currentTags.includes(tempTag.trim())) {
                onUpdateVideo({ tags: [...currentTags, tempTag.trim()] });
            }
            setTempTag('');
        }
    };

    const handleRemoveTag = (tag) => {
        const currentTags = video.tags || [];
        onUpdateVideo({ tags: currentTags.filter(t => t !== tag) });
    };

    const handleAddResource = () => {
        if (!newResource.label || !newResource.url) return;
        const currentResources = video.customResources || [];
        onUpdateVideo({ customResources: [...currentResources, newResource] });
        setNewResource({ label: '', url: '' });
        setIsAddingResource(false);
    };

    const handleRemoveResource = (idx) => {
        const currentResources = video.customResources || [];
        onUpdateVideo({ customResources: currentResources.filter((_, i) => i !== idx) });
    };

    const handleMarkCurrentTime = () => {
        const timeStr = formatTime(currentTime);
        setNewChapter({ ...newChapter, timestamp: timeStr });
    };

    const addChapter = () => {
        if (!newChapter.title || !newChapter.timestamp) return;
        
        // Parse timestamp string to seconds for sorting
        const parts = newChapter.timestamp.split(':').reverse();
        let seconds = 0;
        if (parts[0]) seconds += parseInt(parts[0]);
        if (parts[1]) seconds += parseInt(parts[1]) * 60;
        if (parts[2]) seconds += parseInt(parts[2]) * 3600;

        const updated = [...editableChapters, { ...newChapter, seconds }];
        updated.sort((a, b) => a.seconds - b.seconds);
        setEditableChapters(updated);
        setNewChapter({ title: '', timestamp: '' });
    };

    const removeChapter = (idx) => {
        setEditableChapters(editableChapters.filter((_, i) => i !== idx));
    };

    const saveChapters = () => {
        onUpdateChapters(editableChapters);
        setIsEditingChapters(false);
    };

    const copyForYouTube = () => {
        const text = editableChapters.length > 0 ? editableChapters : (video.chapters || []);
        const formatted = text.map(c => `${c.timestamp} ${c.title}`).join('\n');
        navigator.clipboard.writeText(formatted).then(() => {
            setCopyDone(true);
            setTimeout(() => setCopyDone(false), 2000);
        });
    };

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

    const extractLinks = (text) => {
        if (!text) return [];
        const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;
        const matches = text.match(urlRegex) || [];
        return Array.from(new Set(matches)).map(url => {
            const label = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
            return { url, label };
        });
    };

    const resources = extractLinks(video.description);

    if (!video) return null;

    return (
        <div
            style={{
                position: 'relative',
                width: isMobile ? (showSidebar ? '100vw' : '0') : (showSidebar ? '400px' : '0'),
                height: isMobile ? (showSidebar ? '75vh' : '0') : '100vh',
                background: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(30px) saturate(180%)',
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
                            {sidebarTab === 'chapters' ? 'Video Map' : sidebarTab === 'playlist' ? 'Playlist' : sidebarTab === 'settings' ? 'Settings' : sidebarTab === 'notes' ? 'My Notes' : sidebarTab === 'resources' ? 'Resources' : sidebarTab === 'flashcards' ? 'Flashcards' : sidebarTab === 'brainstorm' ? 'AI Brainstorm' : sidebarTab === 'party' ? 'Watch Party' : 'About'}
                        </h3>
                        {compactMode && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                 {playlist && playlist.playlistId !== 'SINGLES' && !playlist.playlistId?.startsWith('VIDEO_') && (
                                    <button onClick={() => setSidebarTab('playlist')} style={{ color: sidebarTab === 'playlist' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Playlist</button>
                                )}
                                {isEnabled('feat_notes') && (
                                    <button onClick={() => setSidebarTab('notes')} style={{ color: sidebarTab === 'notes' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Notes</button>
                                )}
                                {isEnabled('feat_ai_brainstorm') && (
                                    <button onClick={() => setSidebarTab('brainstorm')} style={{ color: sidebarTab === 'brainstorm' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Brainstorm</button>
                                )}
                                <button onClick={() => setSidebarTab('resources')} style={{ color: sidebarTab === 'resources' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Resources</button>
                                <button onClick={() => setSidebarTab('flashcards')} style={{ color: sidebarTab === 'flashcards' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Flashcards</button>
                                {partyVideoId && <button onClick={() => setSidebarTab('party')} style={{ color: sidebarTab === 'party' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Party</button>}
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
                {sidebarTab === 'chapters' ? (
                    <>
                        {/* Keyword Tagging UI */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Keywords & Tags</span>
                                <Tag size={14} style={{ opacity: 0.4 }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {(video.tags || []).map(tag => (
                                    <div 
                                        key={tag}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                                            color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem'
                                        }}
                                    >
                                        #{tag}
                                        <X 
                                            size={12} 
                                            style={{ cursor: 'pointer', opacity: 0.5 }} 
                                            onClick={() => handleRemoveTag(tag)}
                                        />
                                    </div>
                                ))}
                                <input 
                                    type="text"
                                    placeholder="+ tag..."
                                    value={tempTag}
                                    onChange={e => setTempTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    style={{
                                        background: 'none', border: 'none', color: 'white',
                                        fontSize: '0.75rem', outline: 'none', width: '80px',
                                        padding: '2px 0'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Video Mapping</span>
                            {!isEditingChapters ? (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={copyForYouTube}
                                        className="glass-hover"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        {copyDone ? <Check size={14} /> : <Copy size={14} />}
                                        {copyDone ? 'Copied' : 'Copy for YT'}
                                    </button>
                                    <button 
                                        onClick={startEditing}
                                        className="glass-hover"
                                        style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Edit Map
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => setIsEditingChapters(false)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={saveChapters}
                                        style={{ background: '#22c55e', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Save Map
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditingChapters && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <input 
                                        placeholder="00:00" 
                                        value={newChapter.timestamp}
                                        onChange={e => setNewChapter({ ...newChapter, timestamp: e.target.value })}
                                        style={{ width: '70px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.4rem', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                    <button 
                                        onClick={handleMarkCurrentTime}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--primary)', padding: '0 0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                                        title="Use current player time"
                                    >
                                        <Zap size={14} fill="currentColor" />
                                    </button>
                                    <input 
                                        placeholder="Chapter Title..." 
                                        value={newChapter.title}
                                        onChange={e => setNewChapter({ ...newChapter, title: e.target.value })}
                                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.4rem', borderRadius: '8px', fontSize: '0.85rem' }}
                                        onKeyDown={e => e.key === 'Enter' && addChapter()}
                                    />
                                    <button 
                                        onClick={addChapter}
                                        style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                    >
                                        +
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Tip: Click the lightning icon to capture current player time</p>
                            </div>
                        )}

                        {isEditingChapters ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {editableChapters.map((chapter, idx) => (
                                    <div 
                                        key={idx}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}
                                    >
                                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', minWidth: '45px' }}>{chapter.timestamp}</span>
                                        <span style={{ flex: 1, fontSize: '0.85rem', color: 'white' }}>{chapter.title}</span>
                                        <button 
                                            onClick={() => removeChapter(idx)}
                                            style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {editableChapters.length === 0 && <p style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.8rem', padding: '1rem' }}>No chapters added yet.</p>}
                            </div>
                        ) : (
                            <>
                                {video.chapters && video.chapters.length > 0 && !compactMode && (
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
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            if (!isFrozen) toggleChapter(idx); 
                                                        }}
                                                        disabled={isFrozen}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: isFrozen ? 'not-allowed' : 'pointer',
                                                            color: isDone ? '#22c55e' : 'rgba(255,255,255,0.2)',
                                                            display: 'flex',
                                                            padding: '0.4rem',
                                                            borderRadius: '10px',
                                                            transition: 'all 0.2s',
                                                            zIndex: 2,
                                                            marginLeft: isActive ? '0.5rem' : '0',
                                                            opacity: isFrozen ? 0.5 : 1
                                                        }}
                                                        className={isFrozen ? "" : "hover-bg-glass"}
                                                        title={isFrozen ? "Progress tracking disabled while account is frozen" : (isDone ? "Mark as incomplete" : "Mark as complete")}
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
                        )}
                    </>
                ) : sidebarTab === 'playlist' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.7rem' : '1rem' }}>
                        <div style={{
                            position: 'sticky',
                            top: 0,
                            background: 'rgba(10, 10, 12, 1)',
                            padding: isMobile ? '0.8rem 0.35rem' : '1.25rem 0.5rem',
                            zIndex: 10,
                            marginBottom: isMobile ? '0.55rem' : '1rem',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-muted)' }}>
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.45rem' : '0.5rem' }}>
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
                                            padding: isMobile ? '0.6rem' : '0.75rem', borderRadius: isMobile ? '10px' : '12px',
                                            background: isActive ? 'var(--primary)' : (isDone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.02)'),
                                            border: isActive ? '1px solid var(--primary)' : (isDone ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'),
                                            cursor: 'pointer', display: 'flex', gap: isMobile ? '0.6rem' : '0.75rem', alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', fontWeight: '900', color: isActive ? 'white' : (isDone ? '#4ade80' : 'var(--text-muted)'), minWidth: isMobile ? '16px' : '20px', textAlign: 'center' }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{ width: isMobile ? '56px' : '70px', height: isMobile ? '32px' : '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', flexShrink: 0 }}>
                                            <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: '600', color: isActive ? 'white' : (isDone ? '#86efac' : 'var(--text-main)'), whiteSpace: isMobile ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 1, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>{v.title}</p>
                                            <p style={{ fontSize: isMobile ? '0.66rem' : '0.7rem', color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', marginTop: '0.2rem' }}>{v.duration}</p>
                                        </div>
                                        {isActive && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: isMobile ? '0.15rem 0.4rem' : '0.2rem 0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                                                <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }}></div>
                                                <span style={{ fontSize: isMobile ? '0.64rem' : '0.7rem', fontWeight: '800', color: 'white' }}>{presenceCount} Live</span>
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
                        {/* Appearance Section */}
                        <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Appearance</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>Glass Blur</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '800' }}>{glassBlur}px</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="80" value={glassBlur} 
                                        onChange={(e) => setGlassBlur(parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                                    />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>Accent Color</span>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: accentColor, border: '2px solid white' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['#6366f1', '#ec4899', '#22c55e', '#eab308', '#ef4444', '#06b6d4', '#8b5cf6'].map(color => (
                                            <button 
                                                key={color}
                                                onClick={() => setAccentColor(color)}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                    background: color, border: accentColor === color ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                                                    cursor: 'pointer', transition: 'transform 0.2s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

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

                        {/* Data Portability Section */}
                        <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Download size={14} /> Data Portability
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                                Export all your timestamped notes across all videos into a single Markdown file for your second brain.
                            </p>
                            <button 
                                onClick={handleDownloadAllNotes}
                                className="btn-primary"
                                style={{ 
                                    width: '100%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '0.6rem',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    fontWeight: '700',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <Download size={16} />
                                Export All Video Notes
                            </button>
                        </div>
                    </div>
                ) : (sidebarTab === 'brainstorm' && isEnabled('feat_ai_brainstorm')) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-0.5rem' }}>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(brainstormPlan);
                                    setCopyPlanDone(true);
                                    setTimeout(() => setCopyPlanDone(false), 2000);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', opacity: 0.8 }}
                            >
                                {copyPlanDone ? <Check size={14} /> : <Copy size={14} />}
                                {copyPlanDone ? 'Copied!' : 'Copy Plan'}
                            </button>
                            
                            <button 
                                onClick={onRegenerateBrainstorm}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', opacity: isBrainstormLoading ? 0.5 : 0.8 }}
                                disabled={isBrainstormLoading}
                            >
                                <RefreshCw size={14} className={isBrainstormLoading ? 'spin' : ''} />
                                Regenerate
                            </button>
                        </div>
                        {isBrainstormLoading ? (
                            <div style={{ padding: '6rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="neural-loader">
                                    <div className="neural-circle"></div>
                                    <div className="neural-circle"></div>
                                    <div className="neural-circle"></div>
                                    <BrainCircuit size={40} className="neural-icon" />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '2rem', background: 'linear-gradient(90deg, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Generating Video Insights
                                </h3>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.5rem', maxWidth: '240px' }}>
                                    Extracting key concepts, building a study roadmap, and preparing actionable next steps...
                                </p>
                            </div>
                        ) : brainstormPlan ? (
                            <div className="brainstorm-content" style={{ 
                                fontSize: '0.95rem', 
                                color: 'rgba(255,255,255,0.9)', 
                                lineHeight: '1.7',
                                padding: '0.5rem'
                            }}>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                    h1: ({node, ...props}) => <h1 style={{fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.2rem', marginTop: '1rem', borderLeft: '4px solid var(--primary)', paddingLeft: '0.8rem'}} {...props} />,
                                    h2: ({node, ...props}) => <h2 style={{fontSize: '1.2rem', color: 'white', marginTop: '2rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px'}} {...props} />,
                                    h3: ({node, ...props}) => <h3 style={{fontSize: '1.1rem', color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.8rem'}} {...props} />,
                                    ul: ({node, ...props}) => <ul style={{paddingLeft: '1.2rem', marginBottom: '1.5rem', listStyleType: 'disc'}} {...props} />,
                                    li: ({node, ...props}) => <li style={{marginBottom: '0.8rem', color: 'rgba(255,255,255,0.8)'}} {...props} />,
                                    p: ({node, ...props}) => <p style={{marginBottom: '1.2rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6'}} {...props} />,
                                    code: ({node, ...props}) => <code style={{background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem'}} {...props} />,
                                    strong: ({node, ...props}) => <strong style={{color: 'white', fontWeight: '700'}} {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid rgba(255,255,255,0.1)', paddingLeft: '1rem', margin: '1rem 0', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)'}} {...props} />,
                                    table: ({node, ...props}) => (
                                        <div style={{ 
                                            overflowX: 'auto', 
                                            marginBottom: '1.5rem', 
                                            borderRadius: '12px', 
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.02)'
                                        }}>
                                            <table style={{ 
                                                width: '100%', 
                                                borderCollapse: 'collapse', 
                                                fontSize: '0.82rem',
                                                textAlign: 'left'
                                            }} {...props} />
                                        </div>
                                    ),
                                    th: ({node, ...props}) => (
                                        <th style={{ 
                                            background: 'rgba(255,255,255,0.08)', 
                                            color: 'white', 
                                            padding: '0.75rem 0.6rem', 
                                            borderBottom: '2px solid rgba(255,255,255,0.1)', 
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontSize: '0.75rem'
                                        }} {...props} />
                                    ),
                                    td: ({node, ...props}) => (
                                        <td style={{ 
                                            padding: '0.75rem 0.6rem', 
                                            borderBottom: '1px solid rgba(255,255,255,0.05)', 
                                            color: 'rgba(255,255,255,0.8)',
                                            verticalAlign: 'top'
                                        }} {...props} />
                                    ),
                                    tr: ({node, ...props}) => (
                                        <tr style={{ 
                                            transition: 'background 0.2s'
                                        }} 
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        {...props} />
                                    ),
                                }}>
                                    {brainstormPlan}
                                </ReactMarkdown>

                            </div>
                        ) : (
                            <div style={{ padding: '4rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                                <Lightbulb size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                                <p style={{ fontSize: '1rem', fontWeight: '600' }}>Ready to Brainstorm?</p>
                                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Click the AI button to generate a step-by-step plan from this video.</p>
                            </div>
                        )}

                        {/* Always-on Chat Section */}
                        {isEnabled('feat_ai_chat') && !isBrainstormLoading && (
                            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px' }}>
                                        <BrainCircuit size={20} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>Brainstorm Lab</h3>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} style={{ 
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '92%',
                                            background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                                            padding: '0.8rem 1.1rem',
                                            borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                            fontSize: '0.9rem',
                                            color: 'rgba(255,255,255,0.95)',
                                            lineHeight: '1.6',
                                            boxShadow: msg.role === 'user' ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
                                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({node, ...props}) => <p style={{marginBottom: '0.8rem'}} {...props} />,
                                                    strong: ({node, ...props}) => <strong style={{color: 'white', fontWeight: '700'}} {...props} />,
                                                    h1: ({node, ...props}) => <h1 style={{fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: '800'}} {...props} />,
                                                    h2: ({node, ...props}) => <h2 style={{fontSize: '0.95rem', color: 'white', marginBottom: '0.4rem', fontWeight: '700'}} {...props} />,
                                                    ul: ({node, ...props}) => <ul style={{paddingLeft: '1.2rem', marginBottom: '0.8rem', listStyleType: 'disc'}} {...props} />,
                                                    ol: ({node, ...props}) => <ol style={{paddingLeft: '1.2rem', marginBottom: '0.8rem', listStyleType: 'decimal'}} {...props} />,
                                                    li: ({node, ...props}) => <li style={{marginBottom: '0.4rem'}} {...props} />,
                                                    code: ({node, ...props}) => <code style={{background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--primary)'}} {...props} />,
                                                    table: ({node, ...props}) => (
                                                        <div style={{ 
                                                            overflowX: 'auto', 
                                                            marginBottom: '1.5rem', 
                                                            borderRadius: '12px', 
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            background: 'rgba(255,255,255,0.02)'
                                                        }}>
                                                            <table style={{ 
                                                                width: '100%', 
                                                                borderCollapse: 'collapse', 
                                                                fontSize: '0.82rem',
                                                                textAlign: 'left'
                                                            }} {...props} />
                                                        </div>
                                                    ),
                                                    th: ({node, ...props}) => (
                                                        <th style={{ 
                                                            background: 'rgba(255,255,255,0.08)', 
                                                            color: 'white', 
                                                            padding: '0.75rem 0.6rem', 
                                                            borderBottom: '2px solid rgba(255,255,255,0.1)', 
                                                            fontWeight: '800',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            fontSize: '0.75rem'
                                                        }} {...props} />
                                                    ),
                                                    td: ({node, ...props}) => (
                                                        <td style={{ 
                                                            padding: '0.75rem 0.6rem', 
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)', 
                                                            color: 'rgba(255,255,255,0.8)',
                                                            verticalAlign: 'top'
                                                        }} {...props} />
                                                    ),
                                                    tr: ({node, ...props}) => (
                                                        <tr style={{ 
                                                            transition: 'background 0.2s'
                                                        }} 
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        {...props} />
                                                    ),
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ))}
                                    {isChatLoading && <div className="typing-dot"></div>}
                                    <div ref={chatEndRef} />
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && onSendMessage(chatInput)}
                                        placeholder="Ask a question..."
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.6rem 1rem', color: 'white' }}
                                    />
                                    <button onClick={() => onSendMessage(chatInput)} className="icon-btn-deck" style={{ background: 'var(--primary)', color: 'white' }}>
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (sidebarTab === 'notes' && isEnabled('feat_notes')) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px' }}>
                                    <FileText size={20} style={{ color: 'var(--primary)' }} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'white' }}>My Notes</h3>
                            </div>
                            
                                <button 
                                    id="export-pdf-btn"
                                    onClick={handleExportPDF}
                                    disabled={notes.length === 0}
                                    className="icon-btn-deck"
                                    title={notes.length === 0 ? "No notes to export" : "Download PDF Report"}
                                    style={{ 
                                        padding: '0.5rem 0.8rem', 
                                        background: notes.length === 0 ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        cursor: notes.length === 0 ? 'default' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        opacity: notes.length === 0 ? 0.5 : 1,
                                        boxShadow: notes.length === 0 ? 'none' : '0 4px 15px rgba(99,102,241,0.3)'
                                    }}
                                >
                                    <FileText size={18} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>Export PDF</span>
                                </button>
                        </div>

                        {!isAddingNote ? (
            <button
                onClick={() => { if (!isLocked) { setIsAddingNote(true); onPauseVideo?.(); } }}
                disabled={isLocked}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed var(--primary)',
                    color: 'var(--primary)', padding: '1rem', borderRadius: '12px',
                    cursor: isLocked ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.9rem',
                    opacity: isLocked ? 0.5 : 1
                }}
            >
                <span style={{ fontSize: '1.2rem' }}>+</span> {editingNoteId ? 'Resume editing note' : `Create new note at ${formatTime(currentTime)}`}
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
                                            {editingNoteId ? `Editing note at ${formatTime(notes.find(n => n.id === editingNoteId)?.time || 0)}` : formatTime(currentTime)}
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
                                {noteText.trim() && (
                                    <div style={{ 
                                        padding: '0.5rem 1rem', 
                                        textAlign: 'right', 
                                        fontSize: '0.75rem', 
                                        color: isOverLimit ? '#ef4444' : 'rgba(255,255,255,0.4)',
                                        fontWeight: '700',
                                        background: 'rgba(0,0,0,0.1)',
                                        borderTop: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {currentWordCount} / 1000 words
                                        {isOverLimit && ' (Limit exceeded)'}
                                    </div>
                                )}
                                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
                                    <button
                                        onClick={onCancelNote || (() => { setIsAddingNote(false); setNoteText(''); })}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (noteText.trim() && !isOverLimit) {
                                                onSaveNote(noteText);
                                                setNoteText('');
                                                setIsAddingNote(false);
                                            }
                                        }}
                                        disabled={!noteText.trim() || isOverLimit}
                                        style={{
                                            background: (noteText.trim() && !isOverLimit) ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                            color: 'white', border: 'none', padding: '0.4rem 1rem',
                                            borderRadius: '8px', cursor: (noteText.trim() && !isOverLimit) ? 'pointer' : 'default',
                                            fontSize: '0.85rem', fontWeight: '700',
                                            opacity: (noteText.trim() && !isOverLimit) ? 1 : 0.5
                                        }}
                                    >
                                        {editingNoteId ? 'Save changes' : 'Save note'}
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
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => !isLocked && onEditNote(note)}
                                                    disabled={isLocked}
                                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.3 : 1 }}
                                                    title="Edit note"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => !isLocked && onDeleteNote(note.id)}
                                                    disabled={isLocked}
                                                    style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.7)', cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.3 : 1 }}
                                                    title="Delete note"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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
                ) : sidebarTab === 'flashcards' ? (
                    <FlashcardPanel videoId={videoId} notes={notes} formatTime={formatTime} />
                ) : sidebarTab === 'resources' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Section: Personal Resources (Editable) */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>My Study Materials</h4>
                                <button 
                                    onClick={() => setIsAddingResource(!isAddingResource)}
                                    style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    {isAddingResource ? 'Cancel' : '+ Add'}
                                </button>
                            </div>

                            {isAddingResource && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <input 
                                        placeholder="Resource Title (e.g. GitHub Repo)" 
                                        value={newResource.label}
                                        onChange={e => setNewResource({ ...newResource, label: e.target.value })}
                                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                    <input 
                                        placeholder="URL (https://...)" 
                                        value={newResource.url}
                                        onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                    <button 
                                        onClick={handleAddResource}
                                        style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                    >
                                        Pin Resource
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {(video.customResources || []).map((res, i) => (
                                    <div 
                                        key={i}
                                        className="glass-hover"
                                        style={{
                                            padding: '1rem', borderRadius: '16px',
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            background: 'rgba(99, 102, 241, 0.03)',
                                            transition: 'all 0.2s', position: 'relative'
                                        }}
                                    >
                                        <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}>
                                            <ExternalLink size={20} />
                                        </div>
                                        <a href={res.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white', margin: 0 }}>{res.label}</p>
                                        </a>
                                        <button 
                                            onClick={() => handleRemoveResource(i)}
                                            style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {(!video.customResources || video.customResources.length === 0) && !isAddingResource && (
                                    <p style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.8rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                        No personal links added yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Section: Suggested Resources (Read-only) */}
                        <div>
                            <h4 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Suggested Resources</h4>
                            {resources.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {resources.map((res, i) => (
                                        <a 
                                            key={i}
                                            href={res.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="glass-hover"
                                            style={{
                                                padding: '1rem', borderRadius: '16px',
                                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem',
                                                border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'var(--primary)' }}>
                                                <Zap size={20} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{res.label}</p>
                                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{res.url}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.3 }}>
                                    <RefreshCw size={48} style={{ marginBottom: '1rem' }} />
                                    <p style={{ fontSize: '0.9rem' }}>No direct resources found in text.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : sidebarTab === 'party' && partyVideoId ? (
                    <WatchPartyPanel
                        embedded
                        videoId={partyVideoId}
                        userId={partyUserId}
                        playerRef={partyPlayerRef}
                        isPlaying={partyIsPlaying}
                        setIsPlaying={partySetIsPlaying}
                    />
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

                {/* Advertisement at the bottom of sidebar */}
                <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', marginTop: 'auto', flexShrink: 0 }}>
                    <AdSense 
                        adSlot="" // User needs to provide a slot ID for manual ads
                        style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)' }} 
                    />
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
