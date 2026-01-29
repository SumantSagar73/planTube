import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, ChevronRight, User as UserIcon, Calendar, ArrowRight, UserPlus } from 'lucide-react';
import LoadingScreen from '../components/Shared/LoadingScreen';
import AlertModal from '../components/Shared/AlertModal';

const Groups = () => {
    const { user, setAuth } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [newGroupData, setNewGroupData] = useState({ groupName: '', description: '' });
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', success: false });
    const navigate = useNavigate();

    const showAlert = (title, message, success = false) => {
        setAlertState({ isOpen: true, title, message, success });
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            if (user) {
                const res = await api.get('/groups');
                setGroups(res.data);
            } else {
                setGroups([]); // Guests see no groups unless they join
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching groups:', err);
            setLoading(false);
        }
    };

    const handleJoinWithCode = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/groups/join-code', {
                code: joinCode,
                name: guestName,
                email: guestEmail
            });

            // If the response contains a token (guest join), save it
            if (res.data.token || (res.data.user && res.data.user.token)) {
                const token = res.data.token || res.data.user.token;
                setAuth({ token, user: res.data.user });
            }

            setShowJoinModal(false);
            navigate(`/groups/${res.data.group._id}`);
        } catch (err) {
            showAlert('Join Failed', err.response?.data?.msg || 'Error joining group');
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/groups', newGroupData);
            setGroups([res.data, ...groups]);
            setShowCreateModal(false);
            setNewGroupData({ groupName: '', description: '' });
            navigate(`/groups/${res.data._id}`);
        } catch (err) {
            console.error('Error creating group:', err);
        }
    };

    if (loading) {
        return <LoadingScreen message="Loading your groups..." />;
    }

    return (
        <div style={{ padding: '2rem 3vw', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Groups</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Learn together, track progress, and stay motivated with your study groups.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
                    >
                        <UserPlus size={20} />
                        <span>Join with Code</span>
                    </button>
                    {user && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
                        >
                            <Plus size={20} />
                            <span>Create Group</span>
                        </button>
                    )}
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="glass" style={{ padding: '4rem', textAlign: 'center', borderRadius: '32px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Users size={40} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>No groups yet</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                        Create a group to study with friends, share playlists, and track each other's progress.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="btn-secondary"
                            style={{ padding: '0.8rem 2rem' }}
                        >
                            Join a Group
                        </button>
                        {user && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary"
                                style={{ padding: '0.8rem 2rem' }}
                            >
                                Start a Group
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {groups.map((group) => (
                        <div
                            key={group._id}
                            className="glass glass-hover"
                            style={{ padding: '1.5rem', borderRadius: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                            onClick={() => navigate(`/groups/${group._id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{group.groupName}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <UserIcon size={12} />
                                            Owned by {group.ownerId?.name || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={20} color="var(--text-muted)" />
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.8rem' }}>
                                {group.description || 'No description provided.'}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', marginLeft: '4px' }}>
                                        {group.members.slice(0, 3).map((member, i) => (
                                            <div
                                                key={member._id}
                                                style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: `hsl(${i * 120}, 70%, 60%)`,
                                                    border: '2px solid #0f0f14',
                                                    marginLeft: i === 0 ? 0 : '-8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.7rem', fontWeight: 'bold', color: 'white'
                                                }}
                                                title={member.name}
                                            >
                                                {member.name[0].toUpperCase()}
                                            </div>
                                        ))}
                                        {group.members.length > 3 && (
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: 'var(--bg-card)', border: '2px solid #0f0f14',
                                                marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--text-muted)'
                                            }}>
                                                +{group.members.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{group.members.length} members</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Calendar size={12} />
                                    {new Date(group.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Join Group Modal */}
            {showJoinModal && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000, backdropFilter: 'blur(8px)'
                    }}
                    onClick={() => setShowJoinModal(false)}
                >
                    <div
                        className="glass"
                        style={{ width: '450px', padding: '2.5rem', borderRadius: '32px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem' }}>Join Group</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter the unique 8-character code to join a study group.</p>
                        <form onSubmit={handleJoinWithCode}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Group Code</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    placeholder="e.g. A1B2C3D4"
                                    className="input-glass"
                                    style={{ width: '100%', padding: '1rem', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800' }}
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                />
                            </div>

                            {!user && (
                                <>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your Name</label>
                                        <input required type="text" placeholder="John Doe" className="input-glass" style={{ width: '100%', padding: '0.8rem' }} value={guestName} onChange={e => setGuestName(e.target.value)} />
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 2 }}>Join Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {
                showCreateModal && (
                    <div
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 2000, backdropFilter: 'blur(8px)'
                        }}
                        onClick={() => setShowCreateModal(false)}
                    >
                        <div
                            className="glass"
                            style={{ width: '500px', padding: '2.5rem', borderRadius: '32px', position: 'relative' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem' }}>Create Study Group</h2>
                            <form onSubmit={handleCreateGroup}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Group Name</label>
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        placeholder="e.g. Master algorithms together"
                                        className="input-glass"
                                        style={{ width: '100%', padding: '1rem' }}
                                        value={newGroupData.groupName}
                                        onChange={e => setNewGroupData({ ...newGroupData, groupName: e.target.value })}
                                    />
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Description (optional)</label>
                                    <textarea
                                        placeholder="What's this group about?"
                                        className="input-glass"
                                        style={{ width: '100%', padding: '1rem', minHeight: '120px', resize: 'none' }}
                                        value={newGroupData.description}
                                        onChange={e => setNewGroupData({ ...newGroupData, description: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '1rem' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{ flex: 2, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <span>Create Group</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                success={alertState.success}
            />
        </div >
    );
};

export default Groups;
