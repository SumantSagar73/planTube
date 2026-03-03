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
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('plantube-theme');
        return savedTheme || 'default';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('plantube-theme', theme);
    }, [theme]);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
    };

    const themes = [
        { id: 'default', name: 'Original Dark', color: '#6366f1' },
        { id: 'indigo', name: 'Deep Indigo', color: '#3F51B5' },
        { id: 'teal', name: 'Muted Teal', color: '#0F766E' },
        { id: 'slate', name: 'Slate Blue', color: '#334155' },
        { id: 'forest', name: 'Forest Green', color: '#2E7D32' },
        { id: 'monochrome', name: 'Monochrome', color: '#1F2937' },
        { id: 'nordic', name: 'Nordic Night', color: '#2E3440' },
        { id: 'solarized', name: 'Solarized Light', color: '#FDF6E3' },
        { id: 'earth', name: 'Earth Tone', color: '#795548' },
        { id: 'youtube', name: 'YouTube Red', color: '#FF0000' }
    ];

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};
