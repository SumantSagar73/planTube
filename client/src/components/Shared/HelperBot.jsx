import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    HelpCircle, X, ChevronLeft, ChevronRight, SkipForward,
    Layout, Play, Clock, BarChart3, BookOpen, StickyNote,
    Map, Settings, Users, Trophy, History, User,
    Zap, Music, Video, List, FileText, Upload,
    MessageSquare, Star, Shield, TrendingUp, Layers,
    Volume2, Maximize, CheckCircle, PanelRight,
    Activity, Timer, Library
} from 'lucide-react';

import StreakIcon from './StreakIcon';

// ─── Sections config ─ each section has an optional `selector` for highlighting
const PAGE_SECTIONS = {
    '/dashboard': {
        title: 'Dashboard', subtitle: 'Your personalised learning command centre',
        sections: [
            { icon: BarChart3, color: '#6366f1', name: 'Stats Overview', where: 'Top row', desc: 'Four metric cards spanning the full width — current streak, total watch time, videos completed, and weekly XP. Updated in real time as you study.', selector: '[data-section="overview-cards"]' },
            { icon: Clock, color: '#22c55e', name: 'Continue Watching', where: 'Centre, first section', desc: 'The three most recently watched videos with a resume button. Clicking goes straight to Focus Mode at exactly where you left off.', selector: '[data-section="schedule"]' },
            { icon: BookOpen, color: '#38bdf8', name: 'Active Library', where: 'Centre, below Continue Watching', desc: 'Playlists you have pinned or recently opened. Progress rings show completion percentage. Click any card to enter Focus Mode.', selector: '[data-section="playlist-grid"]' },
            { icon: History, color: '#a855f7', name: 'Daily Agenda', where: 'Right column', desc: "Today's scheduled study sessions with time estimates and checkboxes. Marks sessions as done without leaving the dashboard.", selector: '[data-section="recent-activity"]' },
            { icon: Activity, color: '#f97316', name: 'Activity Heatmap', where: 'Right column, below agenda', desc: 'A GitHub-style grid — each cell is one day, colour intensity represents minutes studied. Hover a cell to see the exact date and duration.', selector: '[data-section="heatmap"]' },
        ]
    },
    '/library': {
        title: 'Library', subtitle: 'Every playlist and video you have imported',
        sections: [
            { icon: Layout, color: '#6366f1', name: 'Search & Filter Bar', where: 'Top of page, below title', desc: 'Search box on the left filters by title in real time. The four tabs on the right — ALL, VIDEOS, PLAYLISTS, CUSTOM — narrow the grid to a specific content type.', selector: '[data-section="filter-bar"]' },
            { icon: BookOpen, color: '#22c55e', name: 'Content Grid', where: 'Main area', desc: 'Each card shows the thumbnail, title, progress bar, and video count. Right-click or use the three-dot menu on a card to Pin, Share, Sync, or Delete.', selector: '[data-section="playlist-grid"]' },
            { icon: Upload, color: '#f59e0b', name: 'Import New Button', where: 'Top-right corner', desc: 'Opens the Import page where you paste a YouTube URL. Use "YouTube Playlist" for standard syncing, or "Custom Course" to fully personalise the order and notes.', selector: null },
        ]
    },
    '/import': {
        title: 'Import Content', subtitle: 'Turn any YouTube URL into a structured course',
        sections: [
            { icon: Upload, color: '#6366f1', name: 'URL Input', where: 'Large input field, centre of page', desc: 'Paste any YouTube playlist or video link here, then press Import. The field accepts full URLs in any format — playlist, video, or shorts links.', selector: '[data-section="import-input"]' },
            { icon: Library, color: '#22c55e', name: 'YouTube Playlist', where: 'Left option card, below input', desc: 'Recommended for most users. Mirrors the playlist exactly as it appears on YouTube. Video order and titles stay in sync whenever you refresh.', selector: null },
            { icon: Layout, color: '#a855f7', name: 'Custom Course', where: 'Right option card, below input', desc: 'Advanced option. Creates a private copy you can fully edit — reorder videos, add notes, attach resources, and rename chapters independently of YouTube.', selector: null },
            { icon: List, color: '#38bdf8', name: 'Success Card', where: 'Below the options, after import', desc: 'Appears when the import completes. Shows the playlist title and a button to open it immediately in the Playlist Viewer or Focus Mode.', selector: '[data-section="import-preview"]' },
        ]
    },
    '/profile': {
        title: 'Profile', subtitle: 'Your identity, learning stats, and account settings',
        sections: [
            { icon: User, color: '#ec4899', name: 'Profile Card', where: 'Left sidebar, fixed position', desc: 'Displays your avatar, display name, username, and public/private toggle. Click the Edit button to update your name, bio, or profile picture.', selector: '[data-section="profile-header"]' },
            { icon: BarChart3, color: '#6366f1', name: 'Stats Dashboard', where: 'Tab 1 — default view', desc: 'Weekly bar chart of study minutes, cumulative XP progress ring, and an AI-generated Smart Insight that highlights your learning patterns.', selector: '[data-section="profile-dashboard"]' },
            { icon: History, color: '#22c55e', name: 'Watch History', where: 'Tab 2', desc: 'Chronological list of every video you have watched — completed, in progress, and scheduled. Filter by status or date range.', selector: '[data-section="profile-history"]' },
            { icon: Trophy, color: '#eab308', name: 'Achievements', where: 'Tab 3', desc: 'All unlocked trophies with the date earned. Locked trophies are shown in grey with the exact condition needed to unlock them.', selector: '[data-section="profile-trophies"]' },
            { icon: Settings, color: '#a855f7', name: 'Account Settings', where: 'Tab 4', desc: 'Change your password, set a daily study goal (minutes), manage notification preferences, and permanently delete your account.', selector: '[data-section="profile-settings"]' },
        ]
    },
    '/groups': {
        title: 'Study Groups', subtitle: 'Collaborative learning with shared accountability',
        sections: [
            { icon: Users, color: '#eab308', name: 'Your Groups', where: 'Main grid', desc: "Cards for each group you belong to. Each card shows the group name, member count, and your rank. Click to open the group dashboard and see everyone's activity.", selector: '[data-section="groups-grid"]' },
            { icon: Zap, color: '#6366f1', name: 'Create Group', where: 'Top-right button', desc: 'Creates a new group and generates a unique 6-character invite code. Share the code with anyone you want to study alongside.', selector: '[data-section="create-group"]' },
            { icon: TrendingUp, color: '#22c55e', name: 'Leaderboard', where: 'Inside a group — right panel', desc: 'Live ranking of all members sorted by total study minutes this week. Resets every Monday at midnight.', selector: '[data-section="leaderboard"]' },
        ]
    },
    '/social': {
        title: 'Social Hub', subtitle: 'Discover what the community is learning',
        sections: [
            { icon: TrendingUp, color: '#38bdf8', name: 'Activity Feed', where: 'Main centre column', desc: 'Real-time stream of public activity — completions, new imports, and streak milestones from all users who have made their profile public.', selector: '[data-section="activity-feed"]' },
            { icon: User, color: '#ec4899', name: 'People to Follow', where: 'Right panel', desc: 'Suggested learners with similar interests. Click a card to view their public profile, see what they are studying, and compare streaks.', selector: '[data-section="user-discovery"]' },
            { icon: BookOpen, color: '#a855f7', name: 'Shared Playlists', where: '"Shared" tab at the top', desc: 'Community-shared playlists. Click Import to add any of them directly to your Library as a YouTube Playlist or Custom Course.', selector: '[data-section="shared-playlists"]' },
        ]
    },
    '/my-playlists': {
        title: 'Custom Playlists', subtitle: 'Hand-curated study sequences you control',
        sections: [
            { icon: Star, color: '#a855f7', name: 'Your Playlists', where: 'Main grid', desc: 'Every custom playlist you have created. Cards show the cover image, title, and number of videos. Drag cards to reorder them.', selector: '[data-section="custom-grid"]' },
            { icon: Zap, color: '#6366f1', name: 'Create Playlist', where: 'Top-right button', desc: 'Opens a dialog to name and describe a new empty playlist. After creating it, use the playlist page to add videos from your Library.', selector: '[data-section="create-custom"]' },
        ]
    },
    'focus': {
        title: 'Focus Mode', subtitle: 'Distraction-free, feature-rich study environment',
        sections: [
            { icon: Timer, color: '#a855f7', name: 'Pomodoro Rail', where: 'Thin strip on the far left — hover to expand', desc: 'Hover the left edge to reveal the Pomodoro timer, ambient sound picker (rain, lofi, waves, forest), and timer settings. The coloured ring shows time remaining in the current session.', selector: '[data-section="focus-rail"]' },
            { icon: Play, color: '#6366f1', name: 'Video Player', where: 'Full-screen centre area', desc: 'The embedded YouTube player fills the entire screen. Click anywhere on the video to pause or resume. Controls auto-hide after 2 seconds of inactivity.', selector: '[data-section="focus-player"]' },
            { icon: Volume2, color: '#22c55e', name: 'Controls Bar', where: 'Bottom of screen — appears on hover', desc: 'Hover the bottom edge to reveal: seek bar with chapter markers, playback speed, volume slider, Prev/Next video, and the Mark Complete button. Keyboard shortcuts also work (Space, J, L, F, M, C).', selector: '[data-section="focus-controls"]' },
            { icon: Users, color: '#f59e0b', name: 'Watch Party', where: 'Controls bar — party icon (right side)', desc: 'Click the people icon in the controls bar to open the Watch Party tab in the sidebar. Create a room or join one with a code to sync playback with friends in real time.', selector: '[data-section="focus-controls"]' },
            { icon: Map, color: '#38bdf8', name: 'Chapter Map', where: 'Sidebar — Map tab', desc: 'Visual timeline of every chapter in the video. Coloured checkboxes track completion per chapter. Click any chapter title to jump directly to that timestamp.', selector: '[data-section="focus-sidebar"]' },
            { icon: StickyNote, color: '#ec4899', name: 'Timestamped Notes', where: 'Sidebar — Notes tab', desc: 'Write a note at any moment and it is automatically stamped with the current video time. Supports markdown (bold, italic, code blocks, bullet lists). Export all notes as a PDF or Markdown file.', selector: '[data-section="focus-sidebar"]' },
            { icon: Zap, color: '#eab308', name: 'Resources', where: 'Sidebar — Resources tab', desc: 'Auto-extracted links from the video description, plus any custom links you add. Great for attaching related articles, documentation, or companion courses.', selector: '[data-section="focus-sidebar"]' },
            { icon: List, color: '#a855f7', name: 'Playlist Panel', where: 'Sidebar — Playlist tab', desc: 'All videos in the current playlist with completion status indicators. Click any row to navigate to that video without leaving Focus Mode. Overall progress bar at the top.', selector: '[data-section="focus-sidebar"]' },
        ]
    },
    '/admin': {
        title: 'Admin Command Centre', subtitle: 'Platform-wide oversight and moderation',
        sections: [
            { icon: Activity, color: '#6366f1', name: 'Analytics', where: 'Overview tab — default view', desc: 'Live charts showing daily active users, total watch minutes, top imported playlists, and platform health indicators. Data refreshes every 60 seconds.', selector: '[data-section="admin-analytics"]' },
            { icon: Users, color: '#22c55e', name: 'User Registry', where: 'Users tab', desc: 'Paginated table of every registered account. Click any row to open the Identity Drawer — a full panel with account history, watch stats, and moderation actions.', selector: null },
            { icon: BookOpen, color: '#eab308', name: 'Global Library', where: 'Playlists tab', desc: 'Every playlist imported by any user, with creator name, video count, and last-updated timestamp. Use this to spot duplicate or problematic content.', selector: null },
            { icon: Shield, color: '#ef4444', name: 'Moderation Actions', where: 'Inside the Identity Drawer or action buttons', desc: 'Freeze an account to block new watch activity, approve or reject data deletion requests, and promote users to admin. All actions are logged with a timestamp and reason.', selector: '[data-section="admin-health"]' },
        ]
    },
};

// ─── Spotlight Overlay ─────────────────────────────────────────────────────
const Spotlight = ({ selector, onDismiss }) => {
    const [rect, setRect] = useState(null);

    useEffect(() => {
        if (!selector) { setRect(null); return; }
        const el = document.querySelector(selector);
        if (!el) { setRect(null); return; }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selector]);

    if (!rect) return null;

    const PAD = 12;
    return (
        <div
            onClick={onDismiss}
            style={{
                position: 'fixed', inset: 0, zIndex: 850, pointerEvents: 'none',
            }}
        >
            {/* Top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rect.top - PAD, background: 'rgba(0,0,0,0.55)' }} />
            {/* Bottom */}
            <div style={{ position: 'absolute', top: rect.top + rect.height + PAD, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)' }} />
            {/* Left */}
            <div style={{ position: 'absolute', top: rect.top - PAD, left: 0, width: rect.left - PAD, height: rect.height + PAD * 2, background: 'rgba(0,0,0,0.55)' }} />
            {/* Right */}
            <div style={{ position: 'absolute', top: rect.top - PAD, left: rect.left + rect.width + PAD, right: 0, height: rect.height + PAD * 2, background: 'rgba(0,0,0,0.55)' }} />
            {/* Highlight Ring */}
            <div style={{
                position: 'absolute',
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                border: '2px solid rgba(99,102,241,0.8)',
                borderRadius: '16px',
                boxShadow: '0 0 0 4px rgba(99,102,241,0.2)',
                animation: 'helperPulse 1.5s ease-in-out infinite',
                pointerEvents: 'none'
            }} />
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const HelperBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tourStep, setTourStep] = useState(null); // null = list view, number = tour step
    const [hasNew, setHasNew] = useState(true);
    const location = useLocation();

    const isFocus = location.pathname.startsWith('/focus/');
    const configKey = isFocus ? 'focus' : location.pathname;
    const config = PAGE_SECTIONS[configKey] || null;

    useEffect(() => {
        setIsOpen(false);
        setTourStep(null);
        setHasNew(true);
    }, [location.pathname]);

    const handleOpen = () => {
        setIsOpen(prev => !prev);
        setHasNew(false);
        if (isOpen) setTourStep(null); // reset tour on close
    };

    const startTour = () => setTourStep(0);
    const endTour = () => setTourStep(null);
    const next = () => setTourStep(prev => Math.min(prev + 1, config.sections.length - 1));
    const prev = () => setTourStep(prev => Math.max(prev - 1, 0));

    if (!config) return null;

    const currentSection = tourStep !== null ? config.sections[tourStep] : null;

    return (
        <>
            {/* CSS keyframes */}
            <style>{`
                @keyframes helperPulse {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.2); }
                    50% { box-shadow: 0 0 0 8px rgba(99,102,241,0.1); }
                }
            `}</style>

            {/* Spotlight when touring and selector exists */}
            {tourStep !== null && currentSection?.selector && (
                <Spotlight selector={currentSection.selector} onDismiss={endTour} />
            )}

            {/* Floating Help Button */}
            <button
                onClick={handleOpen}
                title="What's on this page?"
                style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: isOpen ? 'rgba(99,102,241,0.9)' : 'rgba(10,10,15,0.92)',
                    backdropFilter: 'blur(20px)',
                    border: isOpen ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.12)',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 901,
                    boxShadow: isOpen ? '0 8px 32px rgba(99,102,241,0.4)' : '0 8px 24px rgba(0,0,0,0.4)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isOpen ? 'rotate(15deg) scale(0.92)' : 'scale(1)',
                }}
            >
                {isOpen ? <X size={20} /> : <HelpCircle size={20} />}
                {hasNew && !isOpen && (
                    <div style={{
                        position: 'absolute', top: '3px', right: '3px',
                        width: '10px', height: '10px',
                        background: '#6366f1', borderRadius: '50%',
                        border: '2px solid rgba(10,10,15,1)',
                        animation: 'pulse 2s infinite'
                    }} />
                )}
            </button>

            {/* Panel */}
            <div style={{
                position: 'fixed', bottom: '5.5rem', right: '2rem', width: '360px',
                maxHeight: '72vh',
                background: 'rgba(8,8,12,0.97)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '28px', zIndex: 900,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 32px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.95)',
                pointerEvents: isOpen ? 'auto' : 'none',
                transition: 'all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                                <Layout size={12} color="rgba(255,255,255,0.3)" />
                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                    {tourStep !== null ? `Section ${tourStep + 1} of ${config.sections.length}` : "What's on this page"}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'white', margin: 0 }}>{config.title}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{config.subtitle}</p>
                        </div>
                        {tourStep === null ? (
                            <button
                                onClick={startTour}
                                style={{
                                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                                    color: '#818cf8', padding: '6px 14px', borderRadius: '20px',
                                    fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.3)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                            >
                                Start Tour →
                            </button>
                        ) : (
                            <button
                                onClick={endTour}
                                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Exit Tour
                            </button>
                        )}
                    </div>
                </div>

                {/* LIST VIEW */}
                {tourStep === null && (
                    <div style={{ overflowY: 'auto', padding: '0.75rem', flex: 1 }}>
                        {config.sections.map((section, i) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={i}
                                    onClick={() => setTourStep(i)}
                                    style={{
                                        display: 'flex', gap: '0.9rem', padding: '0.85rem 0.75rem',
                                        borderRadius: '16px', marginBottom: '4px',
                                        cursor: 'pointer', transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '12px',
                                        background: `${section.color}18`, border: `1px solid ${section.color}30`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Icon size={16} color={section.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3px' }}>
                                            <span style={{ fontSize: '0.87rem', fontWeight: '800', color: 'white' }}>{section.name}</span>
                                            <span style={{ fontSize: '0.6rem', fontWeight: '700', background: `${section.color}18`, color: section.color, padding: '2px 7px', borderRadius: '20px', border: `1px solid ${section.color}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                {section.where}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.77rem', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: '1.5' }}>{section.desc}</p>
                                    </div>
                                    <ChevronRight size={14} color="rgba(255,255,255,0.15)" style={{ alignSelf: 'center', flexShrink: 0 }} />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* TOUR STEP VIEW */}
                {tourStep !== null && currentSection && (() => {
                    const Icon = currentSection.icon;
                    return (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                            {/* Progress Bar */}
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
                                {config.sections.map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setTourStep(i)}
                                        style={{
                                            flex: 1, height: '3px', borderRadius: '2px',
                                            background: i <= tourStep ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                            cursor: 'pointer', transition: 'background 0.3s'
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Section Icon + Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '16px',
                                    background: `${currentSection.color}18`, border: `1px solid ${currentSection.color}35`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Icon size={24} color={currentSection.color} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'white', margin: 0 }}>{currentSection.name}</h4>
                                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: currentSection.color, background: `${currentSection.color}18`, padding: '2px 9px', borderRadius: '20px', border: `1px solid ${currentSection.color}30` }}>
                                        {currentSection.where}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.65', margin: 0, flex: 1 }}>
                                {currentSection.desc}
                            </p>

                            {currentSection.selector && (
                                <p style={{ fontSize: '0.72rem', color: 'rgba(99,102,241,0.7)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1', display: 'inline-block' }} />
                                    Element highlighted on screen
                                </p>
                            )}

                            {/* Navigation */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={prev}
                                    disabled={tourStep === 0}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        padding: '0.6rem 1rem', borderRadius: '14px',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: tourStep === 0 ? 'rgba(255,255,255,0.2)' : 'white',
                                        fontSize: '0.82rem', fontWeight: '700', cursor: tourStep === 0 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <ChevronLeft size={15} /> Prev
                                </button>

                                <button
                                    onClick={endTour}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        padding: '0.6rem 1rem', borderRadius: '14px',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                        color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                                        transition: 'all 0.2s', flex: 1, justifyContent: 'center'
                                    }}
                                >
                                    <SkipForward size={14} /> Skip Tour
                                </button>

                                <button
                                    onClick={tourStep === config.sections.length - 1 ? endTour : next}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        padding: '0.6rem 1.1rem', borderRadius: '14px',
                                        background: 'rgba(99,102,241,0.9)', border: 'none',
                                        color: 'white', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer',
                                        transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.9)'}
                                >
                                    {tourStep === config.sections.length - 1 ? 'Done ✓' : (<>Next <ChevronRight size={15} /></>)}
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* Footer */}
                <div style={{ padding: '0.65rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <HelpCircle size={11} color="rgba(255,255,255,0.15)" />
                    <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.18)' }}>
                        {tourStep !== null ? 'Click any progress dot to jump to a section' : 'Click a section or press "Start Tour" to explore'}
                    </span>
                </div>
            </div>
        </>
    );
};

export default HelperBot;
