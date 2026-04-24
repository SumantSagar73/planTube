import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Check, Palette } from 'lucide-react';

const ThemeSwitcher = () => {
    const { theme, toggleTheme, themes } = useTheme();
    const { user, setAuth } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="icon-btn-compact"
                title="Change Theme"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Palette size={18} />
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="glass shadow-lg" style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        width: '240px',
                        padding: '1rem',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-card)',
                        marginTop: '0.5rem',
                        zIndex: 999,
                        backdropFilter: 'blur(20px)'
                    }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Palette size={14} /> Appearance
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={async () => {
                                        toggleTheme(t.id);
                                        if (user) {
                                            try {
                                                const res = await api.put('/user/profile', {
                                                    name: user.name,
                                                    username: user.username,
                                                    themeColor: t.color
                                                });
                                                setAuth({ user: { ...user, themeColor: t.color, ...res.data } });
                                            } catch (err) {
                                                console.warn('Failed to save theme preference:', err);
                                            }
                                        }
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '10px',
                                        background: theme === t.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        border: theme === t.id ? '1px solid var(--primary)' : '1px solid transparent',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    className="glass-hover"
                                >
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: t.color,
                                        border: '2px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {theme === t.id && <Check size={12} color={t.id === 'solarized' || t.id === 'monochrome' ? '#000' : '#fff'} />}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center' }}>
                                        {t.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ThemeSwitcher;
