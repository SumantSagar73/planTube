import api from './api';

const buildQuery = (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.set(key, String(value));
        }
    });
    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

const notificationService = {
    getNotifications: async (params = {}) => {
        const res = await api.get(`/notifications${buildQuery(params)}`);
        return res.data;
    },
    getUnreadCount: async () => {
        const res = await api.get('/notifications/unread-count');
        return res.data;
    },
    markRead: async (id) => {
        const res = await api.put(`/notifications/${id}/read`);
        return res.data;
    },
    markAllRead: async () => {
        const res = await api.put('/notifications/read-all');
        return res.data;
    },
    archive: async (id) => {
        const res = await api.put(`/notifications/${id}/archive`);
        return res.data;
    },
    broadcastAdmin: async (payload) => {
        const res = await api.post('/admin/notifications/broadcast', payload);
        return res.data;
    }
};

export default notificationService;
