import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || '/api';
console.log('API URL:', apiUrl);

const api = axios.create({
    baseURL: apiUrl,
});

// Add token to headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default api;
