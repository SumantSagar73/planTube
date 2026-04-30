import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Info, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import api from '../../services/api';
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
        </div>
    );
};

export default AdminCommandCenter;
