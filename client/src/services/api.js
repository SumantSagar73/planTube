import axios from 'axios';

const normalizeApiBaseUrl = (rawUrl) => {
    const fallback = '/api';
    const value = (rawUrl || fallback).trim().replace(/\/$/, '');

    if (value === '/api') return value;
    return value.endsWith('/api') ? value : `${value}/api`;
};

const apiUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
    baseURL: apiUrl,
});

// Add token and impersonation headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const impersonateId = localStorage.getItem('impersonate_user_id');

    if (token) {
        config.headers['x-auth-token'] = token;
    }
    
    if (impersonateId) {
        config.headers['x-impersonate-user'] = impersonateId;
    }

    return config;
});

// Handle responses
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
