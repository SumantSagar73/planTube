import React, { useEffect, useState } from 'react';
import { FlaskConical, Plus, Play, Pause, CheckCircle, Trash2, RefreshCw, X } from 'lucide-react';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/dateTime';

const STATUS_META = {
    draft: { label: 'Draft', color: '#94a3b8' },
    running: { label: 'Running', color: '#22c55e' },
    paused: { label: 'Paused', color: '#f59e0b' },
    completed: { label: 'Completed', color: '#6366f1' },
};

const AUDIENCES = { all: 'All Users', new_users: 'New Users Only', active_users: 'Active Users Only' };

const defaultForm = { name: '', description: '', key: '', targetAudience: 'all', startDate: '', endDate: '', variants: [{ name: 'Control', description: '', trafficPct: 50, isControl: true }, { name: 'Variant A', description: '', trafficPct: 50, isControl: false }] };

const AdminABTests = ({ notify }) => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);

    const fetchTests = async () => {
        setLoading(true);
        try { setTests(await adminService.getABTests()); }
        catch { notify?.('Failed to load tests', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTests(); }, []);

    const handleCreate = async () => {
        if (!form.name || !form.key) return notify?.('Name and key are required', 'error');
        setSaving(true);
        try {
            await adminService.createABTest(form);
            notify?.('Test created', 'success');
            setShowCreate(false);
            setForm(defaultForm);
            fetchTests();
        } catch (e) {
            notify?.(e?.response?.data?.msg || 'Failed to create test', 'error');
        } finally { setSaving(false); }
    };

    const updateStatus = async (id, status) => {
        try {
            await adminService.updateABTest(id, { status });
            notify?.(`Test ${status}`, 'success');
            fetchTests();
        } catch { notify?.('Update failed', 'error'); }
    };

    const deleteTest = async (id) => {
        if (!window.confirm('Delete this test?')) return;
        try {
            await adminService.deleteABTest(id);
            notify?.('Test deleted', 'success');
            fetchTests();
        } catch { notify?.('Delete failed', 'error'); }
    };

    const setVariant = (i, key, val) => {
        const v = [...form.variants];
        v[i] = { ...v[i], [key]: val };
        setForm(f => ({ ...f, variants: v }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px' }}>A/B Test Manager</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Create and control feature experiments across user segments</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={fetchTests}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</button>
                    <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={15} /> New Test</button>
                </div>
            </div>

            {showCreate && (
                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 20, border: '1px solid rgba(99,102,241,0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 800 }}>New A/B Test</h3>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowCreate(false)}><X size={18} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Test Name *</label>
                            <input className="styled-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. New Dashboard Layout" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Feature Key * (unique, snake_case)</label>
                            <input className="styled-input" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} placeholder="e.g. new_dashboard_v2" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                            <input className="styled-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What are you testing?" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Target Audience</label>
                            <select className="styled-input" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}>
                                {Object.entries(AUDIENCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Start Date</label>
                                <input type="date" className="styled-input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>End Date</label>
                                <input type="date" className="styled-input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Variants & Traffic Split</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {form.variants.map((v, i) => (
                                <div key={i} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <input className="styled-input" style={{ fontSize: '0.82rem' }} value={v.name} onChange={e => setVariant(i, 'name', e.target.value)} placeholder="Variant name" />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="range" min={0} max={100} value={v.trafficPct} onChange={e => setVariant(i, 'trafficPct', Number(e.target.value))} style={{ flex: 1 }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: 35 }}>{v.trafficPct}%</span>
                                    </div>
                                    {v.isControl && <span style={{ fontSize: '0.68rem', color: '#6366f1' }}>Control group</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Test'}</button>
                    </div>
                </div>
            )}

            {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tests.map(t => {
                        const meta = STATUS_META[t.status] || STATUS_META.draft;
                        return (
                            <div key={t._id} className="glass-card" style={{ padding: '1.25rem', borderRadius: 18, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${meta.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FlaskConical size={20} color={meta.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                                        <strong style={{ fontSize: '0.95rem' }}>{t.name}</strong>
                                        <span style={{ padding: '2px 8px', borderRadius: 8, background: `${meta.color}22`, color: meta.color, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>{meta.label}</span>
                                        <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)', fontSize: '0.68rem', fontFamily: 'monospace' }}>{t.key}</span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {AUDIENCES[t.targetAudience] || t.targetAudience}
                                        {t.variants?.length ? ` · ${t.variants.length} variants` : ''}
                                        {t.createdBy ? ` · by ${t.createdBy.name}` : ''}
                                        {t.startDate ? ` · ${formatDate(t.startDate)}` : ''}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                    {t.status === 'draft' && <button className="icon-btn" title="Start" onClick={() => updateStatus(t._id, 'running')}><Play size={15} color="#22c55e" /></button>}
                                    {t.status === 'running' && <button className="icon-btn" title="Pause" onClick={() => updateStatus(t._id, 'paused')}><Pause size={15} color="#f59e0b" /></button>}
                                    {t.status === 'paused' && <button className="icon-btn" title="Resume" onClick={() => updateStatus(t._id, 'running')}><Play size={15} color="#22c55e" /></button>}
                                    {t.status !== 'completed' && <button className="icon-btn" title="Complete" onClick={() => updateStatus(t._id, 'completed')}><CheckCircle size={15} color="#6366f1" /></button>}
                                    <button className="icon-btn" title="Delete" onClick={() => deleteTest(t._id)}><Trash2 size={15} color="#ef4444" /></button>
                                </div>
                            </div>
                        );
                    })}
                    {!tests.length && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FlaskConical size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                            No A/B tests yet. Create one to start experimenting.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminABTests;
