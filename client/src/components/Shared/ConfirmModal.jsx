import { useState } from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, confirmText, danger = false }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: `1px solid ${danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'}` }}>
                    <AlertTriangle style={{ color: danger ? 'var(--danger)' : 'var(--primary)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.9rem', color: danger ? '#fca5a5' : 'var(--text-main)', lineHeight: '1.5' }}>
                        {description}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600',
                            background: danger ? 'var(--danger)' : 'var(--primary)',
                            color: 'white', border: 'none', cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: danger ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        {confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
