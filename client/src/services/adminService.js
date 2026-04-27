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

const downloadCsv = async (path, params = {}) => {
    const query = buildQuery({ ...params, format: 'csv' });
    const res = await api.get(`${path}${query}`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const disposition = res.headers?.['content-disposition'] || '';
    const fromHeader = disposition.split('filename=')[1]?.replace(/"/g, '');
    link.download = fromHeader || `export-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

const adminService = {
    getStats: async () => {
        const res = await api.get('/admin/stats');
        return res.data;
    },
    getHealth: async () => {
        const res = await api.get('/admin/health');
        return res.data;
    },
    getChartData: async () => {
        const res = await api.get('/admin/chart-data');
        return res.data;
    },
    getUsers: async (params = {}) => {
        const res = await api.get(`/admin/users${buildQuery(params)}`);
        return res.data;
    },
    getUserDetails: async (id) => {
        const res = await api.get(`/admin/users/${id}`);
        return res.data;
    },
    getAllPlaylists: async (params = {}) => {
        const res = await api.get(`/admin/playlists${buildQuery(params)}`);
        return res.data;
    },
    getAllVideos: async (params = {}) => {
        const res = await api.get(`/admin/videos${buildQuery(params)}`);
        return res.data;
    },
    getAuditLogs: async (params = {}) => {
        const res = await api.get(`/admin/audit-logs${buildQuery(params)}`);
        return res.data;
    },
    getLivePresence: async () => {
        const res = await api.get('/admin/live-presence');
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
    },
    logImpersonationStart: async (targetUserId, targetUserName) => {
        const res = await api.post('/admin/impersonation/start', { targetUserId, targetUserName });
        return res.data;
    },
    logImpersonationEnd: async (targetUserId, targetUserName) => {
        const res = await api.post('/admin/impersonation/end', { targetUserId, targetUserName });
        return res.data;
    },
    exportUsersCsv: async (params = {}) => downloadCsv('/admin/users', params),
    exportPlaylistsCsv: async (params = {}) => downloadCsv('/admin/playlists', params),
    exportVideosCsv: async (params = {}) => downloadCsv('/admin/videos', params)
};

export default adminService;
