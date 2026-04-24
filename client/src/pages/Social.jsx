import { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Search, UserPlus, Check, X, Clock, Award, Shield, Users, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingScreen from '../components/Shared/LoadingScreen';

const Social = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchSocialData();
    }, []);

    const fetchSocialData = async () => {
        try {
            const res = await api.get('/social/stats');
            setFriends(res.data.friends);
            setPendingRequests(res.data.pending);
        } catch (err) {
            console.error('Error fetching social data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await api.get(`/social/search?q=${searchQuery}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    };

    const sendRequest = async (userId) => {
        try {
            await api.post(`/social/request/${userId}`);
            setMessage({ text: 'Friend request sent!', type: 'success' });
            // Update search results to show requested state
            setSearchResults(results => 
                results.map(u => u._id === userId ? { ...u, requested: true } : u)
            );
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: err.response?.data?.msg || 'Error sending request', type: 'error' });
        }
    };

    const respondToRequest = async (requestId, status) => {
        try {
            await api.put(`/social/respond/${requestId}`, { status });
            setPendingRequests(pending => pending.filter(r => r._id !== requestId));
            if (status === 'accepted') {
                fetchSocialData(); // Refresh friend list
                setMessage({ text: 'Friend request accepted!', type: 'success' });
            } else {
                setMessage({ text: 'Request declined', type: 'info' });
            }
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            console.error('Error responding to request:', err);
        }
    };

    if (loading) return <LoadingScreen message="Connecting to the hub..." />;

    return (
        <div className="social-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            
            <div className="social-hero" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={32} className="text-primary" />
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px' }}>Social Hub</h1>
            </div>

            {message.text && (
                <div style={{
                    padding: '1rem 1.5rem', borderRadius: '12px',
                    background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: message.type === 'error' ? '#ef4444' : '#22c55e',
                    border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                }}>
                    {message.text}
                </div>
            )}

            <div className="social-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                
                {/* Main Content */}
                <div className="social-primary" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Search Section */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Search size={20} className="text-primary" /> Find Learners
                        </h3>
                        <form className="social-search-form" onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: searchResults.length > 0 ? '2rem' : '0' }}>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by username or name..."
                                className="styled-input"
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn-primary" disabled={searching}>
                                {searching ? 'Searching...' : 'Search'}
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {searchResults.map(user => (
                                    <div key={user._id} className="glass social-search-item" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                                        <Link to={`/profile/${user.username}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
                                            <img 
                                                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(user.username || user.name || user._id)}`} 
                                                alt="" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }} 
                                            />
                                            <div>
                                                <p style={{ fontWeight: '700' }}>{user.name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{user.username} • LVL {user.level || 1}</p>
                                            </div>
                                        </Link>
                                        <button 
                                            onClick={() => sendRequest(user._id)}
                                            className="btn-secondary"
                                            disabled={user.requested}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                        >
                                            {user.requested ? <Check size={16} /> : <UserPlus size={16} />}
                                            {user.requested ? 'Sent' : 'Add'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Friend List */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={20} className="text-primary" /> Your Connections ({friends.length})
                        </h3>
                        {friends.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                                <Users size={48} style={{ marginBottom: '1rem' }} />
                                <p>No friends yet. Start searching to build your circle!</p>
                            </div>
                        ) : (
                            <div className="social-friends-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {friends.map(friend => (
                                    <Link 
                                        key={friend._id}
                                        to={`/profile/${friend.username}`}
                                        className="glass social-friend-card"
                                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <img 
                                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(friend.username || friend.name || friend._id)}`} 
                                            alt="" style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }} 
                                        />
                                        <div>
                                            <p style={{ fontWeight: '800', marginBottom: '0.2rem' }}>{friend.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>LVL {friend.level || 1}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="social-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Requests Section */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', border: pendingRequests.length > 0 ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={18} className="text-primary" /> Requests {pendingRequests.length > 0 && <span style={{ background: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '50%', fontSize: '0.7rem' }}>{pendingRequests.length}</span>}
                        </h3>
                        {pendingRequests.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No pending requests.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {pendingRequests.map(req => (
                                    <div key={req._id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <img 
                                                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(req.requester.username || req.requester.name || req.requester._id)}`} 
                                                alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} 
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: '0.85rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.requester.name}</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LVL {req.requester.level || 1}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => respondToRequest(req._id, 'accepted')} className="btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}><Check size={14} /></button>
                                            <button onClick={() => respondToRequest(req._id, 'declined')} className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats Summary */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={18} className="text-primary" /> Community
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Friends</span>
                                <span style={{ fontWeight: '700' }}>{friends.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Shared Goals</span>
                                <span style={{ fontWeight: '700' }}>12</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Social;
