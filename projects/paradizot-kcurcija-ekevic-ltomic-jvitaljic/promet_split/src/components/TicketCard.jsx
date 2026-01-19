import { QrCode, Clock, Calendar } from 'lucide-react';

const TicketCard = ({ type, status, expires, onActivate }) => {
    const isActive = status === 'active';
    const isExpired = status === 'expired';

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            marginBottom: '1rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {isActive && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'var(--color-primary)',
                    color: '#1a1a1a',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.75rem',
                    borderBottomLeftRadius: '0.75rem'
                }}>
                    AKTIVNA
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{type}</h3>
                    <span style={{
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        {status === 'not_activated' && 'Spremna za aktivaciju'}
                        {status === 'active' && 'Istječe za: 45 min'}
                        {status === 'expired' && 'Istekla'}
                    </span>
                </div>
                <div style={{
                    background: 'white',
                    padding: '0.5rem',
                    borderRadius: '0.5rem'
                }}>
                    <QrCode color="#1a1a1a" size={40} />
                </div>
            </div>

            <div style={{
                borderTop: '1px dashed var(--color-border)',
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem'
            }}>
                {isActive || isExpired ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ display: 'flex', items: 'center', gap: '0.25rem' }}><Clock size={14} /> 14:30</span>
                        <span style={{ display: 'flex', items: 'center', gap: '0.25rem' }}><Calendar size={14} /> 12.01.2026</span>
                    </div>
                ) : (
                    <span>Vrijedi 1 sat od aktivacije</span>
                )}

                {status === 'not_activated' && (
                    <button
                        onClick={onActivate}
                        style={{
                            background: 'var(--color-primary)',
                            color: '#1a1a1a',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                        }}
                    >
                        Aktiviraj
                    </button>
                )}
            </div>
        </div>
    );
};

export default TicketCard;
