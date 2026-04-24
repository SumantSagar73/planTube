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

const feedbackService = {
    submitFeedback: async (payload) => {
        const res = await api.post('/feedback', payload);
        return res.data;
    },
    getMyFeedback: async (params = {}) => {
        const res = await api.get(`/feedback/mine${buildQuery(params)}`);
        return res.data;
    },
    getAdminFeedback: async (params = {}) => {
        const res = await api.get(`/admin/feedback${buildQuery(params)}`);
        return res.data;
    },
    updateAdminFeedback: async (id, payload) => {
        const res = await api.put(`/admin/feedback/${id}`, payload);
        return res.data;
    }
};

export default feedbackService;
