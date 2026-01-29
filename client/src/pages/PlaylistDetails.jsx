import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Calendar, ChevronLeft, ChevronRight, BarChart,
    CheckCircle, Plus, XCircle, Clock, Filter,
    ArrowUpDown, ListChecks, PlayCircle
} from 'lucide-react';

import { Link } from 'react-router-dom';
import LoadingScreen from '../components/Shared/LoadingScreen';

const PlaylistDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    const getTodayLocal = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [activeDate, setActiveDate] = useState(getTodayLocal());
    const [viewDate, setViewDate] = useState(new Date());
    const [schedulesMap, setSchedulesMap] = useState({});
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('position');
    const [message, setMessage] = useState('');
    const [hasScrolled, setHasScrolled] = useState(false);

    useEffect(() => {
        fetchPlaylistData();
    }, [id]);

    // Auto-scroll logic: Today > Nearest Future > Start (only once on initial load)
    useEffect(() => {
        if (!loading && videos.length > 0 && !hasScrolled) {
            const todayStr = getTodayLocal();

            // 1. Priority: Find video scheduled for Today
            let targetId = videos.find(v => {
                const s = schedulesMap[v._id];
                return s?.scheduledDate?.startsWith(todayStr);
            })?._id;

            // 2. Priority: Find nearest future scheduled video
            if (!targetId) {
                let minFutureDate = '9999-99-99';

                videos.forEach(v => {
                    const s = schedulesMap[v._id];
                    if (s?.scheduledDate) {
                        const sDate = s.scheduledDate.split('T')[0];
                        // strict string comparison for ISO dates works: "2026-01-30" > "2026-01-29"
                        if (sDate > todayStr && sDate < minFutureDate) {
                            minFutureDate = sDate;
                            targetId = v._id;
                        }
                    }
                });
            }

            // Scroll if target found
            if (targetId) {
                // Short timeout to ensure DOM render
                setTimeout(() => {
                    const el = document.getElementById(`video-${targetId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setHasScrolled(true);
                    }
                }, 500);
            } else {
                setHasScrolled(true);
            }
        }
    }, [loading, videos, schedulesMap, hasScrolled]);

    const { user } = useAuth();

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
                (schedulesRes.data || []).forEach(s => {
                    sMap[s.videoId] = s;
                });
                setSchedulesMap(sMap);
            } else {
                // Guest mode
                const [playlistRes, videosRes] = await Promise.all([
                    api.get(`/playlists/${id}`),
                    api.get(`/playlists/${id}/videos`)
                ]);
                setPlaylist(playlistRes.data);
                const vds = videosRes.data || [];
                setVideos(vds);

                // Get local progress
                const localWatched = JSON.parse(localStorage.getItem('guestWatched') || '{}');
                const sMap = {};
                let completedCount = 0;

                vds.forEach(v => {
                    if (localWatched[v._id]) {
                        sMap[v._id] = { status: 'completed', videoId: v._id };
                        completedCount++;
                    }
                });
                setSchedulesMap(sMap);
                setProgress({
                    completed: completedCount,
                    total: vds.length,
                    percent: vds.length > 0 ? (completedCount / vds.length) * 100 : 0
                });
            }
        } catch (err) {
            console.error('Error fetching playlist details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSchedule = async (videoId) => {
        try {
            const existing = schedulesMap[videoId];
            let res;
            if (existing) {
                res = await api.put(`/schedules/${existing._id}`, { scheduledDate: activeDate });
            } else {
                res = await api.post('/schedules', {
                    videoId,
                    scheduledDate: activeDate,
                    scheduledTime: null
                });
            }
            setSchedulesMap(prev => ({ ...prev, [videoId]: res.data }));

            console.log('--- Quick Schedule Debug ---');
            console.log('Active Date:', activeDate);
            console.log('Response Scheduled Date:', res.data.scheduledDate);
            console.log('Match?', res.data.scheduledDate?.split('T')[0] === activeDate);

            setMessage('Added to ' + formatDate(activeDate));
            setTimeout(() => setMessage(''), 3000);
            updateProgress();
        } catch (err) {
            console.error('Error scheduling video:', err);
        }
    };

    const handleRemoveSchedule = async (videoId) => {
        try {
            await api.delete(`/schedules/video/${videoId}`);
            setSchedulesMap(prev => {
                const newMap = { ...prev };
                delete newMap[videoId];
                return newMap;
            });
            setMessage('Removed from plan');
            setTimeout(() => setMessage(''), 3000);
            updateProgress();
        } catch (err) {
            console.error('Error removing schedule:', err);
        }
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
                    const res = await api.post('/schedules', {
                        videoId,
                        scheduledDate: null,
                        status: 'completed'
                    });
                    setSchedulesMap(prev => ({ ...prev, [videoId]: res.data }));
                }
                updateProgress();
            } else {
                // Guest mode: toggle in localStorage
                const localWatched = JSON.parse(localStorage.getItem('guestWatched') || '{}');
                if (localWatched[videoId]) {
                    delete localWatched[videoId];
                } else {
                    localWatched[videoId] = true;
                }
                localStorage.setItem('guestWatched', JSON.stringify(localWatched));

                // Update state
                const newSMap = { ...schedulesMap };
                if (localWatched[videoId]) {
                    newSMap[videoId] = { status: 'completed', videoId };
                } else {
                    delete newSMap[videoId];
                }
                setSchedulesMap(newSMap);

                // Update progress state
                const completedCount = Object.keys(localWatched).filter(vid => videos.some(v => v._id === vid)).length;
                setProgress({
                    completed: completedCount,
                    total: videos.length,
                    percent: videos.length > 0 ? (completedCount / videos.length) * 100 : 0
                });
            }
        } catch (err) {
            console.error('Error toggling completion:', err);
        }
    };

    const updateProgress = async () => {
        try {
            const progressRes = await api.get(`/schedules/progress?playlistId=${id}`);
            setProgress(progressRes.data);
        } catch (err) {
            console.error('Error updating progress:', err);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    };

    const getCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const calendarDays = [];

        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const dateObj = new Date(year, month - 1, lastDayOfPrevMonth - i);
            calendarDays.push({
                day: lastDayOfPrevMonth - i, month: month - 1, year: year, currentMonth: false, full: dateObj.toLocaleDateString('en-CA')
            });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            calendarDays.push({
                day: i, month: month, year: year, currentMonth: true, full: dateObj.toLocaleDateString('en-CA')
            });
        }

        const totalCells = 42;
        const nextMonthPadding = totalCells - calendarDays.length;
        for (let i = 1; i <= nextMonthPadding; i++) {
            const dateObj = new Date(year, month + 1, i);
            calendarDays.push({
                day: i, month: month + 1, year: year, currentMonth: false, full: dateObj.toLocaleDateString('en-CA')
            });
        }
        return calendarDays;
    };

    const changeMonth = (offset) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const handleGoToToday = () => {
        const today = new Date();
        setViewDate(today);
        setActiveDate(getTodayLocal());
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
            const getSec = (d) => {
                const p = (d || '0:00').split(':').map(Number);
                return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
            };
            return getSec(b.duration || '0:00') - getSec(a.duration || '0:00');
        }
        if (sortBy === 'date') {
            const dateA = schedulesMap[a._id]?.scheduledDate || '9999';
            const dateB = schedulesMap[b._id]?.scheduledDate || '9999';
            return dateA.localeCompare(dateB);
        }
        return 0;
    });

    const plannedToday = videos.filter(v => {
        const s = schedulesMap[v._id];
        return s && s.scheduledDate && s.scheduledDate.split('T')[0] === activeDate;
    });

    if (loading) return <LoadingScreen message="Assembling your curriculum..." />;

    const weekdayNames = ['s', 'm', 't', 'w', 'th', 'f', 'sa'];

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Immersive Hero Header */}
            <div style={{ position: 'relative', height: '300px', borderRadius: '24px', overflow: 'hidden', marginBottom: '2.5rem' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${playlist?.thumbnail})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'blur(40px) brightness(0.4)', transform: 'scale(1.1)'
                }}></div>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(15,15,20,0.9), transparent)'
                }}></div>

                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', padding: '0 3rem', gap: '2.5rem' }}>
                    <img src={playlist?.thumbnail} alt="" style={{ width: '320px', aspectRatio: '16/9', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                    <div style={{ flex: 1 }}>
                        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                            <ChevronLeft size={16} /> Dashboard
                        </button>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', lineHeight: '1.2' }}>{playlist?.playlistTitle}</h1>
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
                                <PlayCircle size={20} style={{ color: 'var(--primary)' }} /> <span>{videos.length} Lectures</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
                                <ListChecks size={20} style={{ color: 'var(--accent)' }} /> <span>{progress?.completed} / {progress?.total} Completed</span>
                            </div>
                        </div>
                        <div style={{ maxWidth: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                                <span style={{ fontWeight: '600' }}>Overall Mastery</span>
                                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{Math.round(progress?.percent || 0)}%</span>
                            </div>
                            <div className="progress-container" style={{ height: '8px', background: 'rgba(255,255,255,0.1)' }}>
                                <div className="progress-bar" style={{ width: `${progress?.percent || 0}%`, height: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Guest Banner */}
            {!user && (
                <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '1.2rem',
                    borderRadius: '20px',
                    marginBottom: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        <div style={{ fontSize: '1.8rem' }}>👋</div>
                        <div>
                            <p style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.2rem', color: 'white' }}>Welcome to Guest Mode!</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Your progress is saved locally. <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'none', borderBottom: '1px solid var(--primary)' }}>Create an account</Link> to sync across devices.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Multi-Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '2.5rem', alignItems: 'start' }}>

                {/* Main Content Area: Curriculum */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Toolbar & Filters */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Curriculum</h2>
                            <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                {['all', 'pending', 'completed'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        style={{
                                            padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600',
                                            background: filter === f ? 'var(--primary)' : 'transparent',
                                            color: filter === f ? 'white' : 'var(--text-muted)',
                                            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="input-glass"
                                style={{ width: '160px', padding: '0.5rem', fontSize: '0.85rem' }}
                            >
                                <option value="position">Playlist Order</option>
                                <option value="date">By Schedule</option>
                                <option value="duration">Longest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Videos List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredVideos.map((video) => {
                            const schedule = schedulesMap[video._id];
                            const isCompleted = schedule?.status === 'completed';
                            const isPlanned = schedule && schedule.scheduledDate;

                            return (
                                <div key={video._id} id={`video-${video._id}`} className="glass-hover" style={{
                                    padding: '1rem', borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', gap: '1.5rem',
                                    background: isCompleted ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)',
                                    border: isCompleted ? '2px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--glass-border)',
                                    opacity: isCompleted ? 0.9 : 1,
                                    transition: 'all 0.3s ease'
                                }} onMouseEnter={(e) => !isCompleted && (e.currentTarget.style.borderColor = 'var(--primary)')} onMouseLeave={(e) => !isCompleted && (e.currentTarget.style.borderColor = 'var(--glass-border)')}>
                                    <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: isCompleted ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.03)', width: '30px', textAlign: 'center' }}>
                                            {(video.position + 1).toString().padStart(2, '0')}
                                        </div>
                                        {video.thumbnail && <img src={video.thumbnail} alt="" style={{ width: '120px', height: '68px', borderRadius: '10px', objectFit: 'cover' }} />}
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: '700', color: isCompleted ? '#86efac' : 'inherit' }}>{video.title}</h3>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Clock size={14} /> {video.duration || '0:00'}
                                                </div>
                                                {isPlanned && (
                                                    <span style={{ color: isCompleted ? '#86efac' : 'var(--primary)', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <Calendar size={14} /> {formatDate(schedule.scheduledDate.split('T')[0])}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </a>

                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        {user && (
                                            !isPlanned ? (
                                                <button
                                                    onClick={() => handleQuickSchedule(video._id)}
                                                    disabled={isCompleted}
                                                    className="btn-secondary"
                                                    style={{
                                                        padding: '0.5rem 1.2rem',
                                                        borderRadius: '10px',
                                                        opacity: isCompleted ? 0.5 : 1,
                                                        cursor: isCompleted ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    Plan
                                                </button>
                                            ) : (
                                                <button onClick={() => handleRemoveSchedule(video._id)} style={{ background: 'none', color: 'var(--danger)', opacity: 0.5, cursor: 'pointer' }} title="Remove from plan"><XCircle size={22} /></button>
                                            )
                                        )}

                                        <button
                                            onClick={() => handleToggleCompletion(video._id)}
                                            style={{
                                                width: '42px', height: '42px', borderRadius: '12px',
                                                background: isCompleted ? '#16a34a' : 'rgba(255,255,255,0.03)',
                                                color: 'white', border: isCompleted ? 'none' : '1px solid var(--glass-border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                            title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                                        >
                                            <CheckCircle size={24} fill={isCompleted ? "white" : "none"} strokeWidth={isCompleted ? 0 : 2} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar: Planner & Agenda (Only for Logged-in Users) */}
                {user && (
                    <aside style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Calendar Design (Retained/Fine-tuned) */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Study Planner</span>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <button
                                        onClick={handleGoToToday}
                                        className="btn-secondary"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', fontWeight: '800', borderRadius: '8px' }}
                                    >
                                        Today
                                    </button>
                                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                                        <button onClick={() => changeMonth(-1)} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }}><ChevronLeft size={16} /></button>
                                        <button onClick={() => changeMonth(1)} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }}><ChevronRight size={16} /></button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ gridTemplateColumns: 'repeat(7, 1fr)', display: 'grid', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                {weekdayNames.map((day, i) => <div key={i} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: 'rgba(255,255,255,0.2)' }}>{day}</div>)}
                            </div>
                            <div style={{ gridTemplateColumns: 'repeat(7, 1fr)', display: 'grid', gap: '0.4rem' }}>
                                {getCalendarDays().map((d, i) => {
                                    const isToday = getTodayLocal() === d.full;
                                    const isActive = activeDate === d.full;
                                    return (
                                        <button key={i} onClick={() => setActiveDate(d.full)} style={{
                                            borderRadius: '10px', aspectRatio: '1/1', fontSize: '0.9rem', cursor: 'pointer',
                                            background: isActive ? 'var(--primary)' : (isToday ? 'rgba(99, 102, 241, 0.1)' : 'transparent'),
                                            color: isActive ? 'white' : (d.currentMonth ? 'var(--text-main)' : 'rgba(255,255,255,0.1)'),
                                            border: isToday && !isActive ? '1px solid var(--primary)' : '1px solid transparent',
                                            fontWeight: (isActive || isToday) ? '800' : '500'
                                        }}>{d.day}</button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Daily Agenda */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Clock size={18} style={{ color: 'var(--primary)' }} /> Agenda
                                </h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '800', padding: '0.3rem 0.8rem', background: 'rgba(99,102,241,0.1)', borderRadius: '12px' }}>
                                    {formatDate(activeDate)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {plannedToday.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.5 }}>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🍃</div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '500' }}>No tasks for this day.</p>
                                    </div>
                                ) : (
                                    plannedToday.map(video => {
                                        const schedule = schedulesMap[video._id];
                                        const isComp = schedule?.status === 'completed';
                                        return (
                                            <div key={video._id} style={{
                                                padding: '0.8rem', fontSize: '0.85rem', display: 'flex', gap: '0.8rem', alignItems: 'center',
                                                borderRadius: '16px', background: isComp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                                                border: isComp ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--glass-border)',
                                                transition: 'all 0.3s'
                                            }}>
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '6px',
                                                    background: isComp ? '#16a34a' : 'var(--primary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '0.7rem', fontWeight: '900', flexShrink: 0
                                                }}>
                                                    {isComp ? <CheckCircle size={14} /> : (video.position + 1)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontWeight: '700', lineHeight: '1.2', color: isComp ? '#86efac' : 'inherit' }}>{video.title}</p>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{video.duration}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {message && <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', fontSize: '0.8rem', color: 'white', textAlign: 'center', fontWeight: '700' }}>{message}</div>}
                        </div>
                    </aside>
                )}
            </div>


        </div>
    );
};

export default PlaylistDetails;
