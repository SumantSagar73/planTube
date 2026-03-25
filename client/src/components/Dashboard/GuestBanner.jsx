import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const GuestBanner = () => (
    <div className="glass" style={{
        marginBottom: '1rem',
        padding: '1.25rem 2rem',
        borderRadius: '24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="var(--primary)" />
            </div>
            <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>You're in Guest Mode</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your progress is saved locally. Sign up to sync across devices!</p>
            </div>
        </div>
        <Link to="/signup" className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
            Create Account
        </Link>
    </div>
);

export default GuestBanner;
