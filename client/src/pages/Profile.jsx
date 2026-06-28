import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Clock, Calendar, Award, AlertCircle,
    BarChart3, TrendingUp, Play, CheckCircle, User, Edit2, Save, X, Lock, Trash2, Settings, Shield, Trophy, Layout, ArrowRight, Tag, Palette, Info, Check, Users, FileDown, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/Shared/LoadingScreen';
import FocusPulseHeatmap from '../components/Shared/FocusPulseHeatmap';
import Modal from '../components/Shared/Modal';

import StreakIcon from '../components/Shared/StreakIcon';
import { formatDate } from '../utils/dateTime';
import useFeatureFlags from '../hooks/useFeatureFlags';
import { AI_PROVIDERS, getUserAIConfig, setUserAIConfig, clearUserAIConfig } from '../utils/aiConfig';

const timezoneOptions = [
    'UTC',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Australia/Sydney'
];

const parseDurationToSeconds = (duration) => {
    if (!duration || typeof duration !== 'string') return 0;
    const parts = duration.split(':').map(Number);
    if (parts.some(Number.isNaN)) return 0;
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    return 0;
};

// ── AI Settings Card ───────────────────────────────────────────────────────
const AISettingsCard = () => {
    const saved = getUserAIConfig();
    const [cfg, setCfg] = useState({
        provider: saved?.provider || 'groq',
        apiKey:   saved?.apiKey  || '',
        model:    saved?.model   || '',
        baseUrl:  saved?.baseUrl || '',
    });
    const [status, setStatus] = useState(''); // '' | 'testing' | 'ok' | 'error'
    const [statusMsg, setStatusMsg] = useState('');

    const providerMeta = AI_PROVIDERS.find(p => p.id === cfg.provider) || AI_PROVIDERS[0];

    const handleSave = () => {
        if (cfg.apiKey.trim()) {
            setUserAIConfig(cfg);
            setStatus('ok'); setStatusMsg('Saved — your key lives only in this browser.');
        } else {
            clearUserAIConfig();
            setStatus('ok'); setStatusMsg('Config cleared. System default will be used.');
        }
        setTimeout(() => setStatus(''), 3000);
    };

    const handleTest = async () => {
        if (!cfg.apiKey.trim()) { setStatus('error'); setStatusMsg('Enter an API key first.'); return; }
        setStatus('testing'); setStatusMsg('Sending test message…');
        try {
            // Use a video ID that's unlikely to fail for a quick test
            const res = await api.post('/videos/test-ai', { message: 'Reply with: OK' }, {
                headers: {
                    'x-ai-provider': cfg.provider,
                    'x-ai-key':      cfg.apiKey,
                    'x-ai-model':    cfg.model || providerMeta.models[0] || '',
                    'x-ai-url':      cfg.provider === 'custom' ? cfg.baseUrl : providerMeta.baseUrl,
                }
            });
            setStatus('ok'); setStatusMsg(`Connected ✓  (${res.data?.content?.slice(0, 60) || 'OK'})`);
        } catch (err) {
            setStatus('error'); setStatusMsg(err.response?.data?.msg || err.message || 'Connection failed');
        }
    };

    const statusColor = status === 'ok' ? '#4ade80' : status === 'error' ? '#f87171' : 'rgba(255,255,255,0.4)';

    return (
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '35px', border: '1px solid rgba(99,102,241,0.2)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Zap size={22} style={{ color: '#818cf8' }} /> My AI Provider
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Use your own API key for AI features. It's stored only in this browser — never sent to our server or database.
                When set, it overrides the system default for all AI calls.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Provider */}
                <div>
                    <label className="input-label">Provider</label>
                    <select
                        value={cfg.provider}
                        onChange={e => setCfg({ ...cfg, provider: e.target.value, model: '', baseUrl: '' })}
                        className="styled-input" style={{ width: '100%' }}
                    >
                        {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {/* API Key */}
                <div>
                    <label className="input-label">API Key</label>
                    <input
                        type="password"
                        placeholder={providerMeta.placeholder || 'Paste your API key'}
                        value={cfg.apiKey}
                        onChange={e => setCfg({ ...cfg, apiKey: e.target.value })}
                        className="styled-input" style={{ width: '100%', fontFamily: 'monospace' }}
                    />
                </div>

                {/* Model */}
                <div>
                    <label className="input-label">Model <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(type any model name)</span></label>
                    {providerMeta.models.length > 0 ? (
                        <input
                            list={`model-list-${cfg.provider}`}
                            value={cfg.model}
                            onChange={e => setCfg({ ...cfg, model: e.target.value })}
                            placeholder={providerMeta.models[0] || 'e.g. gpt-4o-mini'}
                            className="styled-input" style={{ width: '100%' }}
                        />
                    ) : (
                        <input
                            value={cfg.model}
                            onChange={e => setCfg({ ...cfg, model: e.target.value })}
                            placeholder="Enter model name"
                            className="styled-input" style={{ width: '100%' }}
                        />
                    )}
                    {providerMeta.models.length > 0 && (
                        <datalist id={`model-list-${cfg.provider}`}>
                            {providerMeta.models.map(m => <option key={m} value={m} />)}
                        </datalist>
                    )}
                </div>

                {/* Base URL — custom only */}
                {cfg.provider === 'custom' && (
                    <div>
                        <label className="input-label">Base URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(OpenAI-compatible, without /chat/completions)</span></label>
                        <input
                            value={cfg.baseUrl}
                            onChange={e => setCfg({ ...cfg, baseUrl: e.target.value })}
                            placeholder="https://your-api.example.com/v1"
                            className="styled-input" style={{ width: '100%' }}
                        />
                    </div>
                )}

                {/* Status message */}
                {statusMsg && (
                    <p style={{ fontSize: '0.8rem', color: statusColor, margin: 0 }}>{statusMsg}</p>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleSave} className="btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: '100px' }}>
                        <Save size={15} /> Save
                    </button>
                    <button onClick={handleTest} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', minWidth: '100px' }} disabled={status === 'testing'}>
                        {status === 'testing' ? 'Testing…' : 'Test Connection'}
                    </button>
                    {cfg.apiKey && (
                        <button onClick={() => { clearUserAIConfig(); setCfg({ provider: 'groq', apiKey: '', model: '', baseUrl: '' }); setStatus('ok'); setStatusMsg('Cleared.'); }} className="btn-secondary" style={{ color: '#f87171', justifyContent: 'center' }}>
                            Clear
                        </button>
                    )}
                </div>

                {saved?.apiKey && (
                    <p style={{ fontSize: '0.75rem', color: '#4ade80', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} /> Active — using your own key for all AI features
                    </p>
                )}
            </div>
        </div>
    );
};

const Profile = () => {
    const { isEnabled } = useFeatureFlags();
    const { user: authUser, logout, setAuth } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState({ name: '', username: '', email: '', motto: '', themeColor: '#6366f1', isPublic: false });

    const [analytics, setAnalytics] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [stats, setStats] = useState({ 
        totalFocusHours: 0, 
        completedVideos: 0, 
        totalPlaylists: 0,
        xp: 0,
        level: 1,
        badges: [],
        achievements: [],
        nextLevelXp: 100,
        bestStreak: 0
    });
    const [achievementCatalog, setAchievementCatalog] = useState([]);

    const [schedules, setSchedules] = useState({
        upcoming: [],
        missed: [],
        completed: []
    });

    const [preferences, setPreferences] = useState({
        dailyStudyTime: { start: '18:00', end: '20:00' },
        videosPerDay: 3,
        maxWatchTimePerDay: 120,
        timezone: ''
    });

    const [activeTab, setActiveTab] = useState('dashboard');
    const [historyTab, setHistoryTab] = useState('completed');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [animateXp, setAnimateXp] = useState(false);

    // Account section states
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [deleteModal, setDeleteModal] = useState(false);
    const [confirmWipeText, setConfirmWipeText] = useState('');

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [analyticsRes, upcomingRes, missedRes, completedRes, prefsRes, heatmapRes, statsRes, catalogRes] = await Promise.all([
                api.get('/schedules/analytics'),
                api.get('/schedules/upcoming'),
                api.get('/schedules/missed'),
                api.get('/schedules/completed'),
                api.get('/users/preferences'),
                api.get('/analytics/heatmap'),
                api.get('/analytics/stats'),
                api.get('/achievements')
            ]);

            setAnalytics(analyticsRes.data);
            setSchedules({
                upcoming: upcomingRes.data,
                missed: missedRes.data,
                completed: completedRes.data
            });

            if (prefsRes.data) {
                setPreferences(prefsRes.data);
            }

            setHeatmapData(heatmapRes.data);
            setStats(statsRes.data);
            setAchievementCatalog(catalogRes.data);

            if (authUser) {
                setProfile({
                    name: authUser.name || '',
                    username: authUser.username || '',
                    email: authUser.email || '',
                    motto: statsRes.data.motto || 'Keep focusing, keep growing.',
                    themeColor: statsRes.data.themeColor || '#6366f1',
                    isPublic: statsRes.data.isPublic || false,
                    wipeRequested: statsRes.data.wipeRequested || false
                });
            }


            // Trigger XP Animation
            setTimeout(() => setAnimateXp(true), 500);

        } catch (err) {
            console.error('Error fetching profile data:', err);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (msg, type = 'success') => {
        setMessage({ text: msg, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await api.put('/users/profile', profile);
            setAuth({ user: res.data });
            showMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Error updating profile', 'error');
        }
    };

    const handleUpdatePreferences = async () => {
        try {
            const res = await api.put('/users/preferences', preferences);
            if (authUser) {
                setAuth({ user: { ...authUser, preferences: res.data.preferences } });
            }
            showMessage('Preferences saved successfully!');
        } catch (err) {
            console.error('Error updating preferences:', err);
            showMessage('Failed to save preferences.', 'error');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return showMessage('New passwords do not match', 'error');
        }

        try {
            await api.put('/users/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            showMessage('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Failed to change password', 'error');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.post('/users/wipe-request');
            setProfile(prev => ({ ...prev, wipeRequested: true }));
            setDeleteModal(false);
            showMessage('Wipe request submitted. Your data will be deleted in 8-10 working days.', 'info');
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Failed to submit wipe request', 'error');
            setDeleteModal(false);
        }
    };

    const generateStudyReport = () => {
        const fmtH = (s) => `${Math.floor((s || 0) / 3600)}h ${Math.floor(((s || 0) % 3600) / 60)}m`;
        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>PlanTube Study Report — ${profile.name || profile.username}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 720px; margin: 40px auto; color: #0f172a; }
  h1 { font-size: 2rem; font-weight: 900; margin-bottom: 0.25rem; }
  .sub { color: #64748b; margin-bottom: 2rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }
  .card h2 { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .card .val { font-size: 1.8rem; font-weight: 900; color: #6366f1; }
  .card .label { font-size: 0.78rem; color: #94a3b8; }
  h3 { font-size: 1rem; font-weight: 800; margin: 1.5rem 0 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  td, th { padding: 0.6rem 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
  th { background: #f1f5f9; font-weight: 700; font-size: 0.75rem; color: #475569; }
  .badge { display: inline-block; background: #6366f1; color: white; border-radius: 20px; padding: 2px 10px; font-size: 0.7rem; font-weight: 700; }
  footer { margin-top: 3rem; font-size: 0.75rem; color: #94a3b8; text-align: center; }
  @media print { body { margin: 20px; } }
</style>
</head><body>
<h1>📚 Study Report</h1>
<div class="sub">Generated for <strong>${profile.name || profile.username}</strong> &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
<div class="grid">
  <div class="card"><h2>Total Focus Time</h2><div class="val">${fmtH(stats.totalFocusHours * 3600)}</div><div class="label">all time</div></div>
  <div class="card"><h2>Current Streak</h2><div class="val">${analytics?.streak || 0} days</div><div class="label">consecutive days</div></div>
  <div class="card"><h2>Videos Completed</h2><div class="val">${stats.completedVideos || 0}</div><div class="label">total</div></div>
  <div class="card"><h2>Best Streak</h2><div class="val">${analytics?.bestStreak || 0} days</div><div class="label">personal record</div></div>
  <div class="card"><h2>Level</h2><div class="val">${authUser?.level || 1}</div><div class="label">${authUser?.xp || 0} XP</div></div>
  <div class="card"><h2>Avg. Session</h2><div class="val">${fmtH(stats.avgSession || 0)}</div><div class="label">per study session</div></div>
</div>
<h3>Top Playlists</h3>
<table>
  <tr><th>#</th><th>Playlist</th><th>Progress</th></tr>
  ${(stats.topPlaylists || []).slice(0, 8).map((p, i) => `<tr><td>${i + 1}</td><td>${p.title || p.playlistTitle || 'Playlist'}</td><td><span class="badge">${p.percent || 0}%</span></td></tr>`).join('')}
  ${(!stats.topPlaylists || stats.topPlaylists.length === 0) ? '<tr><td colspan="3" style="color:#94a3b8;text-align:center">No playlist data yet</td></tr>' : ''}
</table>
<footer>Generated by PlanTube &nbsp;·&nbsp; planTube.app &nbsp;·&nbsp; ${new Date().toISOString()}</footer>
</body></html>`;
        const win = window.open('', '_blank');
        if (!win) { alert('Allow pop-ups to generate the report.'); return; }
        win.document.write(html);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 300);
    };

    const handleReschedule = async (scheduleId) => {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            await api.put(`/schedules/${scheduleId}`, {
                status: 'pending',
                scheduledDate: tomorrow.toISOString()
            });
            showMessage('Session rescheduled for tomorrow');
            fetchProfileData();
        } catch (err) {
            showMessage('Failed to reschedule', 'error');
        }
    };

    const renderList = (list, emptyMsg, type) => {
        if (list.length === 0) {
            return (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '0.9rem' }}>{emptyMsg}</p>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {list.map(s => {
                    // Check if the video belongs to a playlist context
                    const isPlaylist = !!s.playlistId;
                    
                    return (
                        <div key={s._id} className="glass-hover" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <img
                                src={s.videoId?.thumbnail}
                                alt=""
                                style={{ width: '100px', aspectRatio: '16/9', borderRadius: '14px', objectFit: 'cover' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'white' }}>{s.videoId?.title}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: isPlaylist ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: isPlaylist ? '#818cf8' : 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {isPlaylist ? <Layout size={10} /> : <Play size={10} />}
                                        {isPlaylist ? 'Playlist' : 'Single'}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> {s.videoId?.duration}</span>
                                    {s.scheduledDate && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Calendar size={12} /> {formatDate(s.scheduledDate, { day: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {type === 'missed' && (
                                <button onClick={() => handleReschedule(s._id)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', borderRadius: '12px' }}>
                                    Reschedule
                                </button>
                            )}

                            {(type === 'upcoming' || type === 'roadmap') && (
                                <a
                                    href={`https://www.youtube.com/watch?v=${s.videoId?.videoId}`}
                                    target="_blank" rel="noreferrer"
                                    className="btn-secondary"
                                    style={{ width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${profile.themeColor}1a`, border: `1px solid ${profile.themeColor}44` }}
                                >
                                    <Play size={18} style={{ color: profile.themeColor }} />
                                </a>
                            )}

                            {type === 'completed' && (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={18} style={{ color: '#22c55e' }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };



    if (loading) return <LoadingScreen message="Loading your command center..." />;

    const xpProgress = ((stats.xp - Math.pow((stats.level - 1) * 5, 2)) / (stats.nextLevelXp - Math.pow((stats.level - 1) * 5, 2))) * 100;
    const streak = analytics?.streak || 0;
    const bestStreak = Math.max(stats.bestStreak || 0, analytics?.bestStreak || 0);

    const effectiveHeatmapData = heatmapData;

    const recentSessions = effectiveHeatmapData
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4)
        .map((d) => ({
            date: d.date,
            seconds: d.seconds
        }));

    // Weekly Breakdown Calculation
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });
    const weeklyData = last7Days.map(date => {
        const day = effectiveHeatmapData.find(h => h.date === date);
        return { date, mins: day ? Math.round(day.seconds / 60) : 0 };
    });
    const maxMins = Math.max(...weeklyData.map(d => d.mins), 60);
    const focusStatsTotalSeconds = effectiveHeatmapData.reduce((sum, day) => sum + (day.seconds || 0), 0);
    const focusStatsTotalHours = (focusStatsTotalSeconds / 3600).toFixed(1);

    return (
        <div className="profile-page" style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem', minHeight: '80vh', alignItems: 'flex-start' }}>
            
            {/* --- LEFT SIDEBAR NAVIGATION --- */}
            <div className="profile-sidebar" data-section="profile-header" style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '80px', height: 'fit-content' }}>
                
                {/* User Identity Card */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '32px', textAlign: 'center', border: `1px solid ${profile.themeColor}33`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '100px', height: '100px', background: profile.themeColor, filter: 'blur(50px)', opacity: 0.2 }}></div>
                    
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                        <img 
                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(profile.username || 'user')}`}
                            alt="avatar"
                            style={{
                                width: '110px', height: '110px', borderRadius: '35px',
                                background: 'rgba(255,255,255,0.05)', border: '2px solid var(--glass-border)',
                                boxShadow: streak >= 3 ? `0 0 30px ${profile.themeColor}66` : '0 12px 40px rgba(0, 0, 0, 0.4)',
                                padding: '6px', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        />
                        {streak >= 3 && (
                            <div style={{ position: 'absolute', top: '-12px', right: '-12px', background: profile.themeColor, borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${profile.themeColor}`, animation: 'float 3s infinite', overflow: 'hidden' }}>
                                <StreakIcon size={24} />
                            </div>
                        )}
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>{profile.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem', fontWeight: '600' }}>@{profile.username}</p>
                    
                    <div style={{ background: `${profile.themeColor}1a`, color: profile.themeColor, padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', display: 'inline-block' }}>
                        LEVEL {stats.level}
                    </div>
                </div>

                {/* Vertical Navigation Links */}
                <div className="profile-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                        { id: 'dashboard', icon: Layout, label: 'Command Center' },
                        { id: 'history', icon: Calendar, label: 'Study History' },
                        { id: 'trophies', icon: Trophy, label: 'Trophy Room' },
                        { id: 'settings', icon: Settings, label: 'Config & Tools' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1.2rem 1.5rem', borderRadius: '20px',
                                border: 'none', background: activeTab === tab.id ? profile.themeColor : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                                fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: 'left'
                            }}
                        >
                            <tab.icon size={20} />
                            <span style={{ fontSize: '0.95rem' }}>{tab.label}</span>
                            {activeTab === tab.id && <ArrowRight size={16} style={{ marginLeft: 'auto' }} />}
                        </button>
                    ))}
                </div>

                {/* Social Shortcut */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '1rem', textTransform: 'uppercase' }}>Community</p>
                    <button onClick={() => navigate('/social')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', gap: '0.75rem' }}>
                        <Users size={18} /> Social Hub
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="profile-main" style={{ flex: 1 }}>
                
                {message.text && (
                    <div style={{
                        padding: '1rem 1.5rem', borderRadius: '20px', marginBottom: '2rem',
                        background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: message.type === 'error' ? '#ef4444' : '#22c55e',
                        border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Dashboard View */}
                {activeTab === 'dashboard' && (
                    <div className="profile-dashboard" data-section="profile-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* Hero XP Banner */}
                        <div className="glass" style={{ padding: '3rem', borderRadius: '40px', position: 'relative', overflow: 'hidden', border: `1px solid ${profile.themeColor}33` }}>
                             <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: profile.themeColor, filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }}></div>
                             
                             <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '0.75rem' }}>Current Rank</p>
                                        <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px' }}>Level {stats.level} <span style={{ color: profile.themeColor, fontSize: '1.5rem', verticalAlign: 'middle', marginLeft: '0.5rem' }}>({Math.floor(stats.xp)} XP)</span></h1>
                                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>"{profile.motto}"</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '1rem', fontWeight: '900', color: 'white' }}>{Math.floor(stats.nextLevelXp - stats.xp)} XP to Level {stats.level + 1}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{focusStatsTotalHours} total focus hours</p>
                                    </div>
                                </div>
                                
                                <div style={{ width: '100%', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ 
                                        width: animateXp ? `${xpProgress}%` : '0%', 
                                        height: '100%', 
                                        background: `linear-gradient(90deg, ${profile.themeColor}, #ec4899)`, 
                                        borderRadius: '10px', 
                                        transition: 'width 2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                                    }}></div>
                                </div>
                             </div>
                        </div>

                        {/* Bento Grid Layout */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                            
                            {/* Roadmap Card */}
                            <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ArrowRight size={24} style={{ color: profile.themeColor }} /> Mastery Roadmap
                                    </h3>
                                    <button onClick={() => setActiveTab('history')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>View History</button>
                                </div>
                                {schedules.upcoming.slice(0, 3).length > 0 ? renderList(schedules.upcoming.slice(0, 3), "", "roadmap") : (
                                    <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <p style={{ color: 'var(--text-muted)' }}>Roadmap clear! Time to set new goals.</p>
                                    </div>
                                )}
                            </div>

                            {/* Heatmap Mini Card */}
                            {isEnabled('feat_heatmap') && (
                                <div className="glass" style={{ padding: '2rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <BarChart3 size={20} style={{ color: profile.themeColor }} /> Focus Pulse
                                    </h3>
                                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-2rem' }}>
                                        <FocusPulseHeatmap data={effectiveHeatmapData} streak={streak} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                                        <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Streak</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: '900' }}>{streak}d</p>
                                        </div>
                                        <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: '900' }}>{bestStreak}d</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Sessions Feed */}
                            <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Clock size={24} style={{ color: profile.themeColor }} /> Recent Focus Sessions
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {recentSessions.map((act, i) => (
                                        <div key={i} className="glass-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: act.seconds > 3600 ? '#22c55e' : profile.themeColor, boxShadow: `0 0 10px ${act.seconds > 3600 ? '#22c55e' : profile.themeColor}` }}></div>
                                                <div>
                                                    <p style={{ fontSize: '1rem', fontWeight: '800' }}>{formatDate(act.date || Date.now(), { day: 'numeric', month: 'short' })}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Focus Block</p>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '1.1rem', fontWeight: '900' }}>{Math.round(act.seconds / 60)} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>MINS</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Consistency & Insight Sidebar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="glass" style={{ padding: '2rem', borderRadius: '32px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Weekly Consistency</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100px' }}>
                                        {weeklyData.map((d, i) => (
                                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                                <div style={{ width: '16px', height: `${(d.mins / maxMins) * 100}%`, background: d.date === new Date().toISOString().split('T')[0] ? profile.themeColor : 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '700' }}>{formatDate(d.date, { weekday: 'short' }).charAt(0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass" style={{ padding: '2rem', borderRadius: '32px', background: `linear-gradient(135deg, ${profile.themeColor}15, transparent)` }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Info size={18} style={{ color: profile.themeColor }} /> Smart Insight
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>You're most productive on <strong style={{ color: 'white' }}>Tuesday mornings</strong>. Keep that momentum going!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History View */}
                {activeTab === 'history' && (
                    <div data-section="profile-history" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '1rem', borderRadius: '24px', display: 'flex', gap: '0.5rem' }}>
                            {['completed', 'upcoming', 'missed'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setHistoryTab(tab)}
                                    style={{
                                        flex: 1, padding: '1rem', borderRadius: '16px', border: 'none',
                                        background: historyTab === tab ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        color: historyTab === tab ? 'white' : 'var(--text-muted)',
                                        fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s'
                                    }}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="glass" style={{ padding: '2rem', borderRadius: '32px' }}>
                            {historyTab === 'completed' && renderList(schedules.completed, "No completed sessions yet.", 'completed')}
                            {historyTab === 'upcoming' && renderList(schedules.upcoming, "No upcoming sessions planned.", 'upcoming')}
                            {historyTab === 'missed' && renderList(schedules.missed, "Zero missed sessions. Perfect record!", 'missed')}
                        </div>
                    </div>
                )}

                {/* Trophies View */}
                {activeTab === 'trophies' && (
                    <div data-section="profile-trophies" className="glass" style={{ padding: '4rem', borderRadius: '40px', textAlign: 'center' }}>
                         <div style={{ width: '100px', height: '100px', background: `${profile.themeColor}1a`, borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', animation: 'float 3s ease-in-out infinite' }}>
                            <Trophy size={48} style={{ color: profile.themeColor }} />
                        </div>
                        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>Trophy Room</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '4rem', fontSize: '1.2rem' }}>{((stats.badges?.length || 0) + (stats.achievements?.length || 0))} / {achievementCatalog.length || 0} Artifacts Unlocked</p>
                        
                        <div style={{ width: '100%', maxWidth: '500px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', margin: '0 auto 5rem', overflow: 'hidden' }}>
                            <div style={{ width: `${((stats.badges?.length || 0) + (stats.achievements?.length || 0)) / Math.max(1, achievementCatalog.length) * 100}%`, height: '100%', background: profile.themeColor, borderRadius: '4px', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '3rem' }}>
                            {achievementCatalog.length > 0 ? achievementCatalog.map((badge, i) => {
                                const isUnlocked = stats.achievements?.some(b => b.key === badge.key) || stats.badges?.some(b => b.name === badge.name);
                                return (
                                    <div key={i} style={{ 
                                        opacity: isUnlocked ? 1 : 0.15,
                                        transform: isUnlocked ? 'scale(1)' : 'scale(0.9)',
                                        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        padding: '2.5rem 1.5rem',
                                        background: isUnlocked ? 'rgba(255,255,255,0.03)' : 'transparent',
                                        borderRadius: '35px',
                                        border: `1px solid ${isUnlocked ? profile.themeColor + '66' : 'rgba(255,255,255,0.05)'}`,
                                        position: 'relative',
                                        animation: isUnlocked ? `pulseGlow 2.5s infinite ${i * 0.3}s` : 'none'
                                    }}>
                                        <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', filter: isUnlocked ? 'none' : 'grayscale(1)', display: 'flex', justifyContent: 'center' }}>
                                            {badge.iconType === 'image' ? (
                                                <img src={badge.icon} alt={badge.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '20px' }} />
                                            ) : (
                                                typeof badge.icon === 'string' ? badge.icon : badge.icon
                                            )}
                                        </div>
                                        <h4 style={{ fontWeight: '900', fontSize: '1.1rem', marginBottom: '0.5rem', color: isUnlocked ? 'white' : 'var(--text-muted)' }}>{badge.name}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{badge.description}</p>
                                        {isUnlocked && (
                                            <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#22c55e', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}>
                                                <Check size={14} color="white" strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>Syncing Trophy Catalog with the Server...</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings View */}
                {activeTab === 'settings' && (
                    <div data-section="profile-settings" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '3rem', borderRadius: '35px' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><User size={24} className="text-primary" /> Profile Identity</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <label className="input-label">Display Name</label>
                                    <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="styled-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label className="input-label">Personal Motto</label>
                                    <input value={profile.motto} onChange={(e) => setProfile({ ...profile, motto: e.target.value })} className="styled-input" style={{ width: '100%' }} maxLength="60" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: '800' }}>Public Discovery</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allow others to see your achievements</p>
                                    </div>
                                    <button onClick={() => setProfile({ ...profile, isPublic: !profile.isPublic })} style={{ width: '50px', height: '26px', borderRadius: '13px', background: profile.isPublic ? profile.themeColor : 'rgba(255,255,255,0.1)', position: 'relative', border: 'none', cursor: 'pointer', transition: '0.3s' }}>
                                        <div style={{ position: 'absolute', top: '3px', left: profile.isPublic ? '27px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: '0.3s' }} />
                                    </button>
                                </div>
                                <button onClick={handleUpdateProfile} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1.2rem' }}><Save size={20} /> Update Identity</button>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '3rem', borderRadius: '35px' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Palette size={24} className="text-primary" /> Visual Theme</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Pick an accent color that resonates with your learning style.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                {['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6'].map(color => (
                                    <button key={color} onClick={() => setProfile({ ...profile, themeColor: color })} style={{ height: '60px', borderRadius: '18px', background: color, border: profile.themeColor === color ? '4px solid white' : 'none', cursor: 'pointer', transition: '0.2s transform', transform: profile.themeColor === color ? 'scale(1.05)' : 'scale(1)' }} />
                                ))}
                            </div>
                            <button onClick={handleUpdateProfile} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Sync Theme</button>
                        </div>

                        <div className="glass" style={{ padding: '3rem', borderRadius: '35px' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '2.5rem' }}>Security & Privacy</h3>
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <input type="password" placeholder="Current Password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="styled-input" required />
                                <input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="styled-input" required />
                                <button type="submit" className="btn-secondary" style={{ justifyContent: 'center' }}>Update Security</button>
                            </form>
                        </div>

                        <div className="glass" style={{ padding: '3rem', borderRadius: '35px' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '1rem' }}>Timezone</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Set the timezone you want PlanTube to use for schedule and activity displays.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="input-label">Preferred timezone</label>
                                    <input
                                        list="timezone-options"
                                        className="styled-input"
                                        value={preferences.timezone || ''}
                                        onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                                        placeholder="Asia/Kolkata"
                                    />
                                    <datalist id="timezone-options">
                                        {timezoneOptions.map((zone) => <option key={zone} value={zone} />)}
                                    </datalist>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Use an IANA timezone like Asia/Kolkata, Europe/London, or America/New_York.</p>
                                <button onClick={handleUpdatePreferences} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Save Timezone</button>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: '0.5rem' }}>Study Report</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                                Download a printable PDF summary of your learning stats, streaks, and progress.
                            </p>
                            <button onClick={generateStudyReport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                <FileDown size={16} /> Generate Study Report
                            </button>
                        </div>

                        <AISettingsCard />

                        <div className="glass" style={{ padding: '3rem', borderRadius: '35px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '1rem', color: '#ef4444' }}>Terminal Deletion</h3>
                            {profile.wipeRequested ? (
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <p style={{ color: '#ef4444', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> Deletion Pending</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Your account is scheduled for terminal deletion in 8-10 working days. An administrator will review and process this request.</p>
                                </div>
                            ) : (
                                <>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Destroy all records and wipe your learning legacy. This cannot be undone.</p>
                                    <button onClick={() => { setDeleteModal(true); setConfirmWipeText(''); }} className="btn-primary" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', justifyContent: 'center' }}>
                                        <Trash2 size={20} /> Wipe Data
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Modal remains same */}
                <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)}>
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '2rem' }} />
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem' }}>Confirm Destruction?</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>All progress, trophies, and stats will be permanently lost after the 8-10 day review period.</p>
                        
                        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>Type <strong>confirm wiping</strong> below to proceed:</p>
                        <input 
                            type="text" 
                            className="styled-input" 
                            style={{ width: '100%', textAlign: 'center', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            value={confirmWipeText}
                            onChange={(e) => setConfirmWipeText(e.target.value)}
                            placeholder="confirm wiping"
                        />

                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <button onClick={() => setDeleteModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Abort</button>
                            <button 
                                onClick={handleDeleteAccount} 
                                disabled={confirmWipeText !== 'confirm wiping'}
                                className="btn-primary" 
                                style={{ flex: 1, justifyContent: 'center', background: confirmWipeText === 'confirm wiping' ? '#ef4444' : 'rgba(255,255,255,0.1)', opacity: confirmWipeText === 'confirm wiping' ? 1 : 0.5 }}
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Profile;
