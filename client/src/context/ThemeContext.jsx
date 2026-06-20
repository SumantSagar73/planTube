import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const themes = [
        // ── Dark themes ───────────────────────────────────
        { id: 'default',     name: 'Original Dark',   color: '#6366f1', dark: true },
        { id: 'midnight',    name: 'Midnight',         color: '#7c85ff', dark: true },
        { id: 'cyberpunk',   name: 'Cyberpunk',        color: '#00ffcc', dark: true },
        { id: 'rose',        name: 'Rose Dark',        color: '#f472b6', dark: true },
        { id: 'amber',       name: 'Amber Dark',       color: '#f59e0b', dark: true },
        { id: 'dracula',     name: 'Dracula',          color: '#bd93f9', dark: true },
        { id: 'ocean',       name: 'Deep Ocean',       color: '#22d3ee', dark: true },
        { id: 'cherry',      name: 'Cherry',           color: '#e11d48', dark: true },
        { id: 'forest-dark', name: 'Forest Dark',      color: '#22c55e', dark: true },
        { id: 'nordic',      name: 'Nordic Night',     color: '#2E3440', dark: true },
        { id: 'youtube',     name: 'YouTube Red',      color: '#FF0000', dark: true },
        // ── Light themes ──────────────────────────────────
        { id: 'indigo',      name: 'Deep Indigo',      color: '#3F51B5', dark: false },
        { id: 'teal',        name: 'Muted Teal',       color: '#0F766E', dark: false },
        { id: 'slate',       name: 'Slate Blue',       color: '#334155', dark: false },
        { id: 'forest',      name: 'Forest Green',     color: '#2E7D32', dark: false },
        { id: 'monochrome',  name: 'Monochrome',       color: '#1F2937', dark: false },
        { id: 'solarized',   name: 'Solarized Light',  color: '#FDF6E3', dark: false },
        { id: 'earth',       name: 'Earth Tone',       color: '#795548', dark: false },
    ];

    const resolveThemeFromColor = (color) => {
        if (!color) return null;
        const match = themes.find((option) => option.color.toLowerCase() === String(color).toLowerCase());
        return match?.id || null;
    };

    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('plantube-theme');
        if (savedTheme) return savedTheme;

        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
            return resolveThemeFromColor(storedUser?.themeColor) || 'default';
        } catch (err) {
            return 'default';
        }
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        
        // Save to localStorage
        localStorage.setItem('plantube-theme', theme);
        
        // Update meta theme-color for mobile browsers if available
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        const activeTheme = themes.find(t => t.id === theme) || themes[0];
        if (metaTheme) {
            metaTheme.setAttribute('content', activeTheme.color);
        }
    }, [theme]);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, themes, resolveThemeFromColor }}>
            {children}
        </ThemeContext.Provider>
    );
};
