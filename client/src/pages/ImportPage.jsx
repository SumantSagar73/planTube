import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Youtube, 
    ArrowRight, 
    Plus, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    MousePointer2,
    Layout,
    Library
} from 'lucide-react';

const ImportPage = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [createCustom, setCreateCustom] = useState(false);
    const navigate = useNavigate();

    // New-user onboarding: show type picker only after URL is entered, unless skipped
    const isNewUser = !localStorage.getItem('plantube_imported_once');
    const [onboardingSkipped, setOnboardingSkipped] = useState(!isNewUser);
    const showTypePicker = !isNewUser ? onboardingSkipped || url.length > 10 : true;

    const handleImport = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // If createCustom is true, we create a custom playlist (Course)
            // Otherwise we do a standard import
            if (createCustom) {
                // 1. Fetch Metadata first to get a title
                const metaRes = await api.get(`/playlists/fetch-metadata?url=${encodeURIComponent(url)}`);
                const { title, description, thumbnail, type, playlistId, videoId } = metaRes.data;

                // 2. Create Custom Playlist
                const createRes = await api.post('/playlists', { 
                    title: `Course: ${title}`, 
                    description: description || 'Imported via Course Creator',
                    thumbnail 
                });
                const newPlaylist = createRes.data;

                // 3. Trigger Bulk Import based on type
                if (type === 'playlist') {
                    await api.post(`/playlists/${newPlaylist._id}/import-youtube`, { playlistUrl: url });
                } else if (videoId) {
                    await api.post(`/playlists/${newPlaylist._id}/videos`, { youtubeVideoId: videoId });
                }

                setResult({
                    type: 'custom',
                    id: newPlaylist._id,
                    title: newPlaylist.title
                });
            } else {
                // Standard Import
                const res = await api.post('/playlists/import', { playlistUrl: url });
                setResult({
                    type: 'standard',
                    id: res.data.playlist?._id || res.data.video?._id,
                    title: res.data.playlist?.playlistTitle || res.data.video?.title
                });
            }
            localStorage.setItem('plantube_imported_once', '1');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Failed to import. Please check the URL and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem', 
                    padding: '0.5rem 1.25rem', borderRadius: '100px', 
                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1.5rem'
                }}>
                    <Youtube size={18} /> Course Creator
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-1px' }}>
                    Import Your Next Journey
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                    Paste any YouTube playlist or video link to instantly transform it into a structured course.
                </p>
            </div>

            <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px', marginBottom: '2rem' }}>
                <form onSubmit={handleImport}>
                    <div data-section="import-input" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            YouTube URL (Playlist or Video)
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="text"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://www.youtube.com/playlist?list=..."
                                className="input-glass"
                                style={{ flex: 1, padding: '1.25rem 1.75rem', fontSize: '1.1rem' }}
                                disabled={loading}
                            />
                            <button 
                                type="submit" 
                                disabled={loading || !url} 
                                className="btn-primary"
                                style={{ padding: '0 2.5rem', borderRadius: '16px', fontWeight: '800' }}
                            >
                                {loading ? <Loader2 className="spin" /> : 'Import'}
                            </button>
                        </div>
                    </div>

                    {/* New-user hint: shown until a URL is pasted */}
                    {isNewUser && !onboardingSkipped && url.length <= 10 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 1rem', borderRadius: '14px', marginBottom: '1rem',
                            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '1rem' }}>👆</span>
                                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
                                    Paste a YouTube URL above to get started
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOnboardingSkipped(true)}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
                            >
                                Skip guide
                            </button>
                        </div>
                    )}

                    {showTypePicker && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Standard / YouTube Playlist — shown first so new users default here */}
                        <button
                            type="button"
                            onClick={() => setCreateCustom(false)}
                            className={`glass ${!createCustom ? 'active-border' : ''}`}
                            style={{
                                padding: '1.5rem', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
                                border: !createCustom ? '2px solid var(--primary)' : '2px solid transparent',
                                background: !createCustom ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: !createCustom ? 'var(--primary)' : 'white' }}>
                                <Library size={20} />
                                <span style={{ fontWeight: '700' }}>YouTube Playlist</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.3)' }}>Recommended</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                Sync directly with a YouTube playlist. Best for courses and series.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCreateCustom(true)}
                            className={`glass ${createCustom ? 'active-border' : ''}`}
                            style={{
                                padding: '1.5rem', borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
                                border: createCustom ? '2px solid var(--primary)' : '2px solid transparent',
                                background: createCustom ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: createCustom ? 'var(--primary)' : 'white' }}>
                                <Layout size={20} />
                                <span style={{ fontWeight: '700' }}>Custom Course</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                Fully personalizable. Add notes, reorder videos, and mark progress.
                            </p>
                        </button>
                    </div>}
                </form>

                {error && (
                    <div style={{ 
                        marginTop: '2rem', padding: '1.25rem', borderRadius: '16px', 
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', gap: '1rem', alignItems: 'center'
                    }}>
                        <AlertCircle size={20} />
                        <p style={{ fontSize: '0.9rem' }}>{error}</p>
                    </div>
                )}

                {result && (
                    <div data-section="import-preview" style={{ 
                        marginTop: '2rem', padding: '2rem', borderRadius: '24px', 
                        background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{ color: '#22c55e', marginBottom: '1rem' }}>
                            <CheckCircle2 size={48} style={{ margin: '0 auto' }} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Import Successful!</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            "{result.title}" is now ready for you.
                        </p>
                        <button 
                            onClick={() => navigate(result.type === 'custom' ? `/custom-playlist/${result.id}` : `/playlist/${result.id}`)}
                            className="btn-primary" 
                            style={{ padding: '1rem 2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 auto' }}
                        >
                            Go to Course <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', opacity: 0.7 }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                    <MousePointer2 size={24} style={{ marginBottom: '0.75rem', color: 'var(--primary)' }} />
                    <h5 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>One-Click Import</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paste and go. We handle the metadata.</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                    <Layout size={24} style={{ marginBottom: '0.75rem', color: 'var(--primary)' }} />
                    <h5 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Course View</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Focus on learning, not searching.</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                    <Plus size={24} style={{ marginBottom: '0.75rem', color: 'var(--primary)' }} />
                    <h5 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Customizable</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reorder videos to fit your speed.</p>
                </div>
            </div>

            <style>{`
                .active-border {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ImportPage;
