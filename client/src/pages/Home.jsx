import { Link } from 'react-router-dom';
import { Play, Users, Target, Rocket, ChevronRight, Zap, Shield, Sparkles } from 'lucide-react';

const Home = () => {
    return (
        <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'white' }}>
            {/* Hero Section */}
            <section style={{
                padding: '8rem 5vw 6rem',
                textAlign: 'center',
                background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: '#ec4899', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%' }}></div>

                <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '100px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        marginBottom: '2rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--primary)'
                    }}>
                        <Sparkles size={16} />
                        <span>The Ultimate Study Companion</span>
                    </div>

                    <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: '900', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
                        Master Your Learning <br />
                        <span style={{
                            color: 'var(--primary)'
                        }}>Without Distractions</span>
                    </h1>

                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '650px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                        Transform YouTube into an organized classroom. Plan your study sessions, track progress with friends, and stay focused with AI-powered scheduling.
                    </p>

                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/login" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span>Get Started for Free</span>
                            <ChevronRight size={20} />
                        </Link>
                        <Link to="/groups" className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Users size={20} />
                            <span>Join a Study Group</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section style={{ padding: '6rem 5vw', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Smarter Learning, Better Results</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Everything you need to finish that course you started months ago.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <Zap size={28} color="var(--primary)" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem' }}>Smart Import</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Instantly turn any YouTube playlist into an interactive course with duration tracking and progress bars.</p>
                    </div>

                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <Users size={28} color="#ec4899" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem' }}>Social Accountability</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Join groups using codes and track progress with friends. See who's ahead and stay motivated together.</p>
                    </div>

                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <Target size={28} color="#10b981" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem' }}>Guest Mode</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Privacy first. Track your progress locally in your browser without ever creating an account.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '6rem 5vw' }}>
                <div className="glass" style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    padding: '4rem',
                    borderRadius: '48px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                    border: '1px solid var(--glass-border)'
                }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Ready to Crush Your Goals?</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                        Join thousands of learners who use PlanTube to stay organized and disciplined.
                    </p>
                    <Link to="/signup" className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '16px' }}>
                        Create My Free Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 5vw', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', borderTop: '1px solid var(--glass-border)' }}>
                <p>© {new Date().getFullYear()} PlanTube. Built for focused learners.</p>
            </footer>
        </div>
    );
};

export default Home;
