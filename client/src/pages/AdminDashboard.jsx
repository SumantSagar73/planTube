import React, { useState, useEffect } from 'react';
import { 
    Users, BookOpen, Layers, Clock, Shield, ShieldAlert, 
    Trash2, Eye, Search, MoreVertical, CheckCircle, XCircle, Activity, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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
    const [chartData, setChartData] = useState({ weeklyActivity: [], topTopics: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [statsData, usersData, chartDataRes] = await Promise.all([
                adminService.getStats(),
                adminService.getUsers(),
                adminService.getChartData()
            ]);
            setStats(statsData);
            setUsers(usersData);
            setChartData(chartDataRes);
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

    const handleFreezeUser = async (id) => {
        try {
            const res = await adminService.freezeUser(id);
            setUsers(users.map(u => u._id === id ? { ...u, isFrozen: res.isFrozen } : u));
        } catch (err) {
            alert('Freeze toggle failed');
        }
    };

    const handleApproveWipe = async (id) => {
        if (!window.confirm('Approve wipe request? This will instantly PERMANENTLY delete the user and all their data.')) return;
        try {
            await adminService.approveWipe(id);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            alert('Wipe approval failed');
        }
    };

    if (loading) return <LoadingScreen message="Accessing secure admin panel..." />;

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: '3rem', fontWeight: '950', letterSpacing: '-2px', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                                Command Center
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>
                                Global infrastructure and platform analytics.
                            </p>
                        </div>

                        {/* Top Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                            <StatCard icon={<Users color="#6366f1" />} label="Total Users" value={stats?.totalUsers} trend="+12%" trendUp={true} />
                            <StatCard icon={<BookOpen color="#22c55e" />} label="Total Playlists" value={stats?.totalPlaylists} trend="+5%" trendUp={true} />
                            <StatCard icon={<Layers color="#eab308" />} label="Active Groups" value={stats?.totalGroups} trend="-2%" trendUp={false} />
                            <StatCard icon={<Clock color="#ec4899" />} label="Global Study Hours" value={`${stats?.totalStudyHours}h`} trend="+24%" trendUp={true} />
                        </div>

                        {/* Bento Box Layout */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                            {/* Main Chart - Activity Trends */}
                            <div className="glass-card" style={{ padding: '2rem', borderRadius: '32px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Activity size={20} color="#6366f1" /> Platform Activity (7 Days)
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Study sessions and active users over time</p>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData.weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,12,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }} />
                                            <Area type="monotone" dataKey="studyMins" name="Study Mins" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorStudy)" />
                                            <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* System Health Card */}
                                <div className="glass-card" style={{ padding: '2rem', borderRadius: '32px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 12px #22c55e' }}></div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white' }}>System Health</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        All services operational. Database cluster is optimal.
                                    </p>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Latency</span><span style={{ fontWeight: 'bold', color: '#22c55e' }}>42ms</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Uptime</span><span style={{ fontWeight: 'bold' }}>99.99%</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>API Requests/min</span><span style={{ fontWeight: 'bold' }}>1,240</span></div>
                                    </div>
                                </div>

                                {/* Content Distribution */}
                                <div className="glass-card" style={{ padding: '2rem', borderRadius: '32px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TrendingUp size={18} color="#ec4899" /> Top Topics
                                    </h3>
                                    <div style={{ flex: 1, width: '100%' }}>
                                        <ResponsiveContainer width="100%" height={Math.max(150, chartData.topTopics.length * 36)}>
                                            <BarChart data={chartData.topTopics} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'white', fontSize: 12, fontWeight: 'bold' }} width={90} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(10,10,12,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v) => [`${v} playlists`]} />
                                                <Bar dataKey="value" name="Playlists" radius={[0, 4, 4, 0]}>
                                                    {chartData.topTopics.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'][index % 5]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        {chartData.topTopics.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No playlist data yet</div>
                                        )}
                                    </div>
                                </div>
                            </div>
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
                        handleFreezeUser={handleFreezeUser}
                        handleApproveWipe={handleApproveWipe}
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

const StatCard = ({ icon, label, value, trend, trendUp }) => (
    <div className="glass-card" style={{ 
        padding: '1.5rem', 
        borderRadius: '24px', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                background: 'rgba(255,255,255,0.03)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.05)'
            }}>
                {icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white', lineHeight: 1 }}>{value || 0}</span>
                    {trend && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: trendUp ? '#22c55e' : '#ef4444' }}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export default AdminDashboard;
