import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    HelpCircle, X, ChevronLeft, ChevronRight, SkipForward,
    Layout, Play, Clock, BarChart3, BookOpen, StickyNote,
    Map, Settings, Users, Trophy, History, User,
    Zap, Music, Video, List, FileText, Upload,
    MessageSquare, Star, Shield, TrendingUp, Layers,
    Volume2, Maximize, CheckCircle, PanelRight,
    Activity, Timer
} from 'lucide-react';

import StreakIcon from './StreakIcon';

// ─── Sections config ─ each section has an optional `selector` for highlighting
const PAGE_SECTIONS = {
    '/dashboard': {
        title: 'Dashboard', subtitle: 'Your daily study mission control',
        sections: [
            { icon: BarChart3, color: '#6366f1', name: 'Overview Stats', where: 'Top of page', desc: 'Total focus hours, XP points, level, and your ongoing streak — all at a glance.', selector: '[data-section="overview-cards"]' },
            { icon: Clock, color: '#22c55e', name: "Today's Schedule", where: 'Centre', desc: 'Videos planned for today. Click any item to jump straight into Focus Mode.', selector: '[data-section="schedule"]' },
            { icon: StreakIcon, color: '#f97316', name: 'Streak Tracker', where: 'Left panel', desc: 'Your daily study streak. Study at least once a day to keep it alive!', selector: '[data-section="streak"]' },
            { icon: Trophy, color: '#eab308', name: 'Trophy Shelf', where: 'Right panel', desc: 'Achievements unlocked based on XP, hours, and milestones. Hover each for details.', selector: '[data-section="trophies"]' },
            { icon: History, color: '#a855f7', name: 'Recent Activity', where: 'Bottom', desc: 'Last 5 study sessions with timestamps and progress.', selector: '[data-section="recent-activity"]' },
        ]
    },
    '/library': {
        title: 'Library', subtitle: 'All your imported content',
        sections: [
            { icon: Layout, color: '#6366f1', name: 'Filter Bar', where: 'Top', desc: 'Switch between All Content, Playlists, Single Videos, and Custom Playlists.', selector: '[data-section="filter-bar"]' },
            { icon: BookOpen, color: '#22c55e', name: 'Playlist Cards', where: 'Main grid', desc: 'Each card shows progress bar, video count, and schedule status. Click to open.', selector: '[data-section="playlist-grid"]' },
            { icon: Video, color: '#38bdf8', name: 'Single Videos', where: 'Singles tab', desc: 'Individual YouTube videos imported separately — not part of a playlist.', selector: '[data-section="video-grid"]' },
        ]
    },
    '/import': {
        title: 'Import Content', subtitle: 'Bring YouTube content into PlanTube',
        sections: [
            { icon: Upload, color: '#6366f1', name: 'URL Input Box', where: 'Centre', desc: 'Paste any YouTube playlist or video URL and press Import.', selector: '[data-section="import-input"]' },
            { icon: List, color: '#22c55e', name: 'Import Preview', where: 'Below input', desc: 'After pasting a URL, a preview appears before you confirm.', selector: '[data-section="import-preview"]' },
        ]
    },
    '/profile': {
        title: 'Profile', subtitle: 'Your identity, stats, and settings',
        sections: [
            { icon: User, color: '#ec4899', name: 'Profile Header', where: 'Left sidebar', desc: 'Avatar, name, username, motto, and public toggle. Click Edit to modify.', selector: '[data-section="profile-header"]' },
            { icon: BarChart3, color: '#6366f1', name: 'Dashboard Tab', where: 'Tab 1', desc: 'Weekly study chart, XP progress bar, and your Smart Insight summary.', selector: '[data-section="profile-dashboard"]' },
            { icon: History, color: '#22c55e', name: 'History Tab', where: 'Tab 2', desc: 'Full log of completed, upcoming, and missed study sessions.', selector: '[data-section="profile-history"]' },
            { icon: Trophy, color: '#eab308', name: 'Trophies Tab', where: 'Tab 3', desc: 'Every trophy earned and locked future ones showing how to unlock them.', selector: '[data-section="profile-trophies"]' },
            { icon: Settings, color: '#a855f7', name: 'Settings Tab', where: 'Tab 4', desc: 'Change password, preferences, daily study time, and account deletion.', selector: '[data-section="profile-settings"]' },
        ]
    },
    '/groups': {
        title: 'Study Groups', subtitle: 'Collaborate with others',
        sections: [
            { icon: Users, color: '#eab308', name: 'Your Groups', where: 'Main grid', desc: "Groups you're a member of. Click any card to view member activity.", selector: '[data-section="groups-grid"]' },
            { icon: Zap, color: '#6366f1', name: 'Create Group', where: 'Top right', desc: 'Start a new group and share the unique code to invite members.', selector: '[data-section="create-group"]' },
            { icon: TrendingUp, color: '#22c55e', name: 'Leaderboard', where: 'Inside group', desc: 'Real-time ranking of all members by study minutes.', selector: '[data-section="leaderboard"]' },
        ]
    },
    '/social': {
        title: 'Social Hub', subtitle: 'Connect with the community',
        sections: [
            { icon: TrendingUp, color: '#38bdf8', name: 'Activity Feed', where: 'Centre', desc: 'Public study activity from all users — see what people are learning.', selector: '[data-section="activity-feed"]' },
            { icon: User, color: '#ec4899', name: 'User Discovery', where: 'Right panel', desc: 'Find other learners and view their public profiles.', selector: '[data-section="user-discovery"]' },
            { icon: BookOpen, color: '#a855f7', name: 'Shared Playlists', where: 'Shared tab', desc: 'Playlists made public by the community. Import them to your library.', selector: '[data-section="shared-playlists"]' },
        ]
    },
    '/my-playlists': {
        title: 'Custom Playlists', subtitle: 'Curate your own study sequences',
        sections: [
            { icon: Star, color: '#a855f7', name: 'Custom Playlists', where: 'Main grid', desc: 'Study lists you built manually from your library videos.', selector: '[data-section="custom-grid"]' },
            { icon: Zap, color: '#6366f1', name: 'Create New', where: 'Top right', desc: 'Create a blank playlist and start adding videos from any import.', selector: '[data-section="create-custom"]' },
        ]
    },
    'focus': {
        title: 'Focus Mode', subtitle: 'Your immersive study environment',
        sections: [
            { icon: PanelRight, color: '#a855f7', name: 'Left Rail', where: 'Far left strip', desc: 'Pomodoro timer, ambient sounds (rain, café…), and Monk Mode toggle to dim distractions.', selector: '[data-section="focus-rail"]' },
            { icon: Play, color: '#6366f1', name: 'Video Player', where: 'Main area', desc: 'Embedded YouTube player. Click anywhere to pause/play.', selector: '[data-section="focus-player"]' },
            { icon: Volume2, color: '#22c55e', name: 'Controls Bar', where: 'Bottom (hover)', desc: 'Volume, speed, Prev/Next nav, and fullscreen. Appears on hover.', selector: '[data-section="focus-controls"]' },
            { icon: CheckCircle, color: '#f59e0b', name: 'Mark Complete', where: 'Controls — right', desc: 'Marks video as done and updates your progress. Shortcut: C.', selector: '[data-section="focus-controls"]' },
            { icon: Map, color: '#38bdf8', name: 'Chapter Map', where: 'Sidebar — Map tab', desc: 'Visual chapter timeline. Click any chapter to jump to it and check off as you go.', selector: '[data-section="focus-sidebar"]' },
            { icon: StickyNote, color: '#ec4899', name: 'Notes', where: 'Sidebar — Notes tab', desc: 'Timestamped notes while watching. Supports bold, italic, lists, code.', selector: '[data-section="focus-sidebar"]' },
            { icon: Zap, color: '#eab308', name: 'Resources', where: 'Sidebar — Resources tab', desc: 'Links from the video description plus custom study materials you add.', selector: '[data-section="focus-sidebar"]' },
            { icon: List, color: '#a855f7', name: 'Playlist Panel', where: 'Sidebar — Playlist tab', desc: 'All videos in the playlist with progress indicators. Click to jump.', selector: '[data-section="focus-sidebar"]' },
        ]
    },
    '/admin': {
        title: 'Admin Command Center', subtitle: 'Platform-wide oversight',
        sections: [
            { icon: Activity, color: '#6366f1', name: 'Analytics Overview', where: 'Overview tab', desc: 'Real platform activity charts, top content topics, and system health.', selector: '[data-section="admin-analytics"]' },
            { icon: Users, color: '#22c55e', name: 'User Registry', where: 'Users tab', desc: 'All users. Click # to open the Identity Drawer with full details.', selector: null },
            { icon: BookOpen, color: '#eab308', name: 'Global Library', where: 'Playlists tab', desc: 'Every playlist in PlanTube with creator and usage counts.', selector: null },
            { icon: Shield, color: '#ef4444', name: 'Moderation Tools', where: 'Action buttons', desc: 'Freeze ❄️ accounts, approve wipe requests 🗑️, toggle admin roles.', selector: '[data-section="admin-health"]' },
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
