import { Library } from 'lucide-react';

const LoadingScreen = ({ message = 'Setting up your space...' }) => {
    return (
        <div style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            gap: '1.5rem'
        }}>
            <div style={{ position: 'relative' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '3px solid rgba(99, 102, 241, 0.1)',
                    borderTopColor: 'var(--primary)',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'var(--primary)'
                }}>
                    <Library size={24} />
                </div>
            </div>
            <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                fontWeight: '600',
                letterSpacing: '0.05em',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
                {message}
            </p>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
