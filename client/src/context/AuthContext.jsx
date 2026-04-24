import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { useTheme } from './ThemeContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme, toggleTheme, resolveThemeFromColor } = useTheme();

    const syncThemeWithUser = (userData) => {
        const matchedTheme = resolveThemeFromColor(userData?.themeColor);
        if (matchedTheme && matchedTheme !== theme) {
            toggleTheme(matchedTheme);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token) {
            // Optimistic Load
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    syncThemeWithUser(parsedUser);
                    setLoading(false); // Immediate unlock
                } catch (e) {
                    console.error("Failed to parse stored user");
                }
            }
            // Background validate always
            loadUser(token, !storedUser); // Only block loading if we didn't find a stored user
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const effectiveUserId = localStorage.getItem('impersonate_user_id') || user?._id || user?.id;

        if (!effectiveUserId || !localStorage.getItem('token')) {
            if (socket.connected) socket.disconnect();
            return;
        }

        if (!socket.connected) {
            socket.connect();
        }

        const onConnect = () => socket.emit('join_user', { userId: effectiveUserId });
        onConnect();
        socket.on('connect', onConnect);

        return () => {
            socket.off('connect', onConnect);
            socket.emit('leave_user', { userId: effectiveUserId });
        };
    }, [user]);

    const loadUser = async (token, blockLoading = true) => {
        if (blockLoading) setLoading(true);
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data)); // Update fresh data
            syncThemeWithUser(res.data);
            if (blockLoading) setLoading(false);
        } catch (err) {
            console.error('Auth Load Error', err);
            // Only logout if we were blocked loading (initial check) or if specific 401?
            // Safer to just clear if it fails hard, but maybe network error shouldn't logout?
            // For now, if /auth/me fails, we assume token is bad.
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            if (blockLoading) setLoading(false);
        }
    };

    const login = async (identifier, password) => {
        const res = await api.post('/auth/login', { identifier, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        syncThemeWithUser(res.data.user);
        return res.data;
    };

    const register = async (name, username, email, password) => {
        const res = await api.post('/auth/register', { name, username, email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        syncThemeWithUser(res.data.user);
        return res.data;
    };

    const setAuth = (data) => {
        if (data.token) localStorage.setItem('token', data.token);
        if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            syncThemeWithUser(data.user);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
