import React, { useState, useEffect, useCallback } from 'react';
import {
    ToggleLeft, ToggleRight, AlertTriangle, ShieldCheck, Zap, Calendar,
    Trash2, RefreshCw, Database, Clock, BrainCircuit, CheckCircle2,
    User, Search, X, ChevronDown, ChevronUp, Loader
} from 'lucide-react';
import api from '../../services/api';
import adminService from '../../services/adminService';
import { useSettings } from '../../context/SettingsContext';

// Friendly labels for every feature flag key
const FLAG_META = {
    feat_ai_brainstorm:    { label: 'AI Brainstorm',         desc: 'AI roadmap & note suggestions in Focus Mode',      group: 'AI' },
    feat_ai_chat:          { label: 'AI Tutor Chat',          desc: 'Interactive AI chat about the current video',       group: 'AI' },
    feat_ai_questions:     { label: 'AI Quiz Questions',      desc: 'Generate quiz questions from video content',        group: 'AI' },
    feat_ai_flashcards:    { label: 'AI Flashcards',          desc: 'Auto-generate flashcards for spaced repetition',    group: 'AI' },
    feat_notes:            { label: 'Video Notes',            desc: 'Timestamped note-taking inside Focus Mode',         group: 'Study' },
    feat_heatmap:          { label: 'Activity Heatmap',       desc: 'FocusPulse heatmap on the dashboard',              group: 'Study' },
    feat_lock_mode:        { label: 'Focus Lock Mode',        desc: 'Distraction-free lock / fullscreen mode',           group: 'Study' },
    feat_spaced_repetition:{ label: 'Spaced Repetition',      desc: 'SM-2 algorithm for optimal review scheduling',      group: 'Study' },
    feat_pomodoro:         { label: 'Pomodoro Timer',         desc: 'Built-in Pomodoro timer in Focus Mode',             group: 'Study' },
    feat_watch_party:      { label: 'Watch Party',            desc: 'Synchronized co-watching with real-time sync',      group: 'Social' },
    feat_groups:           { label: 'Study Groups',           desc: 'Create / join study groups with invite codes',      group: 'Social' },
    feat_social:           { label: 'Social & Friends',       desc: 'Friend requests, follows, and social feed',         group: 'Social' },
    feat_public_profiles:  { label: 'Public Profiles',        desc: 'Allow users to make their profile publicly visible', group: 'Social' },
    feat_achievements:     { label: 'Achievements & XP',      desc: 'Badge unlocks and XP reward system',                group: 'Gamification' },
    feat_leaderboard:      { label: 'Leaderboard',            desc: 'Global ranking board by XP / streaks',              group: 'Gamification' },
    feat_streaks:          { label: 'Daily Streaks',          desc: 'Streak tracking with bonus XP on consecutive days', group: 'Gamification' },
    feat_custom_playlists: { label: 'Custom Playlists',       desc: 'Users can curate and share their own playlists',    group: 'Content' },
    feat_playlist_sync:    { label: 'Playlist Sync',          desc: 'Re-sync playlists from YouTube for updates',        group: 'Content' },
};

const GROUP_COLORS = {
    AI: '#818cf8',
    Study: '#34d399',
    Social: '#38bdf8',
    Gamification: '#fbbf24',
    Content: '#f472b6',
};

const AdminCommandCenter = ({ notify }) => {
    const { refreshFlags } = useSettings();
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    const fetchSettings = async () => {
        try {
            const res = await api.get(`/settings/all?t=${Date.now()}`);
            const unique = Array.from(new Map(res.data.map(item => [item.key, item])).values());
            setSettings(unique);
        } catch {
            notify('Failed to load system settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleToggle = async (key, currentValue) => {
        setUpdating(key);
        try {
            await api.put('/settings/update', { key, value: !currentValue });
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: !currentValue } : s));
            refreshFlags();
            notify(`${FLAG_META[key]?.label || key} ${!currentValue ? 'enabled' : 'disabled'}`, 'success');
        } catch {
            notify('Failed to update setting', 'error');
        } finally {
            setUpdating(null);
        }
    };

    // ── Scheduled Maintenance ─────────────────────────────────────────────────
    const [maintenance, setMaintenance] = useState(null);
    const [maintForm, setMaintForm] = useState({ scheduledAt: '', durationMinutes: 60, message: '' });
    const [maintLoading, setMaintLoading] = useState(false);

    useEffect(() => {
        adminService.getScheduledMaintenance().then(v => {
            if (v) {
                setMaintenance(v);
                setMaintForm({ scheduledAt: v.scheduledAt?.slice(0, 16) || '', durationMinutes: v.durationMinutes || 60, message: v.message || '' });
            }
        }).catch(() => {});
    }, []);

    const saveMaintenance = async () => {
        setMaintLoading(true);
        try {
            const res = await adminService.setScheduledMaintenance(maintForm);
            setMaintenance(res.value);
            notify('Maintenance window saved', 'success');
        } catch { notify('Failed to save maintenance window', 'error'); }
        finally { setMaintLoading(false); }
    };

    const cancelMaintenance = async () => {
        setMaintLoading(true);
        try {
            await adminService.setScheduledMaintenance({ scheduledAt: null });
            setMaintenance(null);
            setMaintForm({ scheduledAt: '', durationMinutes: 60, message: '' });
            notify('Maintenance window cancelled', 'success');
        } catch { notify('Failed to cancel', 'error'); }
        finally { setMaintLoading(false); }
    };

    // ── AI Model ──────────────────────────────────────────────────────────────
    const [aiModels, setAIModels] = useState([]);
    const [activeAIModel, setActiveAIModel] = useState('gemini-3-flash');
    const [savingAIModel, setSavingAIModel] = useState(false);

    useEffect(() => {
        adminService.getAIModels().then(d => {
            setAIModels(d.models || []);
            setActiveAIModel(d.activeModel || 'gemini-3-flash');
        }).catch(() => {});
    }, []);

    const saveAIModel = async (modelId) => {
        setSavingAIModel(true);
        try {
            await adminService.setAIModel(modelId);
            setActiveAIModel(modelId);
            notify(`AI model set to ${modelId}`, 'success');
        } catch { notify('Failed to save AI model', 'error'); }
        finally { setSavingAIModel(false); }
    };

    // ── Cache Flush ───────────────────────────────────────────────────────────
    const [flushing, setFlushing] = useState(false);
    const [lastFlushed, setLastFlushed] = useState(null);

    const flushCache = async () => {
        setFlushing(true);
        try {
            const res = await adminService.flushCache();
            setLastFlushed(res.flushedAt);
            notify('Cache flushed successfully', 'success');
        } catch { notify('Cache flush failed', 'error'); }
        finally { setFlushing(false); }
    };

    // ── Per-User Feature Overrides ────────────────────────────────────────────
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null); // { userId, name, username, overrides:{} }
    const [userOverrides, setUserOverrides] = useState({});
    const [overrideSaving, setOverrideSaving] = useState(null);
    const [overrideExpanded, setOverrideExpanded] = useState(true);

    const searchUsers = useCallback(async (q) => {
        if (!q.trim()) return setSearchResults([]);
        setSearchLoading(true);
        try {
            const res = await api.get(`/admin/users?search=${encodeURIComponent(q)}&limit=8`);
            setSearchResults(res.data.users || res.data || []);
        } catch { setSearchResults([]); }
        finally { setSearchLoading(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => searchUsers(userSearch), 350);
        return () => clearTimeout(t);
    }, [userSearch, searchUsers]);

    const selectUser = async (u) => {
        setSearchResults([]);
        setUserSearch('');
        try {
            const res = await api.get(`/admin/users/${u._id}/features`);
            setSelectedUser({ userId: u._id, name: res.data.name, username: res.data.username });
            setUserOverrides(res.data.overrides || {});
        } catch { notify('Could not load user overrides', 'error'); }
    };

    const setOverride = async (key, value) => {
        // value: true | false | null (null = inherit global)
        setOverrideSaving(key);
        try {
            const res = await api.put(`/admin/users/${selectedUser.userId}/features`, { key, value });
            setUserOverrides(res.data.overrides || {});
            const label = FLAG_META[key]?.label || key;
            const msg = value === null ? `${label} reset to global default` : `${label} ${value ? 'force-enabled' : 'force-disabled'} for ${selectedUser.name}`;
            notify(msg, 'success');
        } catch { notify('Failed to update override', 'error'); }
        finally { setOverrideSaving(null); }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Command Center...</div>;

    const featureSettings = settings.filter(s => s.category === 'features');
    const maintenanceSettings = settings.filter(s => s.category === 'maintenance');

    // Group feature flags by their category
    const grouped = {};
    featureSettings.forEach(s => {
        const grp = FLAG_META[s.key]?.group || 'Other';
        if (!grouped[grp]) grouped[grp] = [];
        grouped[grp].push(s);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Zap style={{ color: '#fbbf24' }} /> Command Center
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time feature toggles, per-user overrides, and platform health controls.</p>
            </header>

            {/* ── Global Feature Flags ─────────────────────────────────────── */}
            <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="#60a5fa" /> Global Feature Flags
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        Applies to all users (unless overridden per-user below)
                    </span>
                </h3>

                {Object.entries(grouped).map(([group, items]) => (
                    <div key={group} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: GROUP_COLORS[group] || '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                            {group}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                            {items.map(setting => {
                                const meta = FLAG_META[setting.key];
                                return (
                                    <div key={setting.key} style={{
                                        background: setting.value ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${setting.value ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                        padding: '1rem 1.2rem',
                                        borderRadius: '14px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        opacity: updating === setting.key ? 0.6 : 1,
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white', marginBottom: '2px' }}>
                                                {meta?.label || setting.key}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                                {meta?.desc || setting.description}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggle(setting.key, setting.value)}
                                            disabled={updating === setting.key}
                                            title={setting.value ? 'Click to disable' : 'Click to enable'}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: setting.value ? '#34d399' : '#475569', flexShrink: 0 }}
                                        >
                                            {setting.value ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {featureSettings.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No feature flags found. Run the seed script to initialize defaults.
                    </p>
                )}
            </section>

            {/* ── Per-User Feature Overrides ───────────────────────────────── */}
            <section style={{ background: 'rgba(129,140,248,0.04)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '20px', padding: '1.5rem' }}>
                <div
                    onClick={() => setOverrideExpanded(e => !e)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: overrideExpanded ? '1.25rem' : 0 }}
                >
                    <User size={18} color="#818cf8" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', flex: 1 }}>Per-User Feature Overrides</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Force on/off for specific users</span>
                    {overrideExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                {overrideExpanded && (
                    <>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Search for a user and override any feature flag independently of the global setting.
                            Setting an override to <strong style={{ color: '#34d399' }}>ON</strong> forces that feature on for this user even if globally disabled.
                            Setting it to <strong style={{ color: '#f87171' }}>OFF</strong> blocks it even if globally enabled.
                            <strong style={{ color: '#94a3b8' }}> Reset</strong> removes the override and inherits the global value.
                        </p>

                        {/* Search box */}
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                placeholder="Search users by name or email..."
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px', color: 'white', fontSize: '0.85rem',
                                }}
                            />
                            {searchLoading && <Loader size={14} color="#818cf8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', animation: 'spin 0.8s linear infinite' }} />}
                        </div>

                        {/* Dropdown results */}
                        {searchResults.length > 0 && (
                            <div style={{ background: 'rgba(10,14,26,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                {searchResults.map(u => (
                                    <button
                                        key={u._id}
                                        onClick={() => selectUser(u)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', textAlign: 'left' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                                            {u.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email} · @{u.username}</div>
                                        </div>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#818cf8', fontWeight: 700 }}>{u.role}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected user's overrides */}
                        {selectedUser && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                                        {selectedUser.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedUser.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{selectedUser.username}</div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedUser(null); setUserOverrides({}); }}
                                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.65rem' }}>
                                    {Object.entries(FLAG_META).map(([key, meta]) => {
                                        const globalSetting = featureSettings.find(s => s.key === key);
                                        const globalVal = globalSetting?.value ?? true;
                                        const override = userOverrides[key]; // undefined = inherit, true/false = override
                                        const isSaving = overrideSaving === key;

                                        return (
                                            <div key={key} style={{
                                                background: override !== undefined
                                                    ? (override ? 'rgba(52,211,153,0.06)' : 'rgba(239,68,68,0.06)')
                                                    : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${override !== undefined
                                                    ? (override ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)')
                                                    : 'rgba(255,255,255,0.05)'}`,
                                                borderRadius: '12px', padding: '0.85rem 1rem',
                                                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                                opacity: isSaving ? 0.6 : 1, transition: 'all 0.2s'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>{meta.label}</div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 2 }}>{meta.desc}</div>
                                                    </div>
                                                    <span style={{
                                                        flexShrink: 0, marginLeft: 8,
                                                        fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: '20px',
                                                        background: override !== undefined
                                                            ? (override ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)')
                                                            : 'rgba(148,163,184,0.15)',
                                                        color: override !== undefined
                                                            ? (override ? '#34d399' : '#f87171')
                                                            : '#94a3b8'
                                                    }}>
                                                        {override !== undefined ? (override ? 'FORCED ON' : 'FORCED OFF') : `GLOBAL (${globalVal ? 'ON' : 'OFF'})`}
                                                    </span>
                                                </div>

                                                {/* Three-way control */}
                                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                                                    <button
                                                        onClick={() => !isSaving && setOverride(key, true)}
                                                        disabled={isSaving}
                                                        style={{
                                                            flex: 1, fontSize: '0.7rem', fontWeight: 700, padding: '4px 0',
                                                            borderRadius: '7px', cursor: 'pointer', border: 'none',
                                                            background: override === true ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.07)',
                                                            color: override === true ? '#34d399' : 'rgba(52,211,153,0.5)',
                                                            outline: override === true ? '1px solid rgba(52,211,153,0.4)' : 'none'
                                                        }}
                                                    >ON</button>
                                                    <button
                                                        onClick={() => !isSaving && setOverride(key, null)}
                                                        disabled={isSaving}
                                                        style={{
                                                            flex: 1, fontSize: '0.7rem', fontWeight: 700, padding: '4px 0',
                                                            borderRadius: '7px', cursor: 'pointer', border: 'none',
                                                            background: override === undefined ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.06)',
                                                            color: override === undefined ? '#94a3b8' : 'rgba(148,163,184,0.4)',
                                                            outline: override === undefined ? '1px solid rgba(148,163,184,0.3)' : 'none'
                                                        }}
                                                    >GLOBAL</button>
                                                    <button
                                                        onClick={() => !isSaving && setOverride(key, false)}
                                                        disabled={isSaving}
                                                        style={{
                                                            flex: 1, fontSize: '0.7rem', fontWeight: 700, padding: '4px 0',
                                                            borderRadius: '7px', cursor: 'pointer', border: 'none',
                                                            background: override === false ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.06)',
                                                            color: override === false ? '#f87171' : 'rgba(239,68,68,0.4)',
                                                            outline: override === false ? '1px solid rgba(239,68,68,0.35)' : 'none'
                                                        }}
                                                    >OFF</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {!selectedUser && searchResults.length === 0 && !userSearch && (
                            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                Search for a user above to view and edit their feature overrides.
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ── AI Model Configuration ────────────────────────────────────── */}
            <section style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BrainCircuit size={18} color="#818cf8" /> AI Model Configuration
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Select the AI model that powers brainstorm, chat, and flashcard generation for all users.
                </p>

                {['free', 'standard', 'premium'].map(tier => {
                    const group = aiModels.filter(m => m.tier === tier);
                    if (!group.length) return null;
                    const tierLabel = { free: 'Free · Budget', standard: 'Standard', premium: 'Premium' }[tier];
                    const tierColor = { free: '#22c55e', standard: '#38bdf8', premium: '#a855f7' }[tier];
                    return (
                        <div key={tier} style={{ marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: tierColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                                {tierLabel}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.6rem' }}>
                                {group.map(m => {
                                    const isActive = activeAIModel === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => !savingAIModel && saveAIModel(m.id)}
                                            disabled={savingAIModel}
                                            style={{
                                                background: isActive ? `${tierColor}18` : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${isActive ? tierColor : 'rgba(255,255,255,0.08)'}`,
                                                borderRadius: '12px', padding: '0.75rem 1rem',
                                                cursor: savingAIModel ? 'default' : 'pointer',
                                                textAlign: 'left', transition: 'all 0.18s',
                                                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                            }}
                                        >
                                            <CheckCircle2 size={15} color={isActive ? tierColor : 'transparent'} style={{ flexShrink: 0, marginTop: 2, strokeWidth: 2.5 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? 'white' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {m.name}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                                                    {m.description}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {aiModels.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading models...</p>
                )}
            </section>

            {/* ── Danger Zone ───────────────────────────────────────────────── */}
            <section style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                    <AlertTriangle size={18} /> Danger Zone
                </h3>

                {maintenanceSettings.map(setting => (
                    <div key={setting.key} style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1.2rem',
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#f87171' }}>GLOBAL MAINTENANCE MODE</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(248, 113, 113, 0.7)', marginTop: 2 }}>Disconnects all non-admin users and shows maintenance screen.</div>
                        </div>
                        <button
                            onClick={() => {
                                if (!setting.value && !window.confirm('Are you sure? This will lock out all users!')) return;
                                handleToggle(setting.key, setting.value);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: setting.value ? '#f87171' : '#94a3b8' }}
                        >
                            {setting.value ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                        </button>
                    </div>
                ))}
            </section>

            {/* ── Scheduled Maintenance ─────────────────────────────────────── */}
            <section style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
                    <Calendar size={18} /> Scheduled Maintenance Window
                </h3>

                {maintenance?.scheduledAt && (
                    <div style={{ padding: '0.85rem 1.1rem', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={15} color="#fbbf24" />
                        <span style={{ fontSize: '0.85rem', color: '#fbbf24', flex: 1 }}>
                            Scheduled: <strong>{new Date(maintenance.scheduledAt).toLocaleString()}</strong> · {maintenance.durationMinutes} min · "{maintenance.message}"
                        </span>
                        <button onClick={cancelMaintenance} disabled={maintLoading} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Cancel</button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Scheduled Date & Time</label>
                        <input type="datetime-local" className="styled-input" value={maintForm.scheduledAt} onChange={e => setMaintForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Duration (minutes)</label>
                        <input type="number" className="styled-input" min={5} max={480} value={maintForm.durationMinutes} onChange={e => setMaintForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>User-facing message</label>
                        <input className="styled-input" placeholder="We'll be back shortly. Thanks for your patience." value={maintForm.message} onChange={e => setMaintForm(f => ({ ...f, message: e.target.value }))} />
                    </div>
                </div>
                <button className="btn-primary" onClick={saveMaintenance} disabled={maintLoading || !maintForm.scheduledAt} style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
                    <Calendar size={14} style={{ marginRight: 6 }} />{maintLoading ? 'Saving...' : 'Schedule Window'}
                </button>
            </section>

            {/* ── Cache Controls ────────────────────────────────────────────── */}
            <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={18} color="#38bdf8" /> Cache Controls
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                            Flush the server-side cache to force fresh data on all admin views. Use after bulk data updates or when settings don't appear immediately.
                        </p>
                        {lastFlushed && (
                            <p style={{ fontSize: '0.72rem', color: '#22c55e', marginTop: '0.35rem' }}>
                                Last flushed: {new Date(lastFlushed).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={flushCache}
                        disabled={flushing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.6rem 1.25rem', borderRadius: 12,
                            background: flushing ? 'rgba(56,189,248,0.1)' : 'rgba(56,189,248,0.15)',
                            border: '1px solid rgba(56,189,248,0.3)',
                            color: '#38bdf8', cursor: flushing ? 'not-allowed' : 'pointer',
                            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={15} style={{ animation: flushing ? 'spin 0.8s linear infinite' : 'none' }} />
                        {flushing ? 'Flushing...' : 'Flush Cache'}
                    </button>
                </div>
            </section>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdminCommandCenter;
