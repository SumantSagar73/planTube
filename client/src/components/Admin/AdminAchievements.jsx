import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Smile, Trophy, Filter, RefreshCw } from 'lucide-react';
import LoadingScreen from '../Shared/LoadingScreen';

const AdminAchievements = ({ notify }) => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null); // null = list view, {} = new, {id} = edit
    const [filterCategory, setFilterCategory] = useState('All');

    // Form state
    const [formData, setFormData] = useState({
        key: '', name: '', description: '', category: 'Uncategorized', 
        iconType: 'emoji', icon: '', xpReward: 0, isActive: true,
        criteria: { type: 'xp', value: 0 }
    });

    // --- Render Logic ---
    const criteriaTypes = [
        'xp', 'focus_minutes', 'streak_days', 'playlists_created', 'playlists_followed',
        'feedbacks_submitted', 'groups_created', 'followers', 'friends_added',
        'sessions_completed', 'ai_summary', 'ai_chat', 'ai_brainstorm', 'notes_taken',
        'theme_customization', 'playlist_completion', 'legacy'
    ];

    // Image Cropper State
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [imageObj, setImageObj] = useState(null);
    const [cropRect, setCropRect] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/achievements');
            setAchievements(res.data);
        } catch (err) {
            notify('Error fetching achievements', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem._id) {
                await api.put(`/admin/achievements/${editingItem._id}`, formData);
                notify('Achievement updated successfully');
            } else {
                await api.post('/admin/achievements', formData);
                notify('Achievement created successfully');
            }
            setEditingItem(null);
            fetchAchievements();
        } catch (err) {
            notify(err.response?.data?.error || 'Error saving achievement', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this achievement? This might affect users who have unlocked it.')) return;
        try {
            await api.delete(`/admin/achievements/${id}`);
            notify('Achievement deleted');
            fetchAchievements();
        } catch (err) {
            notify('Error deleting achievement', 'error');
        }
    };

    // --- Image Loading and Cropping Logic ---
    const getProxiedUrl = (url) => {
        const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
        return `${apiBase}/api/proxy-image?url=${encodeURIComponent(url)}`;
    };

    // Converts Google Drive share links to direct download URLs
    const normalizeImageUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        // Pattern: https://drive.google.com/file/d/FILE_ID/view?...
        const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch) {
            return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
        }
        // Pattern: https://drive.google.com/open?id=FILE_ID
        const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
        if (openMatch) {
            return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
        }
        return url;
    };

    const handleLoadImage = () => {
        if (!imageUrlInput) return;
        const directUrl = normalizeImageUrl(imageUrlInput);
        if (directUrl !== imageUrlInput) {
            notify('Google Drive link detected — converting to direct URL automatically ✅');
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImageObj(img);
            const size = Math.min(img.width, img.height);
            const rect = { x: (img.width - size) / 2, y: (img.height - size) / 2, size };
            setCropRect(rect);
            drawCanvas(img, rect);
        };
        img.onerror = () => notify('Failed to load image. Check the URL is publicly accessible.', 'error');
        // Route through our backend proxy to bypass CORS on hosts like ibb.co / Google Drive
        img.src = getProxiedUrl(directUrl);
    };

    const drawCanvas = (img, rect) => {
        if (!canvasRef.current || !img) return;
        const ctx = canvasRef.current.getContext('2d');
        // Clear and draw image scaled to fit canvas max width
        const maxWidth = 400;
        const scale = Math.min(1, maxWidth / img.width);
        canvasRef.current.width = img.width * scale;
        canvasRef.current.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Draw dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Clear crop area
        const scaledRect = { x: rect.x * scale, y: rect.y * scale, size: rect.size * scale };
        ctx.clearRect(scaledRect.x, scaledRect.y, scaledRect.size, scaledRect.size);
        
        // Draw image inside crop area
        ctx.drawImage(img, rect.x, rect.y, rect.size, rect.size, scaledRect.x, scaledRect.y, scaledRect.size, scaledRect.size);
        
        // Draw crop border
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(scaledRect.x, scaledRect.y, scaledRect.size, scaledRect.size);
    };

    const handleCanvasMouseDown = (e) => {
        if (!imageObj) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDragging(true);
        setDragStart({ x, y });
    };

    const handleCanvasMouseMove = (e) => {
        if (!isDragging || !imageObj) return;
        const rectBox = canvasRef.current.getBoundingClientRect();
        const currentX = e.clientX - rectBox.left;
        const currentY = e.clientY - rectBox.top;
        
        const scale = imageObj.width / canvasRef.current.width;
        
        const deltaX = (currentX - dragStart.x) * scale;
        const deltaY = (currentY - dragStart.y) * scale;
        
        let newX = cropRect.x + deltaX;
        let newY = cropRect.y + deltaY;
        
        // Boundaries
        newX = Math.max(0, Math.min(newX, imageObj.width - cropRect.size));
        newY = Math.max(0, Math.min(newY, imageObj.height - cropRect.size));
        
        const newRect = { ...cropRect, x: newX, y: newY };
        setCropRect(newRect);
        setDragStart({ x: currentX, y: currentY });
        drawCanvas(imageObj, newRect);
    };

    const handleCanvasMouseUp = () => setIsDragging(false);

    const applyCrop = () => {
        if (!imageObj || !cropRect) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 150; // Standard badge size
        tempCanvas.height = 150;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(imageObj, cropRect.x, cropRect.y, cropRect.size, cropRect.size, 0, 0, 150, 150);
        
        const base64Image = tempCanvas.toDataURL('image/png');
        setFormData({ ...formData, icon: base64Image });
        notify('Image cropped and applied!');
    };

    // --- Render Logic ---

    const categories = ['All', ...new Set(achievements.map(a => a.category))];
    const filteredAchievements = filterCategory === 'All' ? achievements : achievements.filter(a => a.category === filterCategory);

    if (loading) return <LoadingScreen message="Loading achievements catalog..." />;

    if (editingItem) {
        return (
            <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-1px' }}>
                            {editingItem._id ? 'Edit Achievement' : 'Create New Achievement'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Define how users earn trophies and what they look like.</p>
                    </div>
                    <button className="icon-btn-deck" onClick={() => setEditingItem(null)} style={{ background: 'rgba(255,255,255,0.05)' }}><X size={20}/></button>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Section 1: Basic Information */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '2.5rem', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trophy size={20} color="#818cf8" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>General Information</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Essential identification and reward settings.</p>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Unique Identifier Key
                                </label>
                                <input 
                                    required type="text" className="styled-input" 
                                    placeholder="e.g. streak_100"
                                    value={formData.key} 
                                    onChange={e => setFormData({...formData, key: e.target.value})} 
                                    disabled={!!editingItem._id} 
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>This ID connects the trophy to the backend code.</p>
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Public Display Name
                                </label>
                                <input 
                                    required type="text" className="styled-input" 
                                    placeholder="Enter trophy name..."
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '2rem', marginTop: '2rem' }}>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Category / Group
                                </label>
                                <input 
                                    required type="text" className="styled-input" 
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})} 
                                    placeholder="e.g. Learning, Social..." 
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    XP Bounty Reward
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="number" className="styled-input" 
                                        value={formData.xpReward} 
                                        onChange={e => setFormData({...formData, xpReward: parseInt(e.target.value)})} 
                                        style={{ width: '100%', paddingLeft: '3.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#818cf8', fontSize: '0.75rem' }}>XP</span>
                                </div>
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Status
                                </label>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                    style={{ 
                                        width: '100%', height: '50px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', 
                                        background: formData.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: formData.isActive ? '#4ade80' : '#f87171',
                                        fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer', transition: '0.3s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: formData.isActive ? '#4ade80' : '#f87171', boxShadow: `0 0 10px ${formData.isActive ? '#4ade80' : '#f87171'}` }}></div>
                                    {formData.isActive ? 'LIVE / ACTIVE' : 'DRAFT / HIDDEN'}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Trophy Lore & Description
                            </label>
                            <textarea 
                                className="styled-input" rows="3" 
                                placeholder="Write a catchy description for this achievement..."
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                style={{ width: '100%', resize: 'none', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.2rem' }}
                            ></textarea>
                        </div>
                    </div>

                    {/* Section 2: Criteria Logic */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '2.5rem', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Filter size={20} color="#4ade80" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Earning Rules</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Define the milestone required to unlock this badge.</p>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Criteria Trigger
                                </label>
                                <select 
                                    className="styled-input" 
                                    value={formData.criteria?.type || 'xp'} 
                                    onChange={e => setFormData({...formData, criteria: { ...formData.criteria, type: e.target.value }})}
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    {criteriaTypes.map(type => <option key={type} value={type} style={{ background: '#0f172a' }}>{type.replace(/_/g, ' ').toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Required Value Target
                                </label>
                                <input 
                                    type="number" className="styled-input" 
                                    value={formData.criteria?.value || 0} 
                                    onChange={e => setFormData({...formData, criteria: { ...formData.criteria, value: parseInt(e.target.value) }})} 
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Visuals & Icons */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '2.5rem', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ImageIcon size={20} color="#f472b6" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Visual Identity</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose between a classic emoji or a custom high-res badge.</p>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '20px' }}>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, iconType: 'emoji'})} 
                                style={{ 
                                    flex: 1, height: '50px', borderRadius: '16px', border: 'none',
                                    background: formData.iconType === 'emoji' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: formData.iconType === 'emoji' ? 'white' : 'var(--text-muted)',
                                    fontWeight: '800', cursor: 'pointer', transition: '0.3s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                                }}
                            >
                                <Smile size={18} /> EMOJI MODE
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, iconType: 'image'})} 
                                style={{ 
                                    flex: 1, height: '50px', borderRadius: '16px', border: 'none',
                                    background: formData.iconType === 'image' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: formData.iconType === 'image' ? 'white' : 'var(--text-muted)',
                                    fontWeight: '800', cursor: 'pointer', transition: '0.3s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                                }}
                            >
                                <ImageIcon size={18} /> PRO BADGE MODE
                            </button>
                        </div>

                        {formData.iconType === 'emoji' ? (
                            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>PREVIEW</label>
                                <input 
                                    type="text" className="input-field" 
                                    value={formData.icon} 
                                    onChange={e => setFormData({...formData, icon: e.target.value})} 
                                    style={{ fontSize: '4rem', width: '120px', height: '120px', textAlign: 'center', padding: 0, borderRadius: '30px' }} 
                                    maxLength={5} 
                                />
                                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paste any emoji above to use it as the badge icon.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input 
                                        type="url" 
                                        className="input-field" 
                                        placeholder="Paste image URL (Google Drive, ImgBB, etc...)" 
                                        value={imageUrlInput} 
                                        onChange={(e) => setImageUrlInput(e.target.value)} 
                                        style={{ flex: 1 }}
                                    />
                                    <button type="button" onClick={handleLoadImage} className="btn-primary" style={{ padding: '0 1.5rem' }}>Load</button>
                                </div>
                                
                                {imageObj && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '20px' }}>
                                        <div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800', marginBottom: '1rem', textTransform: 'uppercase' }}>Crop Adjustment</p>
                                            <canvas 
                                                ref={canvasRef} 
                                                onMouseDown={handleCanvasMouseDown}
                                                onMouseMove={handleCanvasMouseMove}
                                                onMouseUp={handleCanvasMouseUp}
                                                onMouseLeave={handleCanvasMouseUp}
                                                style={{ cursor: isDragging ? 'grabbing' : 'grab', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '100%', height: 'auto', maxWidth: '400px' }}
                                            />
                                            <button type="button" onClick={applyCrop} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>Apply Crop</button>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800', marginBottom: '1rem', textTransform: 'uppercase' }}>Final Preview</p>
                                            {formData.icon && formData.icon.startsWith('data:image') ? (
                                                <div style={{ width: '150px', height: '150px', borderRadius: '30px', overflow: 'hidden', border: '3px solid var(--primary)', boxShadow: '0 0 30px rgba(99,102,241,0.3)', background: 'rgba(255,255,255,0.05)' }}>
                                                    <img src={formData.icon} alt="cropped" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ) : (
                                                <div style={{ width: '150px', height: '150px', borderRadius: '30px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Image</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setEditingItem(null)} style={{ padding: '1rem 2rem' }}>Discard Changes</button>
                        <button type="submit" className="btn-primary" style={{ padding: '1rem 3rem', background: 'linear-gradient(135deg, #6366f1, #ec4899)', border: 'none', fontWeight: '900' }}>
                            <Save size={20} /> {editingItem._id ? 'Update Trophy' : 'Launch Achievement'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Trophy Catalog</h2>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--primary)' }}>{achievements.length} Total</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: 'auto' }}>
                        <Filter size={16} color="var(--text-muted)" />
                        <select 
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            {categories.map(cat => <option key={cat} value={cat} style={{ background: '#0f172a' }}>{cat}</option>)}
                        </select>
                    </div>
                    <button className="btn-secondary" onClick={async () => {
                        if (!window.confirm('This will seed the default achievement catalog. Continue?')) return;
                        try {
                            setLoading(true);
                            await api.post('/admin/achievements/seed');
                            notify('Achievements seeded successfully');
                            fetchAchievements();
                        } catch (err) {
                            notify('Error seeding achievements', 'error');
                        } finally {
                            setLoading(false);
                        }
                    }}>
                        <RefreshCw size={18} /> Seed Default
                    </button>
                    <button className="btn-primary" onClick={() => {
                        setFormData({ 
                            key: '', name: '', description: '', 
                            category: filterCategory !== 'All' ? filterCategory : 'Uncategorized', 
                            iconType: 'emoji', icon: '', xpReward: 0, isActive: true,
                            criteria: { type: 'xp', value: 0 }
                        });
                        setImageUrlInput('');
                        setImageObj(null);
                        setEditingItem({});
                    }}>
                        <Plus size={18} /> New Achievement
                    </button>
                </div>
            </div>

            {/* List Grouped by Category */}
            {categories.filter(c => filterCategory === 'All' || c === filterCategory).map(category => {
                const items = achievements.filter(a => a.category === category);
                if (items.length === 0) return null;

                return (
                    <div key={category} style={{ marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {category}
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {items.map(item => (
                                <div key={item._id} className="glass" style={{ padding: '1.5rem', borderRadius: '20px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                                        <button className="icon-btn-deck" style={{ width: '32px', height: '32px', padding: 0 }} onClick={() => {
                                            setFormData({
                                                key: item.key, name: item.name, description: item.description, 
                                                category: item.category || 'Uncategorized', iconType: item.iconType || 'emoji', 
                                                icon: item.icon, xpReward: item.xpReward, isActive: item.isActive,
                                                criteria: item.criteria || { type: 'xp', value: 0 }
                                            });
                                            setImageObj(null);
                                            setImageUrlInput('');
                                            setEditingItem(item);
                                        }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="icon-btn-deck" style={{ width: '32px', height: '32px', padding: 0, color: '#ef4444' }} onClick={() => handleDelete(item._id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    
                                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '3rem', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                        {item.iconType === 'image' ? (
                                            <img
                                                src={item.icon.startsWith('data:') ? item.icon : getProxiedUrl(item.icon)}
                                                alt={item.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            item.icon || '🏆'
                                        )}
                                    </div>
                                    <h4 style={{ fontWeight: '800', marginBottom: '0.2rem', color: item.isActive ? 'white' : 'gray' }}>{item.name}</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '10px' }}>+{item.xpReward} XP</span>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.description}</p>
                                    <code style={{ fontSize: '0.7rem', color: 'gray', marginTop: '1rem' }}>{item.key}</code>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AdminAchievements;
