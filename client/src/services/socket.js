import { io } from 'socket.io-client';

const normalizeApiBaseUrl = (rawUrl) => {
    const fallback = 'http://localhost:5000/api';
    const value = (rawUrl || fallback).trim().replace(/\/$/, '');
    return value.endsWith('/api') ? value : `${value}/api`;
};

const apiUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
// Remove /api from the end to get the server root for socket.io
const SOCKET_URL = apiUrl.replace(/\/api$/, '');

console.log('🔌 Socket.io connecting to:', SOCKET_URL);

const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: (cb) => cb({ token: localStorage.getItem('token') || '' })
});

socket.on('connect', () => {
    console.log('✅ Socket.io connected successfully to', SOCKET_URL);
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket.io connection error:', error.message);
    console.log('💡 Make sure your server is running at', SOCKET_URL);
});

export default socket;
