import React, { useState, useEffect } from 'react';
import { 
    Users, BookOpen, Layers, Clock, Shield, ShieldAlert, 
    Trash2, Eye, Search, MoreVertical, CheckCircle, XCircle 
} from 'lucide-react';
import adminService from '../services/adminService';
import LoadingScreen from '../components/Shared/LoadingScreen';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminUsers from '../components/Admin/AdminUsers';
import AdminPlaylists from '../components/Admin/AdminPlaylists';
import AdminVideos from '../components/Admin/AdminVideos';
import UserDetailsModal from '../components/Admin/UserDetailsModal';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [collapsed, setCollapsed] = useState(false);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [statsData, usersData] = await Promise.all([
                adminService.getStats(),
                adminService.getUsers()
            ]);
            setStats(statsData);
            setUsers(usersData);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`Are you sure you want to make ${user.name} a ${newRole}?`)) return;
        
        try {
            await adminService.updateUserRole(user._id, newRole);
            setUsers(users.map(u => u._id === user._id ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const handleImpersonate = (user) => {
        if (!window.confirm(`Switching to Shadow View for ${user.name}. You will see the portal as them. Continue?`)) return;
        
        // Clear caches for a fresh impersonation session
        localStorage.removeItem('user');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('dashboard_data_')) localStorage.removeItem(key);
        });
        sessionStorage.clear(); // Clear all session-cached library items
        
        localStorage.setItem('impersonate_user_id', user._id);
        localStorage.setItem('impersonate_user_name', user.name);
        window.location.href = '/dashboard';
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('PERMANENTLY delete this user? This action cannot be undone.')) return;
        try {
            await adminService.deleteUser(id);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            alert('Delete failed');
        }
    };

    if (loading) return <LoadingScreen message="Accessing secure admin panel..." />;

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        <div>
                            <h1 style={{ fontSize: '3rem', fontWeight: '950', letterSpacing: '-2px', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                                Control Center
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>
                                Administrative overview of the PlanTube infrastructure.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                            <StatCard icon={<Users color="#6366f1" />} label="Total Users" value={stats?.totalUsers} />
                            <StatCard icon={<BookOpen color="#22c55e" />} label="Total Playlists" value={stats?.totalPlaylists} />
                            <StatCard icon={<Layers color="#eab308" />} label="Active Groups" value={stats?.totalGroups} />
                            <StatCard icon={<Clock color="#ec4899" />} label="Global Study Hours" value={`${stats?.totalStudyHours}h`} />
                        </div>
                        
                        <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>System Health</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>All services operational. Database connection latency: 42ms.</p>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <AdminUsers 
                        users={users}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        handleImpersonate={handleImpersonate}
                        handleRoleToggle={handleRoleToggle}
                        handleDeleteUser={handleDeleteUser}
                        onViewDetails={setSelectedUserId}
                    />
                );
            case 'playlists':
                return <AdminPlaylists />;
            case 'videos':
                return <AdminVideos />;
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
            />
            
            <main style={{ 
                flex: 1, 
                marginLeft: collapsed ? '80px' : '280px', 
                padding: '3rem 4vw', 
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '100vh'
            }}>
                {renderContent()}
            </main>

            {selectedUserId && (
                <UserDetailsModal 
                    userId={selectedUserId} 
                    onClose={() => setSelectedUserId(null)} 
                />
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="glass-card" style={{ 
        padding: '1.5rem', 
        borderRadius: '20px', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem'
    }}>
        <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '14px', 
            background: 'rgba(255,255,255,0.03)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
        }}>
            {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>{value || 0}</span>
        </div>
    </div>
);

export default AdminDashboard;
