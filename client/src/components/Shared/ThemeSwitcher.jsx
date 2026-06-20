import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Check, Palette } from 'lucide-react';

const ThemeSwitcher = () => {
    const { theme, toggleTheme, themes } = useTheme();
    const { user, setAuth } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = async (t) => {
        toggleTheme(t.id);
        if (user) {
            try {
                const res = await api.put('/user/profile', {
                    name: user.name,
                    username: user.username,
                    themeColor: t.color,
                });
                setAuth({ user: { ...user, themeColor: t.color, ...res.data } });
            } catch { }
        }
        setIsOpen(false);
    };

    const darkThemes = themes.filter(t => t.dark !== false);
    const lightThemes = themes.filter(t => t.dark === false);

    const ThemeGroup = ({ label, list }) => (
        <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ margin: '0 0 6px 2px', fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {label}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {list.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => handleSelect(t)}
                        title={t.name}
                        style={{
                            padding: '8px 4px 6px',
                            borderRadius: '10px',
                            background: theme === t.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                            border: theme === t.id ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                            transition: 'all 0.2s', cursor: 'pointer',
                        }}
                        className="glass-hover"
                    >
                        <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: t.color,
                            border: '2px solid rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: theme === t.id ? `0 0 8px ${t.color}66` : 'none',
                        }}>
                            {theme === t.id && (
                                <Check size={11} color={t.dark === false ? '#000' : '#fff'} />
                            )}
                        </div>
                        <span style={{
                            fontSize: '0.58rem', fontWeight: 600,
                            color: theme === t.id ? 'var(--primary)' : 'var(--text-muted)',
                            textAlign: 'center', lineHeight: 1.2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            maxWidth: '60px',
                        }}>
                            {t.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="icon-btn-compact"
                title="Change Theme"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <Palette size={18} />
            </button>

            {isOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setIsOpen(false)} />
                    <div className="glass shadow-lg" style={{
                        position: 'absolute', top: '100%', right: 0,
                        width: '260px', padding: '1rem',
                        borderRadius: '18px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-card)',
                        marginTop: '0.5rem', zIndex: 999,
                        backdropFilter: 'blur(24px)',
                        maxHeight: '420px', overflowY: 'auto',
                    }}>
                        <h4 style={{
                            fontSize: '0.88rem', fontWeight: 800, marginBottom: '1rem',
                            color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                            <Palette size={14} /> Appearance
                        </h4>
                        <ThemeGroup label="Dark" list={darkThemes} />
                        <ThemeGroup label="Light" list={lightThemes} />
                    </div>
                </>
            )}
        </div>
    );
};

export default ThemeSwitcher;
