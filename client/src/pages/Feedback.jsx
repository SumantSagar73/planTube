import { useEffect, useState } from 'react';
import { MessageSquare, Send, CircleHelp } from 'lucide-react';
import feedbackService from '../services/feedbackService';
import { useAuth } from '../context/AuthContext';

const categoryOptions = [
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'ux', label: 'UX/UI Issue' },
    { value: 'performance', label: 'Performance' },
    { value: 'other', label: 'Other' }
];

const impactOptions = [
    { value: 'blocking', label: 'Blocks me' },
    { value: 'annoying', label: 'Annoying but workable' },
    { value: 'nice_to_have', label: 'Nice to have' }
];

const Feedback = () => {
    const { user } = useAuth();
    const [category, setCategory] = useState('bug');
    const [impact, setImpact] = useState('annoying');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [contactAllowed, setContactAllowed] = useState(true);
    const [contactEmail, setContactEmail] = useState(user?.email || '');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [myItems, setMyItems] = useState([]);
    const [loadingMine, setLoadingMine] = useState(true);

    const loadMine = async () => {
        setLoadingMine(true);
        try {
            const res = await feedbackService.getMyFeedback({ limit: 8, page: 1 });
            setMyItems(res.items || []);
        } catch (err) {
            console.error('Load my feedback failed:', err);
        } finally {
            setLoadingMine(false);
        }
    };

    useEffect(() => {
        loadMine();
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setSubmitting(true);
        setSuccessMsg('');
        try {
            await feedbackService.submitFeedback({
                category,
                impact,
                subject: subject.trim(),
                message: message.trim(),
                pagePath: window.location.pathname,
                contactAllowed,
                contactEmail: contactAllowed ? contactEmail.trim() : '',
                metadata: {
                    userAgent: navigator.userAgent,
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    language: navigator.language,
                    platform: navigator.platform,
                    submittedFrom: 'feedback_page'
                }
            });

            setSuccessMsg('Feedback submitted. Thank you for helping improve PlanTube.');
            setSubject('');
            setMessage('');
            setCategory('bug');
            setImpact('annoying');
            await loadMine();
        } catch (err) {
            console.error('Feedback submit failed:', err);
            setSuccessMsg(err?.response?.data?.msg || 'Could not submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
            <div className="glass" style={{ padding: '1.2rem', borderRadius: '20px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <MessageSquare size={24} /> Feedback
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Report bugs, suggest features, and tell us what feels frustrating.
                </p>
            </div>

            <form onSubmit={submit} className="glass" style={{ padding: '1.2rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }} className="admin-filters-grid-two">
                    <div>
                        <label className="input-label">Category</label>
                        <select className="styled-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                            {categoryOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Impact</label>
                        <select className="styled-input" value={impact} onChange={(e) => setImpact(e.target.value)}>
                            {impactOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="input-label">Subject</label>
                    <input
                        className="styled-input"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        maxLength={140}
                        placeholder="Short summary of your feedback"
                        required
                    />
                </div>

                <div>
                    <label className="input-label">Details</label>
                    <textarea
                        className="styled-input"
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={5000}
                        placeholder="What happened, what you expected, and any steps to reproduce."
                        required
                    />
                </div>

                <div className="glass" style={{ padding: '0.75rem', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', fontWeight: 700 }}>
                        <input type="checkbox" checked={contactAllowed} onChange={(e) => setContactAllowed(e.target.checked)} />
                        Allow team to contact me about this feedback
                    </label>
                    {contactAllowed && (
                        <input
                            className="styled-input"
                            style={{ marginTop: '0.6rem' }}
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="Email for follow-up"
                        />
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CircleHelp size={14} /> We auto-include route and device details to help debugging.
                    </div>
                    <button className="btn-primary" type="submit" disabled={submitting}>
                        <Send size={14} style={{ marginRight: 6 }} /> {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </div>

                {successMsg && (
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '12px', padding: '0.65rem 0.75rem' }}>
                        {successMsg}
                    </div>
                )}
            </form>

            <div className="glass" style={{ padding: '1.1rem', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.6rem' }}>My Recent Feedback</h3>
                {loadingMine ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
                ) : myItems.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No feedback submitted yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                        {myItems.map((item) => (
                            <div key={item._id} style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <strong>{item.subject}</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.status}</span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '0.25rem' }}>{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feedback;
