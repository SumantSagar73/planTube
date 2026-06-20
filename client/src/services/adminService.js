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
    // ── Existing ─────────────────────────────────────────────────────────────
    getStats: async () => (await api.get('/admin/stats')).data,
    getHealth: async () => (await api.get('/admin/health')).data,
    getChartData: async (range = '7d', from, to) => {
        const params = new URLSearchParams({ range });
        if (range === 'custom' && from && to) { params.set('from', from); params.set('to', to); }
        return (await api.get(`/admin/chart-data?${params}`)).data;
    },
    getUsers: async (params = {}) => (await api.get(`/admin/users${buildQuery(params)}`)).data,
    getUserDetails: async (id) => (await api.get(`/admin/users/${id}`)).data,
    getAllPlaylists: async (params = {}) => (await api.get(`/admin/playlists${buildQuery(params)}`)).data,
    getAllVideos: async (params = {}) => (await api.get(`/admin/videos${buildQuery(params)}`)).data,
    getAuditLogs: async (params = {}) => (await api.get(`/admin/audit-logs${buildQuery(params)}`)).data,
    getLivePresence: async () => (await api.get('/admin/live-presence')).data,
    updateUserRole: async (id, role) => (await api.put(`/admin/users/${id}/role`, { role })).data,
    deleteUser: async (id) => (await api.delete(`/admin/users/${id}`)).data,
    freezeUser: async (id) => (await api.put(`/admin/users/${id}/freeze`)).data,
    approveWipe: async (id) => (await api.post(`/admin/users/${id}/approve-wipe`)).data,
    logImpersonationStart: async (targetUserId, targetUserName) => (await api.post('/admin/impersonation/start', { targetUserId, targetUserName })).data,
    logImpersonationEnd: async (targetUserId, targetUserName) => (await api.post('/admin/impersonation/end', { targetUserId, targetUserName })).data,
    exportUsersCsv: async (params = {}) => downloadCsv('/admin/users', params),
    exportPlaylistsCsv: async (params = {}) => downloadCsv('/admin/playlists', params),
    exportVideosCsv: async (params = {}) => downloadCsv('/admin/videos', params),

    // ── Tier 1: Bulk Actions & Segmentation ──────────────────────────────────
    bulkUserAction: async (userIds, action) => (await api.post('/admin/users/bulk', { userIds, action })).data,

    // ── Tier 2: Analytics, Security, Maintenance, Cache ──────────────────────
    getContentAnalytics: async () => (await api.get('/admin/content-analytics')).data,
    getSecurityLog: async () => (await api.get('/admin/security')).data,
    flushCache: async () => (await api.post('/admin/cache/flush')).data,
    getScheduledMaintenance: async () => (await api.get('/admin/scheduled-maintenance')).data,
    setScheduledMaintenance: async (data) => (await api.post('/admin/scheduled-maintenance', data)).data,
    getImportQueue: async () => (await api.get('/admin/import-queue')).data,

    // ── Tier 3: Role Levels, Export, Reports ─────────────────────────────────
    getReports: async (params = {}) => (await api.get(`/admin/reports${buildQuery(params)}`)).data,
    resolveReport: async (id, data) => (await api.put(`/admin/reports/${id}`, data)).data,
    bulkExport: async (type, params = {}) => {
        const query = buildQuery({ type, ...params });
        const res = await api.get(`/admin/export${query}`, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-export-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // ── Tier 4: Cohort, A/B Tests, Referrals ─────────────────────────────────
    getCohortRetention: async () => (await api.get('/admin/cohort-retention')).data,
    getABTests: async () => (await api.get('/admin/ab-tests')).data,
    createABTest: async (data) => (await api.post('/admin/ab-tests', data)).data,
    updateABTest: async (id, data) => (await api.put(`/admin/ab-tests/${id}`, data)).data,
    deleteABTest: async (id) => (await api.delete(`/admin/ab-tests/${id}`)).data,
    getReferrals: async () => (await api.get('/admin/referrals')).data,
    getAIModels: async () => (await api.get('/admin/ai-models')).data,
    setAIModel: async (modelId) => (await api.put('/admin/ai-model', { modelId })).data,
};

export default adminService;
