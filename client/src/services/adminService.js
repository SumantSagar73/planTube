import api from './api';

const adminService = {
    getStats: async () => {
        const res = await api.get('/admin/stats');
        return res.data;
    },
    getChartData: async () => {
        const res = await api.get('/admin/chart-data');
        return res.data;
    },
    getUsers: async () => {
        const res = await api.get('/admin/users');
        return res.data;
    },
    getUserDetails: async (id) => {
        const res = await api.get(`/admin/users/${id}`);
        return res.data;
    },
    getAllPlaylists: async () => {
        const res = await api.get('/admin/playlists');
        return res.data;
    },
    getAllVideos: async () => {
        const res = await api.get('/admin/videos');
        return res.data;
    },
    updateUserRole: async (id, role) => {
        const res = await api.put(`/admin/users/${id}/role`, { role });
        return res.data;
    },
    deleteUser: async (id) => {
        const res = await api.delete(`/admin/users/${id}`);
        return res.data;
    },
    freezeUser: async (id) => {
        const res = await api.put(`/admin/users/${id}/freeze`);
        return res.data;
    },
    approveWipe: async (id) => {
        const res = await api.post(`/admin/users/${id}/approve-wipe`);
        return res.data;
    }
};

export default adminService;
