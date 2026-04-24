import React, { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen, Layers, Clock, Menu } from 'lucide-react';
import adminService from '../services/adminService';
import LoadingScreen from '../components/Shared/LoadingScreen';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminUsers from '../components/Admin/AdminUsers';
import AdminPlaylists from '../components/Admin/AdminPlaylists';
import AdminVideos from '../components/Admin/AdminVideos';
import AdminNotifications from '../components/Admin/AdminNotifications';
import AdminFeedback from '../components/Admin/AdminFeedback';
import UserDetailsModal from '../components/Admin/UserDetailsModal';
import AdminAuditLogs from '../components/Admin/AdminAuditLogs';
import AdminOverviewPanel from '../components/Admin/AdminOverviewPanel';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') || 'overview';
    });
    const [collapsed, setCollapsed] = useState(false);
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [chartData, setChartData] = useState({ weeklyActivity: [], topTopics: [] });
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [toast, setToast] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const tabLabelMap = {
        overview: 'Overview',
        users: 'Users',
        playlists: 'Playlists',
        videos: 'Videos',
        notifications: 'Notifications',
        feedback: 'Feedback',
        audit: 'Audit'
    };

    const notify = (message, type = 'info') => {
        setToast({ message, type });
        window.clearTimeout(window.__adminToastTimer);
        window.__adminToastTimer = window.setTimeout(() => setToast(null), 3200);
    };

    const fetchOverview = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [statsData, chartDataRes, healthData] = await Promise.all([
                adminService.getStats(),
                adminService.getChartData(),
                adminService.getHealth()
            ]);
            setStats(statsData);
            setChartData(chartDataRes);
            setHealth(healthData);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            notify('Failed to refresh admin overview', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (!isMobile) setMobileMenuOpen(false);
    }, [isMobile]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', activeTab);
        const query = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}?${query}`);
    }, [activeTab]);

    useEffect(() => {
        if (!autoRefresh || activeTab !== 'overview') return;
        const interval = setInterval(() => fetchOverview(true), 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, activeTab]);

    const handleImpersonate = async (user) => {
        if (!window.confirm(`Switch to Shadow View for ${user.name}?`)) return;

        try {
            await adminService.logImpersonationStart(user._id, user.name);
        } catch (err) {
            console.warn('Failed to write impersonation start audit log:', err);
        }

        localStorage.removeItem('user');
        // Keep the exact admin location so "Exit Shadow Mode" can restore it.
        localStorage.setItem('admin_return_url', `${window.location.pathname}${window.location.search}`);
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('dashboard_data_')) localStorage.removeItem(key);
        });
        sessionStorage.clear();

        localStorage.setItem('impersonate_user_id', user._id);
        localStorage.setItem('impersonate_user_name', user.name);
        window.location.href = '/dashboard';
    };

    const statCards = useMemo(() => [
        {
            icon: <Users color="#60a5fa" />,
            label: 'Total Users',
            value: stats?.totalUsers || 0,
            trend: stats?.trends?.usersDeltaPct,
            suffix: '% vs prev 7d'
        },
        {
            icon: <BookOpen color="#34d399" />,
            label: 'Total Playlists',
            value: stats?.totalPlaylists || 0,
            trend: null
        },
        {
            icon: <Layers color="#fbbf24" />,
            label: 'Active Groups',
            value: stats?.totalGroups || 0,
            trend: null
        },
        {
            icon: <Clock color="#f472b6" />,
            label: 'Study Hours',
            value: `${stats?.totalStudyHours || 0}h`,
            trend: stats?.trends?.studyDeltaPct,
            suffix: '% vs prev 7d'
        }
    ], [stats]);

    if (loading) return <LoadingScreen message="Accessing secure admin panel..." />;

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <AdminOverviewPanel
                        stats={stats}
                        health={health}
                        chartData={chartData}
                        fetchOverview={fetchOverview}
                        autoRefresh={autoRefresh}
                        setAutoRefresh={setAutoRefresh}
                        statCards={statCards}
                    />
                );
            case 'users':
                return <AdminUsers onViewDetails={setSelectedUserId} onImpersonate={handleImpersonate} notify={notify} />;
            case 'playlists':
                return <AdminPlaylists />;
            case 'videos':
                return <AdminVideos />;
            case 'notifications':
                return <AdminNotifications notify={notify} />;
            case 'feedback':
                return <AdminFeedback notify={notify} />;
            case 'audit':
                return <AdminAuditLogs />;
            default:
                return null;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobile={isMobile}
                mobileOpen={mobileMenuOpen}
                onCloseMobile={() => setMobileMenuOpen(false)}
            />

            <main style={{
                flex: 1,
                marginLeft: isMobile ? '0' : (collapsed ? '80px' : '280px'),
                padding: isMobile ? '1rem 0.9rem' : '1.6rem 2.8vw',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '100vh'
            }} className="admin-main-content">
                {isMobile && (
                    <div style={{
                        position: 'sticky',
                        top: localStorage.getItem('impersonate_user_id') ? '40px' : 0,
                        zIndex: 120,
                        marginBottom: '0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.8rem',
                        padding: '0.7rem 0.8rem',
                        borderRadius: '14px',
                        background: 'rgba(15,23,42,0.75)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <strong style={{ fontSize: '0.95rem', lineHeight: 1.1 }}>Admin Panel</strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{tabLabelMap[activeTab] || 'Overview'}</span>
                        </div>
                        <button
                            className="icon-btn-deck"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open admin menu"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                )}
                {renderContent()}
            </main>

            {selectedUserId && (
                <UserDetailsModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}

            {toast && (
                <div style={{
                    position: 'fixed',
                    right: 16,
                    bottom: 16,
                    zIndex: 13000,
                    background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(15,23,42,0.95)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
