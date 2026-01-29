import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async (token) => {
        try {
            const res = await axios.get('/api/auth/me', {
                headers: { 'x-auth-token': token }
            });
            setUser(res.data);
            setLoading(false);
        } catch (err) {
            localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
        }
    };

    const login = async (identifier, password) => {
        const res = await axios.post('/api/auth/login', { identifier, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const register = async (name, username, email, password) => {
        const res = await axios.post('/api/auth/register', { name, username, email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const setAuth = (data) => {
        if (data.token) localStorage.setItem('token', data.token);
        if (data.user) setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
