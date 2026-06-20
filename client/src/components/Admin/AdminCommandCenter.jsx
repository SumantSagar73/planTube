import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, AlertTriangle, ShieldCheck, Zap, Calendar, Trash2, RefreshCw, Database, Clock, BrainCircuit, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import adminService from '../../services/adminService';
import { useSettings } from '../../context/SettingsContext';

const AdminCommandCenter = ({ notify }) => {
    const { refreshFlags } = useSettings();
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    const fetchSettings = async () => {
        try {
            const res = await api.get(`/settings/all?t=${Date.now()}`);
            // De-duplicate settings by key in case of DB inconsistencies
            const uniqueSettings = Array.from(new Map(res.data.map(item => [item.key, item])).values());
            setSettings(uniqueSettings);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            notify('Failed to load system settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleToggle = async (key, currentValue) => {
        setUpdating(key);
        try {
            await api.put('/settings/update', { key, value: !currentValue });
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: !currentValue } : s));
            refreshFlags(); // Sync global state
            notify(`Updated ${key} successfully`, 'success');
        } catch (err) {
            console.error('Update failed:', err);
            notify('Failed to update setting', 'error');
        } finally {
            setUpdating(null);
        }
    };

    // ── Scheduled Maintenance ──────────────────────────────────────────────────
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

    // ── Cache Flush ────────────────────────────────────────────────────────────
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

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Command Center...</div>;

    const featureSettings = settings.filter(s => s.category === 'features');
    const maintenanceSettings = settings.filter(s => s.category === 'maintenance');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Zap style={{ color: '#fbbf24' }} /> Command Center
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time feature toggles and platform health controls.</p>
            </header>

            {/* Feature Flags */}
            <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="#60a5fa" /> Feature Flags
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {featureSettings.map(setting => (
                        <div key={setting.key} style={{ 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.05)', 
                            padding: '1.2rem', 
                            borderRadius: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            opacity: updating === setting.key ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white' }}>
                                    {setting.key.replace('feat_', '').replace(/_/g, ' ').toUpperCase()}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px' }}>{setting.description}</span>
                            </div>
                            
                            <button 
                                onClick={() => handleToggle(setting.key, setting.value)}
                                disabled={updating === setting.key}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: setting.value ? '#34d399' : '#94a3b8' }}
                            >
                                {setting.value ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* AI Model Configuration */}
            <section style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BrainCircuit size={18} color="#818cf8" /> AI Model Configuration
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Select the AI model that powers brainstorm notes and flashcard generation for all users.
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

            {/* Maintenance Mode */}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#f87171' }}>GLOBAL MAINTENANCE MODE</span>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(248, 113, 113, 0.7)' }}>Disconnects all non-admin users and shows maintenance screen.</span>
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

            {/* Scheduled Maintenance */}
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

            {/* Cache Controls */}
            <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={18} color="#38bdf8" /> Cache Controls
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                            Flush the server-side cache to force fresh data on all admin views. Use when settings changes don't appear immediately or after a bulk data update.
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
                            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={15} style={{ animation: flushing ? 'spin 0.8s linear infinite' : 'none' }} />
                        {flushing ? 'Flushing...' : 'Flush Cache'}
                    </button>
                </div>
            </section>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default AdminCommandCenter;
