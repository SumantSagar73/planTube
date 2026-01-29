import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Share2, ArrowLeft, MoreVertical, Trash2, LogOut, ExternalLink, Play, CheckCircle, Plus, BarChart, ArrowUp, ArrowDown } from 'lucide-react';
import LoadingScreen from '../components/Shared/LoadingScreen';
import AlertModal from '../components/Shared/AlertModal';
import ConfirmModal from '../components/Shared/ConfirmModal';

const GroupDetails = () => {
    const { id } = useParams();
    const { user: currentUser, setAuth } = useAuth();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [sharedPlaylists, setSharedPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [showSharePlaylist, setShowSharePlaylist] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [addedPlaylists, setAddedPlaylists] = useState(new Set());
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinEmail, setJoinEmail] = useState('');
    const [joinName, setJoinName] = useState('');

    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', success: false });
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        description: '',
        confirmText: '',
        danger: false,
        onConfirm: null
    });

    const showAlert = (title, message, success = false) => {
        setAlertState({ isOpen: true, title, message, success });
    };

    const triggerConfirm = (title, description, onConfirm, danger = false, confirmText = 'Confirm') => {
        setConfirmation({ isOpen: true, title, description, onConfirm, danger, confirmText });
    };

    useEffect(() => {
        fetchGroupData();
    }, [id]);

    const fetchGroupData = async () => {
        try {
            const [groupRes, playlistsRes] = await Promise.all([
                api.get(`/groups/${id}`),
                api.get(`/groups/${id}/playlists`)
            ]);
            setGroup(groupRes.data);
            setSharedPlaylists(playlistsRes.data || []);

            if (currentUser) {
                const myLibraryRes = await api.get('/playlists');
                setAddedPlaylists(new Set(myLibraryRes.data.map(p => p.playlistId)));
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching group data:', err);
            setLoading(false);
        }
    };

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/groups/${id}/join`, { email: joinEmail, name: joinName });

            // If the response contains a token (guest join), save it
            if (res.data.token) {
                setAuth({ token: res.data.token, user: res.data.user });
            }

            showAlert('Welcome!', res.data.msg, true);
            setShowJoinModal(false);
            fetchGroupData();
        } catch (err) {
            showAlert('Join Failed', err.response?.data?.msg || 'Error joining group');
        }
    };

    const handleAddToLibrary = async (sharedPlaylist) => {
        try {
            await api.post('/playlists/import', {
                playlistUrl: `https://www.youtube.com/playlist?list=${sharedPlaylist.playlistId.playlistId}`
            });
            setAddedPlaylists(prev => new Set([...prev, sharedPlaylist.playlistId.playlistId]));
            showAlert('Success', 'Playlist added to your library!', true);
        } catch (err) {
            showAlert('Import Failed', err.response?.data?.msg || 'Error adding to library');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/groups/${id}/members`, { email: newMemberEmail });
            setGroup(res.data);
            setNewMemberEmail('');
            setShowAddMember(false);
        } catch (err) {
            showAlert('Error', err.response?.data?.msg || 'Error adding member');
        }
    };

    const handleSharePlaylist = async (playlistId) => {
        try {
            await api.post(`/groups/${id}/playlists`, { groupId: id, playlistId });
            const res = await api.get(`/groups/${id}/playlists`);
            setSharedPlaylists(res.data);
            setShowSharePlaylist(false);
        } catch (err) {
            showAlert('Share Failed', err.response?.data?.msg || 'Error sharing playlist');
        }
    };

    const fetchUserPlaylists = async () => {
        try {
            const res = await api.get('/playlists');
            setUserPlaylists(res.data);
            setShowSharePlaylist(true);
        } catch (err) {
            console.error('Error fetching user playlists:', err);
        }
    };

    const handleUnshare = (playlistId) => {
        triggerConfirm(
            'Unshare Playlist?',
            'Remove this playlist from the group?',
            async () => {
                try {
                    await api.delete(`/groups/${id}/playlists/${playlistId}`);
                    setSharedPlaylists(prev => prev.filter(p => p.playlistId._id !== playlistId));
                } catch (err) {
                    console.error('Error unsharing playlist:', err);
                }
            },
            true,
            'Remove'
        );
    };

    const handlePriorityUpdate = async (playlistId, newPriority) => {
        try {
            // Optimistic update
            const updatedList = sharedPlaylists.map(p => {
                if (p.playlistId._id === playlistId) {
                    return { ...p, priority: newPriority };
                }
                return p;
            }).sort((a, b) => {
                const pA = a.priority || 0;
                const pB = b.priority || 0;
                if (pA !== pB) return pB - pA;
                return new Date(b.sharedAt) - new Date(a.sharedAt);
            });

            setSharedPlaylists(updatedList);

            await api.put(`/groups/${id}/playlists/${playlistId}/priority`, { priority: newPriority });
        } catch (err) {
            console.error('Error updating priority:', err);
            fetchGroupData(); // Revert on error
        }
    };

    const handleLeaveGroup = () => {
        triggerConfirm(
            'Leave Group?',
            'Are you sure you want to leave this group?',
            async () => {
                try {
                    await api.post(`/groups/${id}/leave`);
                    navigate('/groups');
                } catch (err) {
                    console.error('Error leaving group:', err);
                }
            },
            true,
            'Leave'
        );
    };

    const handleDeleteGroup = () => {
        triggerConfirm(
            'Delete Group?',
            'Are you sure you want to DELETE this group? This cannot be undone.',
            async () => {
                try {
                    await api.delete(`/groups/${id}`);
                    navigate('/groups');
                } catch (err) {
                    console.error('Error deleting group:', err);
                }
            },
            true,
            'Delete'
        );
    };

    const getUserId = (u) => {
        if (!u) return null;
        if (typeof u === 'string') return u;
        return u.id || u._id;
    };
    const currentUserId = getUserId(currentUser);

    const isOwner = group && group.ownerId && getUserId(group.ownerId) === currentUserId;
    const isMember = group && group.members.some(m => getUserId(m) === currentUserId);
    const isGuestView = !currentUser || (!isMember && !isOwner);

    if (loading) return <LoadingScreen message="Unlocking group content..." />;
    if (!group) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Group not found.</div>;

    return (
        <div style={{ padding: '2rem 3vw', maxWidth: '1200px', margin: '0 auto' }}>
            <button onClick={() => navigate('/groups')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} />
                <span>Back to Groups</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem', alignItems: 'start' }}>
                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>{group.groupName}</h1>
                                <p style={{ color: 'var(--text-main)', opacity: 0.8 }}>{group.description || 'No description provided.'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {isGuestView ? (
                                    <button onClick={() => setShowJoinModal(true)} className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: '800' }}>
                                        Join Group
                                    </button>
                                ) : (
                                    isOwner ? (
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button onClick={handleDeleteGroup} className="btn-secondary" style={{ color: 'var(--danger)', padding: '0.6rem 1rem' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={handleLeaveGroup} className="btn-secondary" style={{ color: 'var(--danger)', padding: '0.6rem 1rem' }}>
                                            <LogOut size={18} />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Created By</span>
                                <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>{group.ownerId.name}</p>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Members</span>
                                <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>{group.members.length} people</p>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Shared Playlists</span>
                                <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>{sharedPlaylists.length} playlists</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Shared Playlists</h2>
                            {!isGuestView && (
                                <button onClick={fetchUserPlaylists} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
                                    <Share2 size={18} />
                                    <span>Share Playlist</span>
                                </button>
                            )}
                        </div>

                        {sharedPlaylists.length === 0 ? (
                            <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '24px' }}>
                                <Share2 size={32} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-muted)' }}>No playlists shared with this group yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {sharedPlaylists.map((shared) => (
                                    <div key={shared._id} className="glass glass-hover" style={{ padding: '1rem', borderRadius: '20px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', width: '160px', height: '90px', borderRadius: '12px', overflow: 'hidden' }}>
                                            <img src={shared.playlistId.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.4))' }}></div>
                                        </div>

                                        {/* Priority Controls */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginRight: '0.5rem' }}>
                                            {isOwner && (
                                                <>
                                                    <button
                                                        onClick={() => handlePriorityUpdate(shared.playlistId._id, (shared.priority || 0) + 1)}
                                                        className="btn-secondary"
                                                        style={{ padding: '4px', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Increase Priority"
                                                    >
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePriorityUpdate(shared.playlistId._id, (shared.priority || 0) - 1)}
                                                        className="btn-secondary"
                                                        style={{ padding: '4px', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Decrease Priority"
                                                    >
                                                        <ArrowDown size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>{shared.playlistId.playlistTitle}</h3>
                                                {(shared.priority && shared.priority !== 0) ? (
                                                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '6px', background: 'var(--primary)', color: 'white', fontWeight: '700' }}>
                                                        P{shared.priority}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shared by {shared.sharedBy.name} • {new Date(shared.sharedAt).toLocaleDateString()}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            {currentUser && (
                                                addedPlaylists.has(shared.playlistId.playlistId) ? (
                                                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700', padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <CheckCircle size={14} /> In Library
                                                    </span>
                                                ) : (
                                                    <button onClick={() => handleAddToLibrary(shared)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Plus size={16} /> Add to Library
                                                    </button>
                                                )
                                            )}
                                            <Link to={`/groups/${id}/playlists/${shared.playlistId._id}`} className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <BarChart size={16} /> Progress
                                            </Link>
                                            <Link to={`/playlist/${shared.playlistId._id}`} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '10px' }} title="Preview Playlist">
                                                <Play size={16} />
                                            </Link>
                                            {!isGuestView && (isOwner || shared.sharedBy._id === currentUser.id) && (
                                                <button onClick={() => handleUnshare(shared.playlistId._id)} className="btn-secondary" style={{ color: 'var(--danger)', padding: '0.6rem' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Members */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Members</h2>
                            {!isGuestView && (
                                <button onClick={() => setShowAddMember(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Invite</span>
                                    <UserPlus size={20} />
                                </button>
                            )}
                        </div>

                        {/* Join Code Section */}
                        {group.joinCode && !isGuestView && (
                            <div style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '16px',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Group Code</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.8rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                    <code style={{ fontSize: '1.1rem', fontWeight: '900', color: 'white', letterSpacing: '2px' }}>{group.joinCode}</code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(group.joinCode);
                                            showAlert('Copied', 'Code copied to clipboard!', true);
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800' }}
                                    >
                                        COPY
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Friends can join using this code from the Groups dashboard.</p>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {group.members.map((member) => (
                                <div key={member._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            {member.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{member.name}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member._id === group.ownerId._id ? 'Owner' : 'Member'}</p>
                                        </div>
                                    </div>
                                    {isOwner && getUserId(member) !== getUserId(group.ownerId) && (
                                        <button onClick={() => {
                                            triggerConfirm(
                                                'Remove Member?',
                                                `Remove ${member.name} from group?`,
                                                () => {
                                                    api.delete(`/groups/${id}/members/${getUserId(member)}`).then(res => setGroup(res.data));
                                                },
                                                true,
                                                'Remove'
                                            );
                                        }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddMember && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }} onClick={() => setShowAddMember(false)}>
                    <div className="glass" style={{ width: '400px', padding: '2rem', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>Invite Member</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Invite your study partner using their username or email address.</p>
                        <form onSubmit={handleAddMember}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Username or Email</label>
                                <input autoFocus required type="text" placeholder="friend@example.com or username" className="input-glass" style={{ width: '100%', padding: '0.8rem' }} value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Playlist Modal */}
            {showSharePlaylist && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }} onClick={() => setShowSharePlaylist(false)}>
                    <div className="glass" style={{ width: '500px', padding: '2rem', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem' }}>Share Playlist</h2>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'grid', gap: '0.75rem' }}>
                            {userPlaylists.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>You don't have any playlists to share.</p>
                            ) : (
                                userPlaylists.map((playlist) => {
                                    const alreadyShared = sharedPlaylists.some(p => p.playlistId._id === playlist._id);
                                    return (
                                        <div key={playlist._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <img src={playlist.thumbnail} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{playlist.playlistTitle}</p>
                                            </div>
                                            {alreadyShared ? (
                                                <button disabled className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', opacity: 0.5 }}>Already Shared</button>
                                            ) : (
                                                <button onClick={() => handleSharePlaylist(playlist._id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Share</button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <button onClick={() => setShowSharePlaylist(false)} className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>Close</button>
                    </div>
                </div>
            )}
            {/* Join Group Modal */}
            {showJoinModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }} onClick={() => setShowJoinModal(false)}>
                    <div className="glass" style={{ width: '400px', padding: '2rem', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>Join the Tribe</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter your details to join {group.groupName} and track progress with others.</p>
                        <form onSubmit={handleJoinGroup}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your Name</label>
                                <input autoFocus required type="text" placeholder="John Doe" className="input-glass" style={{ width: '100%', padding: '0.8rem' }} value={joinName} onChange={e => setJoinName(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Join Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                success={alertState.success}
            />

            <ConfirmModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    if (confirmation.onConfirm) confirmation.onConfirm();
                    setConfirmation(prev => ({ ...prev, isOpen: false }));
                }}
                title={confirmation.title}
                description={confirmation.description}
                confirmText={confirmation.confirmText}
                danger={confirmation.danger}
            />
        </div>
    );
};

export default GroupDetails;
