import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, ListMusic, ArrowRight, Clock } from 'lucide-react';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import LoadingScreen from '../components/Shared/LoadingScreen';

const MyPlaylists = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const res = await api.get('/playlists/my');
            setPlaylists(res.data);
        } catch (err) {
            console.error('Error fetching playlists:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>My Custom Playlists</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Create and manage your own collections.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} /> Create New
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)} // Modal now handles import
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} /> Import YouTube Playlist
                    </button>
                </div>
            </div>

            {playlists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--glass-border)', borderRadius: '24px' }}>
                    <div style={{ background: 'rgba(99,102,241,0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
                        <ListMusic size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Playlists Yet</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Start by creating your first custom playlist to clean up your learning journey.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => setShowCreateModal(true)} className="btn-secondary">
                            Create Blank
                        </button>
                        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                            Import YouTube Playlist
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {playlists.map(playlist => (
                        <Link
                            key={playlist._id}
                            to={`/custom-playlist/${playlist._id}`}
                            className="glass glass-hover"
                            style={{
                                display: 'block', padding: '1.5rem', borderRadius: '20px',
                                textDecoration: 'none', color: 'white', position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <ListMusic size={24} />
                                </div>
                                <div style={{
                                    padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700',
                                    background: playlist.visibility === 'link' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    color: playlist.visibility === 'link' ? '#86efac' : 'var(--text-muted)'
                                }}>
                                    {playlist.visibility === 'link' ? 'Public' : 'Private'}
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', lineHeight: '1.3' }}>{playlist.title}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {playlist.description || 'No description'}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '600' }}>
                                Manage Playlist <ArrowRight size={16} />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <CreatePlaylistModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(newPlaylist) => {
                        setPlaylists([newPlaylist, ...playlists]);
                    }}
                />
            )}
        </div>
    );
};

export default MyPlaylists;
