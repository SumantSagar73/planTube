import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Youtube, Target, PlayCircle, Rocket, Sparkles } from 'lucide-react';

const WelcomeGuide = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Reset to first slide every time the guide opens
    useEffect(() => {
        if (isOpen) setCurrentSlide(0);
    }, [isOpen]);

    const slides = [
        {
            title: "Welcome to PlanTube",
            description: "Transform your YouTube learning experience. We help you stay focused, organized, and disciplined while mastering new skills.",
            icon: <Rocket size={48} color="var(--primary)" />,
            color: "var(--primary)"
        },
        {
            title: "Quick Import",
            description: "Ready to start? Just paste any YouTube playlist or video link in the import bar at the top to create your personal curriculum.",
            icon: <Youtube size={48} color="#ef4444" />,
            color: "#ef4444"
        },
        {
            title: "Master the Calendar",
            description: "Plan your study sessions by scheduling videos to specific days. Use the Daily Agenda on your dashboard to stay on track.",
            icon: <Target size={48} color="#10b981" />,
            color: "#10b981"
        },
        {
            title: "Focus & Progress",
            description: "Enter Focus Mode to study without distractions. Mark chapters as complete and watch your progress bars reach 100%!",
            icon: <Sparkles size={48} color="#f59e0b" />,
            color: "#f59e0b"
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleComplete();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)'
        }}>
            <div className="glass" style={{
                width: '500px',
                maxWidth: '95%',
                padding: '2.5rem',
                background: '#0a0a0f',
                border: '1px solid var(--glass-border)',
                borderRadius: '32px',
                position: 'relative',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <button
                    onClick={handleComplete}
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>

                <div style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'center',
                    animation: 'float 3s ease-in-out infinite'
                }}>
                    <div style={{
                        padding: '1.5rem',
                        borderRadius: '24px',
                        background: `${slides[currentSlide].color}1A`,
                        border: `1px solid ${slides[currentSlide].color}33`,
                    }}>
                        {slides[currentSlide].icon}
                    </div>
                </div>

                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>
                    {slides[currentSlide].title}
                </h2>

                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem', minHeight: '80px' }}>
                    {slides[currentSlide].description}
                </p>

                {/* Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
                    {slides.map((_, i) => (
                        <div key={i} style={{
                            width: currentSlide === i ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '10px',
                            background: currentSlide === i ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            transition: 'all 0.3s'
                        }} />
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {currentSlide > 0 && (
                        <button onClick={prevSlide} className="btn-secondary" style={{ flex: 1, padding: '0.8rem' }}>
                            <ChevronLeft size={20} /> Back
                        </button>
                    )}
                    <button onClick={nextSlide} className="btn-primary" style={{ flex: 2, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                        {currentSlide !== slides.length - 1 && <ChevronRight size={20} />}
                    </button>
                </div>

                <button
                    onClick={handleComplete}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    Skip guide
                </button>
            </div>
        </div>
    );
};

export default WelcomeGuide;
