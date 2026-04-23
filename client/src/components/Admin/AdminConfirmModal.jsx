import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const AdminConfirmModal = ({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    requirePhrase,
    danger = false,
    onConfirm,
    onCancel
}) => {
    const [inputValue, setInputValue] = useState('');

    const canConfirm = useMemo(() => {
        if (!requirePhrase) return true;
        return inputValue.trim() === requirePhrase;
    }, [inputValue, requirePhrase]);

    if (!open) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 12000,
            padding: '1rem'
        }} role="dialog" aria-modal="true" aria-label={title}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '20px',
                border: `1px solid ${danger ? 'rgba(239,68,68,0.4)' : 'var(--glass-border)'}`,
                background: 'rgba(15, 23, 42, 0.95)',
                padding: '1.4rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <AlertTriangle size={18} color={danger ? '#ef4444' : '#f59e0b'} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>{title}</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>{message}</p>

                {requirePhrase && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Type <strong style={{ color: 'white' }}>{requirePhrase}</strong> to continue
                        </label>
                        <input
                            className="styled-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={requirePhrase}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
                    <button className="btn-secondary" onClick={onCancel}>{cancelLabel}</button>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setInputValue('');
                            onConfirm();
                        }}
                        disabled={!canConfirm}
                        style={{
                            background: danger ? '#ef4444' : undefined,
                            cursor: canConfirm ? 'pointer' : 'not-allowed',
                            opacity: canConfirm ? 1 : 0.6
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminConfirmModal;
