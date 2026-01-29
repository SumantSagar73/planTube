import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Layout, Youtube, User, ChevronDown } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass" style={{ width: '100%', margin: '1rem 0', padding: '0.75rem 3vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, position: 'relative' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                <Youtube size={32} />
                <span style={{ letterSpacing: '-0.5px' }}>PlanTube</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }} className="nav-link">
                    <Layout size={18} />
                    <span>Focus</span>
                </Link>

                {/* Profile Section with Stable Hover */}
                <div
                    style={{ position: 'relative', paddingBottom: '1rem', marginBottom: '-1rem' }}
                    onMouseEnter={() => setShowProfile(true)}
                    onMouseLeave={() => setShowProfile(false)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: showProfile ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>

                    {showProfile && (
                        <div className="glass shadow-lg" style={{
                            position: 'absolute', top: '100%', right: '0',
                            width: '200px', padding: '0.5rem',
                            borderRadius: '12px', border: '1px solid var(--glass-border)',
                            background: '#0f0f14',
                            marginTop: '-0.5rem' // Slightly overlap to ensure mouse stays within container
                        }}>
                            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>{user?.name}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.email}</p>
                            </div>
                            <Link to="/profile" style={{ width: '100%', padding: '0.6rem', background: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '0.25rem' }} className="glass-hover">
                                <User size={16} />
                                <span>My Profile</span>
                            </Link>
                            <button onClick={handleLogout} style={{ width: '100%', padding: '0.6rem', background: 'none', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', borderRadius: '8px' }} className="glass-hover">
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav >
    );
};

export default Navbar;
