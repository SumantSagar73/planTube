import React from 'react';
import { AlertTriangle, Wrench, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MaintenanceScreen = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            color: 'var(--text-main)',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <div className="glass" style={{
                padding: '4rem',
                borderRadius: '40px',
                maxWidth: '600px',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '300px',
                    height: '300px',
                    background: '#ef4444',
                    filter: 'blur(150px)',
                    opacity: 0.1,
                    zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '2rem',
                        animation: 'pulseGlow 2s infinite'
                    }}>
                        <Wrench size={48} color="#ef4444" />
                    </div>

                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: '950',
                        marginBottom: '1rem',
                        letterSpacing: '-1px',
                        color: '#ef4444'
                    }}>
                        Platform Maintenance
                    </h1>
                    
                    <p style={{
                        fontSize: '1.2rem',
                        color: 'var(--text-muted)',
                        lineHeight: '1.6',
                        marginBottom: '3rem'
                    }}>
                        PlanTube is currently undergoing scheduled upgrades and infrastructure improvements. 
                        We will be back online shortly. Thank you for your patience!
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="btn-primary"
                            style={{ padding: '1rem 2rem', fontSize: '1rem' }}
                        >
                            Refresh Status
                        </button>
                    </div>

                    {/* Admin backdoor access hint */}
                    <div 
                        style={{ marginTop: '3rem', cursor: 'pointer', opacity: 0.3, transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => navigate('/login')}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.3}
                    >
                        <Shield size={14} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Access</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceScreen;
