import { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Youtube, Loader2, Sparkles, Image as ImageIcon, AlignLeft, Type } from 'lucide-react';

const CreatePlaylistModal = ({ onClose, onCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [ytUrl, setYtUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [isPlaylist, setIsPlaylist] = useState(false);
    const [importAll, setImportAll] = useState(true);

    const handleFetchMetadata = async () => {
        if (!ytUrl || !ytUrl.includes('youtube.com') && !ytUrl.includes('youtu.be')) return;

        setFetching(true);
        setError('');
        try {
            const res = await api.get(`/playlists/fetch-metadata?url=${encodeURIComponent(ytUrl)}`);
            setTitle(res.data.title || '');
            setDescription(res.data.description || '');
            setThumbnail(res.data.thumbnail || '');
            setIsPlaylist(res.data.type === 'playlist');
        } catch (err) {
            console.error(err);
            setError('Could not fetch YouTube details. You can still enter them manually.');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/playlists', { title, description, thumbnail });
            const newPlaylist = res.data;

            if (importAll && isPlaylist && ytUrl) {
                // Trigger bulk import
                try {
                    await api.post(`/playlists/${newPlaylist._id}/import-youtube`, { playlistUrl: ytUrl });
                } catch (importErr) {
                    console.error('Import failed:', importErr);
                    // We created the playlist, so we still call onCreated.
                    // But we might want to alert the user about the import failure.
                }
            }

            onCreated(newPlaylist);
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
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
            animation: 'fadeIn 0.3s ease-out'
        }} onClick={onClose}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .modal-content { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>

            <div className="glass modal-content" style={{
                width: '100%', maxWidth: '500px',
                padding: '2.5rem', borderRadius: '32px',
                position: 'relative',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)'
            }} onClick={e => e.stopPropagation()}>

                <button onClick={onClose} style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} className="hover:bg-white/10 hover:text-white transition-all">
                    <X size={20} />
                </button>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                        <Sparkles size={24} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px' }}>New Collection</span>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-0.5px' }}>Create Playlist</h2>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '1rem',
                        borderRadius: '16px',
                        marginBottom: '1.5rem',
                        fontSize: '0.85rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <X size={16} />
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        <Youtube size={16} /> Quick Import (YouTube Link)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={ytUrl}
                            onChange={e => setYtUrl(e.target.value)}
                            placeholder="Paste link to auto-fill..."
                            className="input-glass"
                            style={{ flex: 1, padding: '0.8rem 1rem' }}
                        />
                        <button
                            type="button"
                            onClick={handleFetchMetadata}
                            disabled={fetching || !ytUrl}
                            className="btn-secondary"
                            style={{ padding: '0 1.25rem', borderRadius: '12px' }}
                        >
                            {fetching ? <Loader2 className="spin" size={18} /> : 'Fetch'}
                        </button>
                    </div>
                </div>

                {isPlaylist && (
                    <div style={{ 
                        marginBottom: '1.5rem', padding: '1rem', borderRadius: '16px', 
                        background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                        display: 'flex', alignItems: 'center', gap: '0.75rem'
                    }}>
                        <input 
                            type="checkbox" 
                            id="importAll" 
                            checked={importAll} 
                            onChange={e => setImportAll(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="importAll" style={{ fontSize: '0.85rem', cursor: 'pointer', color: '#a5b4fc' }}>
                            Import all videos from this playlist automatically
                        </label>
                    </div>
                )}

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}></div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            <Type size={16} /> Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Master React in 30 Days"
                            className="input-glass"
                            style={{ padding: '0.8rem 1rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            <AlignLeft size={16} /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add some details about your goal..."
                            className="input-glass"
                            style={{ padding: '0.8rem 1rem', minHeight: '80px', resize: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            <ImageIcon size={16} /> Thumbnail URL
                        </label>
                        <input
                            type="text"
                            value={thumbnail}
                            onChange={e => setThumbnail(e.target.value)}
                            placeholder="Link to a cover image..."
                            className="input-glass"
                            style={{ padding: '0.8rem 1rem' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !title}
                        className="btn-primary"
                        style={{ padding: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}
                    >
                        {loading ? <Loader2 className="spin" size={20} /> : 'Create Playlist'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePlaylistModal;
