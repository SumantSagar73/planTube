import Modal from './Modal';
import { CheckCircle, XCircle } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title, message, success = false }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '1rem',
                    borderRadius: '50%',
                    background: success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    marginBottom: '1rem'
                }}>
                    {success ? (
                        <CheckCircle size={32} color="var(--success)" />
                    ) : (
                        <XCircle size={32} color="var(--danger)" />
                    )}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', background: success ? 'var(--success)' : 'var(--primary)' }}
                >
                    {success ? 'Awesome!' : 'Got it'}
                </button>
            </div>
        </Modal>
    );
};

export default AlertModal;
