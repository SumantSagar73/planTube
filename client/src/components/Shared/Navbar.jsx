import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LogOut, Layout, Youtube, User, ChevronDown, Users, Library, ListMusic, Target, Link as LinkIcon, Plus, HelpCircle } from 'lucide-react';
import AlertModal from './AlertModal';
import WelcomeGuide from './WelcomeGuide';
import { useEffect } from 'react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [importing, setImporting] = useState(false);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', success: false });
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        if (!user) return;
        const completed = localStorage.getItem('hasCompletedOnboarding');
        if (!completed) {
            // Short delay to let everything settle
            const timer = setTimeout(() => setShowGuide(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const showAlert = (title, message, success = false) => {
        setAlertState({ isOpen: true, title, message, success });
    };

    const handleQuickImport = async (e) => {
        e.preventDefault();
        if (!importUrl) return;

        setImporting(true);
        try {
            const res = await api.post('/playlists/import', { playlistUrl: importUrl });
            setImportUrl('');

            if (res.data.video) {
                navigate(`/focus/${res.data.video._id}`);
            } else if (res.data.playlist) {
                navigate(`/playlist/${res.data.playlist._id}`);
            }
        } catch (err) {
            console.error(err);
            showAlert('Import Failed', err.response?.data?.msg || 'Failed to import link');
        } finally {
            setImporting(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass" style={{ width: '100%', margin: '1rem 0', padding: '0.75rem 3vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, position: 'relative' }}>
            {/* Left: Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', flexShrink: 0 }}>
                <Youtube size={32} />
                <span style={{ letterSpacing: '-0.5px' }}>PlanTube</span>
            </Link>

            {/* Center: Quick Import */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: '0 2rem' }}>
                {user && (
                    <form onSubmit={handleQuickImport} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.3rem 0.5rem', border: '1px solid var(--glass-border)', width: '100%', maxWidth: '500px' }}>
                        <LinkIcon size={16} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
                        <input
                            type="text"
                            placeholder="Paste YouTube Link (Video or Playlist)..."
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            disabled={importing}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                        />
                        <button type="submit" disabled={importing || !importUrl} style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'cursor', opacity: importUrl ? 1 : 0.5 }}>
                            {importing ? <div className="spinner-small" /> : <Plus size={16} color="white" />}
                        </button>
                    </form>
                )}
            </div>

            {/* Right: Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }} className="nav-link">
                    <Target size={18} />
                    <span>Focus</span>
                </Link>

                <Link to="/library" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }} className="nav-link">
                    <Library size={18} />
                    <span>Library</span>
                </Link>

                <Link to="/groups" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }} className="nav-link">
                    <Users size={18} />
                    <span>Groups</span>
                </Link>

                {user ? (
                    <div
                        style={{ position: 'relative', paddingBottom: '1rem', marginBottom: '-1rem' }}
                        onMouseEnter={() => setShowProfile(true)}
                        onMouseLeave={() => setShowProfile(false)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
                                {(user?.username?.[0] || user?.name?.[0])?.toUpperCase() || 'U'}
                            </div>
                            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: showProfile ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>

                        {showProfile && (
                            <div className="glass shadow-lg" style={{
                                position: 'absolute', top: '100%', right: '0',
                                width: '200px', padding: '0.5rem',
                                borderRadius: '12px', border: '1px solid var(--glass-border)',
                                background: '#0f0f14',
                                marginTop: '-0.5rem'
                            }}>
                                <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>@{user?.username || user?.name}</p>
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
                ) : (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Link to="/login" style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600' }}>Login</Link>
                        <Link to="/signup" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>Sign Up</Link>
                    </div>
                )}

                <button
                    onClick={() => setShowGuide(true)}
                    className="icon-btn-compact"
                    title="User Guide"
                    style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}
                >
                    <HelpCircle size={18} />
                </button>
            </div>
            {/* Modals */}
            <WelcomeGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                success={alertState.success}
            />
        </nav >
    );
};

export default Navbar;
