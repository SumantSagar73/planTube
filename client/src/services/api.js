import axios from 'axios';
const apiUrl = import.meta.env.VITE_API_URL || '/api';

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
