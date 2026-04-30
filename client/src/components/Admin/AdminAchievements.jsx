import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Smile, Trophy, Filter } from 'lucide-react';
import LoadingScreen from '../Shared/LoadingScreen';

const AdminAchievements = ({ notify }) => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null); // null = list view, {} = new, {id} = edit
    const [filterCategory, setFilterCategory] = useState('All');

    // Form state
    const [formData, setFormData] = useState({
        key: '', name: '', description: '', category: 'Uncategorized', 
        iconType: 'emoji', icon: '', xpReward: 0, isActive: true
    });

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
    const handleLoadImage = () => {
        if (!imageUrlInput) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImageObj(img);
            // Default crop to a square in the center
            const size = Math.min(img.width, img.height);
            setCropRect({
                x: (img.width - size) / 2,
                y: (img.height - size) / 2,
                size: size
            });
            drawCanvas(img, { x: (img.width - size) / 2, y: (img.height - size) / 2, size });
        };
        img.onerror = () => notify('Failed to load image from URL. It may have CORS protections.', 'error');
        img.src = imageUrlInput;
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
            <div className="glass" style={{ padding: '2rem', borderRadius: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>{editingItem._id ? 'Edit Achievement' : 'Create New Achievement'}</h2>
                    <button className="icon-btn-deck" onClick={() => setEditingItem(null)}><X size={20}/></button>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Unique Key (e.g. streak_100)</label>
                            <input required type="text" className="input-field" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} disabled={!!editingItem._id} />
                        </div>
                        <div style={{ flex: '1 1 300px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Display Name</label>
                            <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Category</label>
                            <input required type="text" className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. XP Milestones, Social..." />
                        </div>
                        <div style={{ flex: '1 1 150px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>XP Reward</label>
                            <input type="number" className="input-field" value={formData.xpReward} onChange={e => setFormData({...formData, xpReward: parseInt(e.target.value)})} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Description (Purpose and how to earn)</label>
                        <textarea className="input-field" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>

                    {/* Icon Section */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Badge Icon Configuration</h3>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button type="button" onClick={() => setFormData({...formData, iconType: 'emoji'})} className={`btn-secondary ${formData.iconType === 'emoji' ? 'active' : ''}`} style={{ borderColor: formData.iconType === 'emoji' ? 'var(--primary)' : '' }}>
                                <Smile size={18} /> Use Emoji
                            </button>
                            <button type="button" onClick={() => setFormData({...formData, iconType: 'image'})} className={`btn-secondary ${formData.iconType === 'image' ? 'active' : ''}`} style={{ borderColor: formData.iconType === 'image' ? 'var(--primary)' : '' }}>
                                <ImageIcon size={18} /> Use Custom Image
                            </button>
                        </div>

                        {formData.iconType === 'emoji' ? (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Paste an Emoji</label>
                                <input type="text" className="input-field" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} style={{ fontSize: '2rem', width: '100px', textAlign: 'center' }} maxLength={5} />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="url" 
                                        className="input-field" 
                                        placeholder="Paste image URL here to load and crop..." 
                                        value={imageUrlInput} 
                                        onChange={(e) => setImageUrlInput(e.target.value)} 
                                        style={{ flex: 1 }}
                                    />
                                    <button type="button" onClick={handleLoadImage} className="btn-secondary">Load Image</button>
                                </div>
                                
                                {imageObj && (
                                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                                        <div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Drag the box to crop. The cropped area will be used as the badge.</p>
                                            <canvas 
                                                ref={canvasRef} 
                                                onMouseDown={handleCanvasMouseDown}
                                                onMouseMove={handleCanvasMouseMove}
                                                onMouseUp={handleCanvasMouseUp}
                                                onMouseLeave={handleCanvasMouseUp}
                                                style={{ cursor: isDragging ? 'grabbing' : 'grab', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            />
                                            <div style={{ marginTop: '1rem' }}>
                                                <button type="button" onClick={applyCrop} className="btn-primary" style={{ width: '100%' }}>Crop & Apply</button>
                                            </div>
                                        </div>
                                        {formData.icon && formData.icon.startsWith('data:image') && (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Final Badge Preview</p>
                                                <div style={{ width: '150px', height: '150px', borderRadius: '24px', overflow: 'hidden', border: '2px solid var(--primary)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
                                                    <img src={formData.icon} alt="cropped" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                        <button type="submit" className="btn-primary"><Save size={18}/> Save Achievement</button>
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
                    <button className="btn-primary" onClick={() => {
                        setFormData({ key: '', name: '', description: '', category: filterCategory !== 'All' ? filterCategory : 'Uncategorized', iconType: 'emoji', icon: '', xpReward: 0, isActive: true });
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
                                                icon: item.icon, xpReward: item.xpReward, isActive: item.isActive
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
                                        {item.iconType === 'image' && item.icon.startsWith('http') ? (
                                            <img src={item.icon} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : item.iconType === 'image' && item.icon.startsWith('data:image') ? (
                                            <img src={item.icon} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
