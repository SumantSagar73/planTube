import React from 'react';
import { Search, Eye, Shield, ShieldAlert, Trash2, Mail, Hash } from 'lucide-react';

const AdminUsers = ({ users, searchTerm, setSearchTerm, handleImpersonate, handleRoleToggle, handleDeleteUser, onViewDetails }) => {
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>User Registry</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Found {filteredUsers.length} total users</p>
                </div>
                
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input 
                        type="text" 
                        placeholder="Search name, email, or username..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            padding: '0.8rem 1rem 0.8rem 2.8rem', 
                            borderRadius: '16px', 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            width: '400px',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Identity</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Activity</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Joined</th>
                            <th style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: u.role === 'admin' ? '#818cf8' : '#94a3b8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '800'
                                        }}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '700', fontSize: '1rem' }}>{u.name}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} /> {u.email}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{u.playlistCount || 0}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Playlists</div>
                                        </div>
                                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{u.groupCount || 0}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Groups</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button 
                                            onClick={() => onViewDetails(u._id)}
                                            className="icon-btn" 
                                            title="View Full Identity Details"
                                            style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
                                        >
                                            <Hash size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleImpersonate(u)}
                                            className="icon-btn" 
                                            title="Shadow View"
                                            style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleRoleToggle(u)}
                                            className="icon-btn" 
                                            title={u.role === 'admin' ? 'Revoke Admin' : 'Assign Admin'}
                                            style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }}
                                        >
                                            {u.role === 'admin' ? <ShieldAlert size={16} /> : <Shield size={16} />}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(u._id)}
                                            className="icon-btn" 
                                            title="Purge User Record"
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
