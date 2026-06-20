import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft, BarChart, CheckCircle, Plus, XCircle,
    Filter, ArrowUpDown, ListChecks, PlayCircle, RefreshCw, ExternalLink
} from 'lucide-react';
import { cache } from '../utils/cache';
import LoadingScreen from '../components/Shared/LoadingScreen';
import SkillTree from '../components/Playlist/SkillTree';
import VideoCard from '../components/Playlist/VideoCard';
import CalendarPanel from '../components/Playlist/CalendarPanel';
import AgendaPanel from '../components/Playlist/AgendaPanel';
import { AlignLeft, GitGraph, Users } from 'lucide-react';
import socket from '../services/socket';
import { formatDate } from '../utils/dateTime';
import useIsMobile from '../hooks/useIsMobile';

const getTodayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const PlaylistDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeDate, setActiveDate] = useState(getTodayLocal());
    const [viewDate, setViewDate] = useState(new Date());
    const [schedulesMap, setSchedulesMap] = useState({});
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('position');
    const [message, setMessage] = useState('');
    const [hasScrolled, setHasScrolled] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [presenceCount, setPresenceCount] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');
    const isMobile = useIsMobile(900);

    const handleAutoSync = async () => {
        if (!user || syncing) return;
        setSyncing(true); setSyncMsg('');
        try {
            const res = await api.post(`/playlists/${id}/sync`);
            setSyncMsg(res.data.msg + (res.data.added ? ` +${res.data.added} new videos.` : ''));
            if (res.data.added > 0) fetchPlaylistData();
        } catch {
            setSyncMsg('Sync failed.');
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncMsg(''), 4000);
        }
    };

    useEffect(() => { fetchPlaylistData(); }, [id]);

    // Auto-scroll to today's / next scheduled video
    useEffect(() => {
        if (!loading && videos.length > 0 && !hasScrolled) {
            const todayStr = getTodayLocal();
            let targetId = videos.find(v => schedulesMap[v._id]?.scheduledDate?.startsWith(todayStr))?._id;
            if (!targetId) {
                let minFutureDate = '9999-99-99';
                videos.forEach(v => {
                    const s = schedulesMap[v._id];
                    if (s?.scheduledDate) {
                        const sDate = s.scheduledDate.split('T')[0];
                        if (sDate > todayStr && sDate < minFutureDate) { minFutureDate = sDate; targetId = v._id; }
                    }
                });
            }
            if (targetId) {
                setTimeout(() => {
                    const el = document.getElementById(`video-${targetId}`);
                    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHasScrolled(true); }
                }, 500);
            } else {
                setHasScrolled(true);
            }
        }
    }, [loading, videos, schedulesMap, hasScrolled]);

    // Presence tracking
    useEffect(() => {
        if (!videos || videos.length === 0) return;
        if (!socket.connected) socket.connect();

        const videoIds = videos.map(v => v.sharedVideoId?.youtubeId || v.videoId);
        socket.emit('join_playlist', { playlistId: id, videoIds });

        const handlePlaylistUpdate = (data) => { if (data.playlistId === id) setPresenceCount(data.count); };
        const handleTriggerUpdate = () => socket.emit('request_playlist_update');
        socket.on('playlist_presence_update', handlePlaylistUpdate);
        socket.on('trigger_playlist_update', handleTriggerUpdate);
        return () => {
            socket.off('playlist_presence_update', handlePlaylistUpdate);
            socket.off('trigger_playlist_update', handleTriggerUpdate);
        };
    }, [videos, id]);

    const fetchPlaylistData = async () => {
        try {
            if (user) {
                const [playlistRes, videosRes, progressRes, schedulesRes] = await Promise.all([
                    api.get('/playlists'),
                    api.get(`/playlists/${id}/videos`),
                    api.get(`/schedules/progress?playlistId=${id}`),
                    api.get(`/schedules/playlist/${id}`)
                ]);
                const currentPlaylist = playlistRes.data.find(p => p._id === id);
                setPlaylist(currentPlaylist);
                setVideos(videosRes.data || []);
                setProgress(progressRes.data);
                const sMap = {};
                (schedulesRes.data || []).forEach(s => { sMap[s.videoId] = s; });
                setSchedulesMap(sMap);
            } else {
                const [playlistRes, videosRes] = await Promise.all([
                    api.get(`/playlists/${id}`),
                    api.get(`/playlists/${id}/videos`)
                ]);
                setPlaylist(playlistRes.data);
                const vds = videosRes.data || [];
                setVideos(vds);
                const localWatched = JSON.parse(localStorage.getItem('guestWatched') || '{}');
                const sMap = {};
                let completedCount = 0;
                vds.forEach(v => {
                    if (localWatched[v._id]) { sMap[v._id] = { status: 'completed', videoId: v._id }; completedCount++; }
                });
                setSchedulesMap(sMap);
                setProgress({ completed: completedCount, total: vds.length, percent: vds.length > 0 ? (completedCount / vds.length) * 100 : 0 });
            }
        } catch (err) {
            console.error('Error fetching playlist details:', err);
            setError(err.response?.data?.msg || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSchedule = async (videoId) => {
        try {
            const existing = schedulesMap[videoId];
            const res = existing
                ? await api.put(`/schedules/${existing._id}`, { scheduledDate: activeDate })
                : await api.post('/schedules', { videoId, scheduledDate: activeDate, scheduledTime: null });
            setSchedulesMap(prev => ({ ...prev, [videoId]: res.data }));
            setMessage('Added to ' + formatDate(activeDate));
            setTimeout(() => setMessage(''), 3000);
            updateProgress();
        } catch (err) { console.error('Error scheduling video:', err); }
    };

    const handleRemoveSchedule = async (videoId) => {
        try {
            await api.delete(`/schedules/video/${videoId}`);
            setSchedulesMap(prev => { const m = { ...prev }; delete m[videoId]; return m; });
            setMessage('Removed from plan');
            setTimeout(() => setMessage(''), 3000);
            updateProgress();
        } catch (err) { console.error('Error removing schedule:', err); }
    };

    const handleToggleCompletion = async (videoId) => {
        try {
            if (user) {
                const existing = schedulesMap[videoId];
                if (existing) {
                    const newStatus = existing.status === 'completed' ? 'pending' : 'completed';
                    const res = await api.put(`/schedules/${existing._id}`, { status: newStatus });
                    setSchedulesMap(prev => ({ ...prev, [videoId]: res.data }));
                } else {
                    const res = await api.post('/schedules', { videoId, scheduledDate: null, status: 'completed' });
                    setSchedulesMap(prev => ({ ...prev, [videoId]: res.data }));
                }
                updateProgress();
            } else {
                const localWatched = JSON.parse(localStorage.getItem('guestWatched') || '{}');
                if (localWatched[videoId]) delete localWatched[videoId]; else localWatched[videoId] = true;
                localStorage.setItem('guestWatched', JSON.stringify(localWatched));
                const newSMap = { ...schedulesMap };
                if (localWatched[videoId]) newSMap[videoId] = { status: 'completed', videoId };
                else delete newSMap[videoId];
                setSchedulesMap(newSMap);
                const completedCount = Object.keys(localWatched).filter(vid => videos.some(v => v._id === vid)).length;
                setProgress({ completed: completedCount, total: videos.length, percent: videos.length > 0 ? (completedCount / videos.length) * 100 : 0 });
            }
        } catch (err) { console.error('Error toggling completion:', err); }
    };

    const updateProgress = async () => {
        try {
            const progressRes = await api.get(`/schedules/progress?playlistId=${id}`);
            setProgress(progressRes.data);
        } catch (err) { console.error('Error updating progress:', err); }
    };

    const filteredVideos = videos.filter(v => {
        const s = schedulesMap[v._id];
        if (filter === 'scheduled') return !!(s && s.scheduledDate);
        if (filter === 'pending') return !s || s.status !== 'completed';
        if (filter === 'completed') return s && s.status === 'completed';
        return true;
    }).sort((a, b) => {
        if (sortBy === 'position') return a.position - b.position;
        if (sortBy === 'duration') {
            const getSec = (d) => { const p = (d || '0:00').split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; };
            return getSec(b.duration || '0:00') - getSec(a.duration || '0:00');
        }
        if (sortBy === 'date') {
            const dateA = schedulesMap[a._id]?.scheduledDate || '9999';
            const dateB = schedulesMap[b._id]?.scheduledDate || '9999';
            return dateA.localeCompare(dateB);
        }
        return 0;
    });

    const plannedToday = videos
        .filter(v => {
            const s = schedulesMap[v._id];
            return s && s.scheduledDate && s.scheduledDate.split('T')[0] === activeDate;
        })
        .map(v => ({ ...v, _scheduleStatus: schedulesMap[v._id]?.status }));

    if (loading) return <LoadingScreen message="Assembling your curriculum..." />;

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center', background: '#09090b', color: 'white' }}>
            <div className="glass" style={{ padding: '3rem', maxWidth: '400px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <XCircle size={64} style={{ color: 'var(--danger)', marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Playlist Unavailable</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button onClick={() => { setError(null); setLoading(true); fetchPlaylistData(); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                        <RefreshCw size={20} /> Try Again
                    </button>
                    <button onClick={() => navigate('/library')} className="btn-secondary" style={{ width: '100%' }}>Back to Library</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="playlist-details-page" style={{ height: isMobile ? 'auto' : 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', overflow: isMobile ? 'visible' : 'hidden' }}>

            {/* Collapsible Hero Header */}
            <div className="playlist-hero" style={{ 
                position: 'relative', 
                height: scrolled ? '72px' : (isMobile ? 'auto' : '260px'), 
                padding: (isMobile && !scrolled) ? '2rem 1.5rem' : '0',
                transition: 'height 0.4s cubic-bezier(0.23, 1, 0.32, 1)', 
                flexShrink: 0, 
                overflow: 'hidden',
                minHeight: (isMobile && !scrolled) ? '320px' : 'auto'
            }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${playlist?.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.4)', transform: 'scale(1.1)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,15,20,0.9), transparent)' }} />

                {/* Compact header (scrolled) */}
                <div className="playlist-hero-compact" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: isMobile ? '0 1rem' : '0 2rem', gap: isMobile ? '0.75rem' : '1.5rem', opacity: scrolled ? 1 : 0, transition: 'opacity 0.25s ease', pointerEvents: scrolled ? 'auto' : 'none' }}>
                    <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', flexShrink: 0 }}>
                        <ChevronLeft size={14} /> {isMobile ? '' : 'Dashboard'}
                    </button>
                    <h2 style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '800', color: 'white', background: 'linear-gradient(to right, white, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', maxWidth: isMobile ? '120px' : '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {playlist?.playlistTitle}
                    </h2>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {!isMobile && <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.8rem' }}>{Math.round(progress?.percent || 0)}%</span>}
                        <div style={{ width: isMobile ? '60px' : '120px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                            <div style={{ width: `${progress?.percent || 0}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }} />
                        </div>
                    </div>
                </div>

                {/* Full hero (not scrolled) */}
                <div className="playlist-hero-full" style={{ 
                    position: isMobile ? 'relative' : 'absolute', 
                    inset: 0, 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    padding: isMobile ? '1.5rem' : '0 3rem', 
                    gap: isMobile ? '1.5rem' : '2.5rem', 
                    opacity: scrolled ? 0 : 1, 
                    transition: 'opacity 0.2s ease', 
                    pointerEvents: scrolled ? 'none' : 'auto' 
                }}>
                    <img src={playlist?.thumbnail} alt="" style={{ 
                        width: isMobile ? '100%' : '280px', 
                        aspectRatio: '16/9', 
                        borderRadius: isMobile ? '12px' : '16px', 
                        objectFit: 'cover', 
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)' 
                    }} />
                    <div style={{ flex: 1, width: '100%' }}>
                        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                            <ChevronLeft size={16} /> Dashboard
                        </button>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.2rem' }}>
                            <h1 style={{ 
                                fontSize: isMobile ? '1.6rem' : '2.2rem', 
                                fontWeight: '800', 
                                margin: 0, 
                                lineHeight: '1.2',
                                flex: 1,
                                minWidth: 0,
                                color: 'var(--text-main)'
                            }}>
                                {playlist?.playlistTitle}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {user && playlist?.playlistId && !playlist.playlistId.startsWith('VIDEO_') && (
                                <button
                                    onClick={handleAutoSync}
                                    disabled={syncing}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        background: syncMsg ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                                        border: `1px solid ${syncMsg ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                        padding: isMobile ? '0.5rem 0.8rem' : '0.6rem 1.1rem',
                                        borderRadius: '12px', color: syncMsg ? '#4ade80' : 'white',
                                        fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                                        flexShrink: 0, whiteSpace: 'nowrap'
                                    }}
                                >
                                    <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                                    {syncMsg || (syncing ? 'Syncing...' : 'Sync')}
                                </button>
                            )}
                            {playlist?.playlistId && (
                                <a
                                    href={`https://www.youtube.com/playlist?list=${playlist.playlistId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover-scale"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.2rem',
                                        borderRadius: '12px',
                                        color: 'white',
                                        textDecoration: 'none',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        transition: 'all 0.3s',
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <div style={{ background: '#ef4444', padding: '0.2rem', borderRadius: '4px', display: 'flex' }}>
                                        <PlayCircle size={14} fill="white" />
                                    </div>
                                    {isMobile ? 'YouTube' : 'Watch on YouTube'}
                                    <ExternalLink size={14} style={{ opacity: 0.5 }} />
                                </a>
                            )}
                            </div>
                        </div>
                        <div className="playlist-hero-stats" style={{ display: 'flex', gap: isMobile ? '1rem' : '2rem', marginBottom: isMobile ? '1.2rem' : '1.5rem', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                                <PlayCircle size={isMobile ? 18 : 20} style={{ color: 'var(--primary)' }} /> <span>{videos.length} Lectures</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                                <ListChecks size={isMobile ? 18 : 20} style={{ color: 'var(--accent)' }} /> <span>{progress?.completed} / {progress?.total} Completed</span>
                            </div>
                            {presenceCount > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                                    <Users size={isMobile ? 18 : 20} style={{ color: '#22c55e' }} />
                                    <span>{presenceCount} online</span>
                                </div>
                            )}
                        </div>
                        <div style={{ maxWidth: isMobile ? '100%' : '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isMobile ? '0.5rem' : '0.6rem', fontSize: isMobile ? '0.85rem' : '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                                <span style={{ fontWeight: '600' }}>Mastery Progress</span>
                                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{Math.round(progress?.percent || 0)}%</span>
                            </div>
                            <div className="progress-container" style={{ height: isMobile ? '6px' : '8px', background: 'rgba(255,255,255,0.1)' }}>
                                <div className="progress-bar" style={{ width: `${progress?.percent || 0}%`, height: '100%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="playlist-toolbar" style={{ 
                flexShrink: 0, 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'stretch' : 'center', 
                padding: isMobile ? '0.75rem 1rem' : '0.6rem 2rem', 
                background: 'rgba(10,10,12,0.97)', 
                backdropFilter: 'blur(20px)', 
                borderBottom: '1px solid rgba(255,255,255,0.07)', 
                gap: '1rem', 
                zIndex: 10 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--glass-border)', flex: isMobile ? 1 : 'none' }}>
                        {['all', 'pending', 'completed'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{ flex: isMobile ? 1 : 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', background: filter === f ? 'var(--primary)' : 'transparent', color: filter === f ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        <button onClick={() => setViewMode('list')} title="List View" style={{ padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', background: viewMode === 'list' ? 'rgba(255,255,255,0.05)' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', border: 'none', display: 'flex' }}>
                            <AlignLeft size={16} />
                        </button>
                        <button onClick={() => setViewMode('tree')} title="Skill Tree" style={{ padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', background: viewMode === 'tree' ? 'rgba(255,255,255,0.05)' : 'transparent', color: viewMode === 'tree' ? 'var(--primary)' : 'var(--text-muted)', border: 'none', display: 'flex' }}>
                            <GitGraph size={16} />
                        </button>
                    </div>
                </div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-glass" style={{ width: isMobile ? '100%' : '160px', padding: '0.5rem', fontSize: '0.8rem' }}>
                    <option value="position">Playlist Order</option>
                    <option value="date">By Schedule</option>
                    <option value="duration">Longest First</option>
                </select>
            </div>

            {/* Content Row */}
            <div className="playlist-main-grid" style={{ 
                flex: 1, 
                display: 'grid', 
                gridTemplateColumns: (user && !isMobile) ? 'minmax(0, 1fr) 360px' : '1fr', 
                gap: '0', 
                overflow: isMobile ? 'visible' : 'hidden' 
            }}>

                {/* Scrollable Video List */}
                <div className="playlist-content" onScroll={e => setScrolled(e.currentTarget.scrollTop > 80)} style={{ overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '1rem' : '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Guest Banner */}
                    {!user && (
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '1.5rem' }}>👋</div>
                                <div>
                                    <p style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.1rem', color: 'white' }}>Guest Mode</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Progress is saved locally. <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'none' }}>Join</Link> to sync.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'list' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredVideos.map(video => (
                                <VideoCard
                                    key={video._id}
                                    video={video}
                                    playlistId={id}
                                    schedule={schedulesMap[video._id]}
                                    user={user}
                                    activeDate={activeDate}
                                    formatDate={formatDate}
                                    onSchedule={handleQuickSchedule}
                                    onRemoveSchedule={handleRemoveSchedule}
                                    onToggleCompletion={handleToggleCompletion}
                                />
                            ))}
                        </div>
                    ) : (
                        <SkillTree videos={filteredVideos} schedulesMap={schedulesMap} />
                    )}
                </div>

                {/* Sidebar: Planner & Agenda */}
                {user && (
                    <aside className="playlist-sidebar" style={{ 
                        overflowY: isMobile ? 'visible' : 'auto', 
                        borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', 
                        borderTop: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        padding: isMobile ? '1.5rem 1rem 4rem' : '1.5rem' 
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <CalendarPanel
                                viewDate={viewDate}
                                activeDate={activeDate}
                                getTodayLocal={getTodayLocal}
                                onDayClick={setActiveDate}
                                onChangeMonth={offset => { const d = new Date(viewDate); d.setMonth(d.getMonth() + offset); setViewDate(d); }}
                                onGoToToday={() => { setViewDate(new Date()); setActiveDate(getTodayLocal()); }}
                            />
                            <AgendaPanel
                                plannedToday={plannedToday}
                                activeDate={activeDate}
                                formatDate={formatDate}
                                message={message}
                            />
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default PlaylistDetails;
