import React from 'react';
import { Eye, LogOut } from 'lucide-react';
import adminService from '../../services/adminService';

const ShadowBanner = () => {
    const impersonatedId = localStorage.getItem('impersonate_user_id');
    const impersonatedName = localStorage.getItem('impersonate_user_name');

    if (!impersonatedId) return null;

    const handleExit = async () => {
        try {
            await adminService.logImpersonationEnd(impersonatedId, impersonatedName);
        } catch (err) {
            console.warn('Failed to write impersonation end audit log:', err);
        }

        const returnUrl = localStorage.getItem('admin_return_url') || '/admin';

        // Clear all impersonation data
        localStorage.removeItem('impersonate_user_id');
        localStorage.removeItem('impersonate_user_name');
        localStorage.removeItem('user'); // Force re-fetch of real admin profile
        localStorage.removeItem('admin_return_url');
        
        // Clear pattern-based dashboard caches
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('dashboard_data_')) localStorage.removeItem(key);
        });
        sessionStorage.clear(); 
        
        window.location.href = returnUrl;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(90deg, #ef4444, #f87171)',
            color: 'white',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.85rem',
            fontWeight: '700',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
            <Eye size={16} />
            <span>Currently viewing as: <span style={{ textDecoration: 'underline' }}>{impersonatedName || 'User'}</span></span>
            <button 
                onClick={handleExit}
                style={{
                    background: 'white',
                    color: '#ef4444',
                    border: 'none',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '12px'
                }}
            >
                <LogOut size={12} />
                Exit Shadow Mode
            </button>
        </div>
    );
};

export default ShadowBanner;
