
import { useState } from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, playlistTitle }) => {
    const [confirmText, setConfirmText] = useState('');
    const targetText = "focus delete";

    const handleConfirm = () => {
        if (confirmText === targetText) {
            onConfirm();
            setConfirmText('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Playlist?">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <AlertTriangle style={{ color: 'var(--danger)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.9rem', color: '#fca5a5' }}>
                        This is a destructive action. The playlist <strong>"{playlistTitle}"</strong> and all its tracked progress will be permanently removed.
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Type <strong style={{ color: 'var(--text-main)' }}>{targetText}</strong> to confirm:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="input-glass"
                        placeholder={targetText}
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={confirmText !== targetText}
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600',
                            background: confirmText === targetText ? 'var(--danger)' : 'rgba(255,255,255,0.05)',
                            color: confirmText === targetText ? 'white' : 'rgba(255,255,255,0.2)',
                            cursor: confirmText === targetText ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s'
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmation;
