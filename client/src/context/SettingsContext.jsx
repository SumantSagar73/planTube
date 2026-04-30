import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [flags, setFlags] = useState({
        feat_ai_brainstorm: true,
        feat_ai_chat: true,
        feat_notes: true,
        feat_heatmap: true,
        feat_lock_mode: true,
        maintenance_mode: false
    });
    const [loading, setLoading] = useState(true);

    const refreshFlags = async () => {
        try {
            const res = await api.get(`/settings/features?t=${Date.now()}`);
            setFlags(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshFlags();
        
        // Refresh every 30 seconds for real-time feel if admin is active
        const interval = setInterval(refreshFlags, 30000);
        return () => clearInterval(interval);
    }, []);

    const isEnabled = (key) => flags[key] === true;

    return (
        <SettingsContext.Provider value={{ flags, isEnabled, loading, refreshFlags }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
