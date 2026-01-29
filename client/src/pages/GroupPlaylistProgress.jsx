import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Users, Clock, CheckCircle, Play, ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const GroupPlaylistProgress = () => {
    const { groupId, playlistId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [schedules, setSchedules] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState(null);
    const [error, setError] = useState(null);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, [groupId, playlistId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [groupRes, playlistRes, videosRes, progressRes, schedulesRes] = await Promise.all([
                api.get(`/groups/${groupId}`),
                api.get(`/playlists/${playlistId}`),
                api.get(`/playlists/${playlistId}/videos`),
                api.get(`/groups/${groupId}/playlists/${playlistId}/progress`),
                api.get(`/groups/${groupId}/playlists/${playlistId}/schedules`)
            ]);
            setGroup(groupRes.data);
            setPlaylist(playlistRes.data);
            setVideos(videosRes.data);
            setProgressData(progressRes.data);
            setSchedules(schedulesRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.response?.data?.msg || 'Failed to load group data');
            setLoading(false);
        }
    };

    const isVideoCompleted = (userId, vId) => {
        const userSchedules = schedules[userId] || [];
        return userSchedules.some(s =>
            (s.videoId?._id === vId || s.videoId === vId) && s.status === 'completed'
        );
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
        return days;
    };

    const changeMonth = (offset) => {
        setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + offset, 1));
    };

    const getSchedulesForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toDateString();
        const result = [];

        Object.entries(schedules).forEach(([userId, userSchedules]) => {
            const member = progressData.find(m => m.userId === userId);
            const name = member ? member.name : 'Unknown';
            const colorIndex = progressData.findIndex(m => m.userId === userId);

            userSchedules.forEach(s => {
                if (s.scheduledDate && new Date(s.scheduledDate).toDateString() === dateStr) {
                    result.push({ ...s, userName: name, colorIndex: colorIndex !== -1 ? colorIndex : 0 });
                }
            });
        });
        return result;
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    if (error) return (
        <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>Oops!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
            <button onClick={() => navigate(`/groups/${groupId}`)} className="btn-primary">Back to Group</button>
        </div>
    );

    return (
        <div style={{ padding: '2rem 3vw', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate(`/groups/${groupId}`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} />
                    <span>Back to Group</span>
                </button>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Shared Learning</span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Group Progress Tracking</h1>
                <p style={{ color: 'var(--text-muted)' }}>{playlist?.playlistTitle} in {group?.groupName}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
                {/* Left Column: Table */}
                <div style={{ minWidth: 0 }}>
                    <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <div style={{ overflowX: 'auto', width: '100%' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1.5rem', minWidth: '300px', position: 'sticky', left: 0, background: '#0f172a', zIndex: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                <Play size={14} />
                                                <span>Videos</span>
                                            </div>
                                        </th>
                                        {progressData.map(member => (
                                            <th key={member.userId} style={{ padding: '1.5rem', textAlign: 'center', minWidth: '120px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {member.name[0].toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', color: 'white' }}>{member.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>{member.percentage}%</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {videos.map((video, idx) => (
                                        <tr key={video._id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1rem 1.5rem', position: 'sticky', left: 0, background: '#0f172a', zIndex: 5 }}>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', minWidth: '20px' }}>{idx + 1}</span>
                                                    <div>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.1rem' }}>{video.title}</p>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{video.duration}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {progressData.map(member => {
                                                const completed = isVideoCompleted(member.userId, video._id);
                                                return (
                                                    <td key={`${member.userId}-${video._id}`} style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <div style={{
                                                            margin: '0 auto',
                                                            width: '24px', height: '24px', borderRadius: '6px',
                                                            background: completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`
                                                        }}>
                                                            {completed ? <CheckCircle size={14} color="#10b981" /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Calendar Sidebar */}
                <div style={{ position: 'sticky', top: '2rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                        {/* Calendar Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                {calendarDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button onClick={() => changeMonth(-1)} className="btn-secondary" style={{ padding: '0.25rem' }}>
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={() => changeMonth(1)} className="btn-secondary" style={{ padding: '0.25rem' }}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>{d}</div>
                            ))}
                            {getDaysInMonth(calendarDate).map((date, i) => {
                                if (!date) return <div key={`empty-${i}`} />;
                                const schedulesForDay = getSchedulesForDate(date);
                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                const isToday = new Date().toDateString() === date.toDateString();

                                return (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        style={{
                                            aspectRatio: '1/1',
                                            borderRadius: '8px',
                                            background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                                            border: isToday ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                    >
                                        <span style={{ fontSize: '0.8rem', fontWeight: isSelected || isToday ? '800' : '600', color: isSelected ? 'white' : 'var(--text-main)' }}>{date.getDate()}</span>
                                        {/* Dot indicators */}
                                        <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px' }}>
                                            {schedulesForDay.slice(0, 3).map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        width: '4px', height: '4px', borderRadius: '50%',
                                                        background: isSelected ? 'white' : `hsl(${s.colorIndex * 120}, 70%, 60%)`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selected Day Details */}
                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} color="var(--primary)" />
                                <span>{selectedDate.toLocaleDateString()}</span>
                            </h3>

                            {getSchedulesForDate(selectedDate).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>No tasks.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '30vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {getSchedulesForDate(selectedDate).map((item, i) => (
                                        <div key={i} style={{ padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '6px',
                                                background: `hsl(${item.colorIndex * 120}, 70%, 60%)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 'bold', fontSize: '0.7rem'
                                            }}>
                                                {item.userName[0].toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <p style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.userName}</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.videoId?.title || 'Unknown Video'}</p>
                                            </div>
                                            {item.status === 'completed' && (
                                                <CheckCircle size={14} color="#10b981" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupPlaylistProgress;
