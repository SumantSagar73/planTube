import { useState } from 'react';
import api from '../services/api';
import { X } from 'lucide-react';

const CreatePlaylistModal = ({ onClose, onCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/playlists', { title, description, thumbnail });
            onCreated(res.data);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Failed to create playlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div className="glass" style={{
                width: '100%', maxWidth: '400px',
                padding: '2rem', borderRadius: '24px',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}>
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Create New Playlist</h2>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            placeholder="e.g. React Mastery"
                            className="input-glass"
                            style={{ width: '100%', padding: '0.8rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What's this playlist about?"
                            className="input-glass"
                            style={{ width: '100%', padding: '0.8rem', minHeight: '80px', resize: 'vertical' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Cover Image URL (Optional)</label>
                        <input
                            type="text"
                            value={thumbnail}
                            onChange={e => setThumbnail(e.target.value)}
                            placeholder="https://..."
                            className="input-glass"
                            style={{ width: '100%', padding: '0.8rem' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ padding: '0.8rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}
                    >
                        {loading ? 'Creating...' : 'Create Playlist'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePlaylistModal;
