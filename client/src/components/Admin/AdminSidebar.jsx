import React from 'react';
import { 
    LayoutDashboard, Users as UsersIcon, BookOpen, 
    Play, Shield, LogOut, ChevronLeft, ChevronRight, FileClock, MessageSquare, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ activeTab, setActiveTab, collapsed, setCollapsed, isMobile = false, mobileOpen = false, onCloseMobile }) => {
    const { logout } = useAuth();

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
        { id: 'users', label: 'Users', icon: <UsersIcon size={20} /> },
        { id: 'live', label: 'Live Presence', icon: <Activity size={20} /> },
        { id: 'playlists', label: 'Playlists', icon: <BookOpen size={20} /> },
        { id: 'videos', label: 'Videos', icon: <Play size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Shield size={20} /> },
        { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={20} /> },
        { id: 'audit', label: 'Audit', icon: <FileClock size={20} /> },
    ];

    const sidebarTop = localStorage.getItem('impersonate_user_id') ? 80 : 40;
    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        if (isMobile && onCloseMobile) onCloseMobile();
    };

    return (
        <>
        {isMobile && mobileOpen && (
            <button
                aria-label="Close menu overlay"
                onClick={onCloseMobile}
                style={{
                    position: 'fixed',
                    inset: 0,
                    top: `${sidebarTop}px`,
                    background: 'rgba(0,0,0,0.45)',
                    border: 'none',
                    zIndex: 105,
                    cursor: 'pointer'
                }}
            />
        )}
        <aside style={{
            width: isMobile ? '280px' : (collapsed ? '80px' : '280px'),
            height: `calc(100vh - ${sidebarTop}px)`,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            transition: isMobile
                ? 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: `${sidebarTop}px`,
            zIndex: isMobile ? 110 : 100,
            transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-105%)') : 'translateX(0)'
        }}>
            {/* Collapse Toggle */}
            {!isMobile && (
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '24px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#6366f1',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            )}

            {/* Logo Section */}
            <div style={{ 
                padding: '2rem 1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                overflow: 'hidden'
            }}>
                <div style={{
                    minWidth: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                }}>
                    <Shield size={24} />
                </div>
                {(isMobile || !collapsed) && (
                    <span style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '900', 
                        letterSpacing: '-1px',
                        whiteSpace: 'nowrap'
                    }}>
                        ADMIN <span style={{ color: '#6366f1' }}>PANEL</span>
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1rem' }}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === item.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            color: activeTab === item.id ? '#818cf8' : '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginBottom: '4px',
                            position: 'relative'
                        }}
                    >
                        {activeTab === item.id && (
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: '20%',
                                bottom: '20%',
                                width: '3px',
                                background: '#6366f1',
                                borderRadius: '0 4px 4px 0'
                            }} />
                        )}
                        <span style={{ minWidth: '20px' }}>{item.icon}</span>
                        {(isMobile || !collapsed) && <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.label}</span>}
                    </button>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={() => {
                        if (isMobile && onCloseMobile) onCloseMobile();
                        window.location.href = '/dashboard';
                    }}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.03)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <LogOut size={20} />
                    {(isMobile || !collapsed) && <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Exit Portal</span>}
                </button>
            </div>
        </aside>
        </>
    );
};

export default AdminSidebar;
