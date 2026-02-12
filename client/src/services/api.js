import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const apiUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: apiUrl,
});

// Configure NProgress
NProgress.configure({ showSpinner: false });

// Add token to headers and start progress
api.interceptors.request.use((config) => {
    NProgress.start();
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

// Handle responses and end progress
api.interceptors.response.use(
    (response) => {
        NProgress.done();
        return response;
    },
    (error) => {
        NProgress.done();
        return Promise.reject(error);
    }
);

export default api;
