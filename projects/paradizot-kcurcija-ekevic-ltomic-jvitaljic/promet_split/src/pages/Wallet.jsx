import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { CreditCard, Wallet as WalletIcon, X, Check } from 'lucide-react';

const Wallet = () => {
    const { balance, addToBalance, buyTicket } = useWallet();
    const [showTopUp, setShowTopUp] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(10);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('google');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [purchaseProcessing, setPurchaseProcessing] = useState(false);
    const [processing, setProcessing] = useState(false);

    const TICKETS = [
        { id: 1, name: '1. Zona (Split)', type: '1. Zona', price: 1.00, duration: '1 Sat' },
        { id: 2, name: '2. Zona (Solin, Klis, Podstrana)', type: '2. Zona', price: 1.50, duration: '1 Sat' },
        { id: 3, name: '3. Zona (Kaštela, Dugopolje, Dugi Rat)', type: '3. Zona', price: 2.00, duration: '1 Sat' },
        { id: 4, name: '4. Zona (Trogir, Omiš)', type: '4. Zona', price: 2.50, duration: '1 Sat' },
    ];

    const handleTopUp = () => {
        setProcessing(true);
        setTimeout(() => {
            addToBalance(selectedAmount);
            setProcessing(false);
            setShowTopUp(false);
        }, 1500);
    };

    const handleBuyTicket = () => {
        if (!selectedTicket) return;

        if (balance < selectedTicket.price) {
            alert('Nedovoljno sredstava na računu! Molimo nadoplatite račun.');
            return;
        }

        setPurchaseProcessing(true);
        setTimeout(() => {
            buyTicket(selectedTicket);
            setPurchaseProcessing(false);
            setSelectedTicket(null);
        }, 1000);
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Novčanik</h1>
            </header>

            {/* Balance Card */}
            <div style={{
                background: 'linear-gradient(135deg, var(--color-primary), #f59e0b)',
                borderRadius: '1.5rem',
                padding: '2rem',
                color: '#1a1a1a',
                marginBottom: '2.5rem',
                boxShadow: '0 20px 25px -5px rgba(251, 191, 36, 0.3), 0 10px 10px -5px rgba(251, 191, 36, 0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stanje računa</span>
                    <div style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0', letterSpacing: '-0.02em' }}>
                        {balance.toFixed(2)} €
                    </div>
                </div>
                <button
                    onClick={() => setShowTopUp(true)}
                    style={{
                        background: '#1a1a1a',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '1rem',
                        fontWeight: 600,
                        marginTop: '1.5rem',
                        width: '100%',
                        fontSize: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                    + Nadoplati sredstva
                </button>

                {/* Abstract Shapes/Texture */}
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', zIndex: 0 }}></div>
            </div>

            {/* Quick Actions (Tickets mock) */}
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Brza kupnja</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {TICKETS.map((ticket) => (
                    <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        style={{
                            background: 'var(--color-surface)',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }}
                    >
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{ticket.name}</div>
                        <div style={{ color: 'var(--color-primary)' }}>{ticket.price.toFixed(2)} €</div>
                    </button>
                ))}
            </div>

            {/* Top Up Modal */}
            {showTopUp && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end'
                }}>
                    <div
                        className="fade-in"
                        style={{
                            background: 'var(--color-surface)',
                            borderTopLeftRadius: '2rem',
                            borderTopRightRadius: '2rem',
                            padding: '2rem',
                            borderTop: '1px solid var(--color-border)',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>Nadoplata</h2>
                            <button onClick={() => setShowTopUp(false)} style={{ padding: '0.5rem', background: 'var(--color-surface-hover)', borderRadius: '50%' }}>
                                <X size={20} color="var(--color-text)" />
                            </button>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Odaberite iznos:</p>
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {[5, 10, 20, 50].map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setSelectedAmount(amt)}
                                        style={{
                                            flex: 1,
                                            minWidth: '80px',
                                            padding: '1rem',
                                            borderRadius: '1rem',
                                            background: selectedAmount === amt ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                                            color: selectedAmount === amt ? '#1a1a1a' : 'var(--color-text)',
                                            fontWeight: 600,
                                            border: '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {amt} €
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Način plaćanja:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <PaymentMethodButton
                                    icon="G"
                                    label="Google Pay"
                                    selected={selectedPaymentMethod === 'google'}
                                    onClick={() => setSelectedPaymentMethod('google')}
                                />
                                <PaymentMethodButton
                                    icon=""
                                    label="Apple Pay"
                                    selected={selectedPaymentMethod === 'apple'}
                                    onClick={() => setSelectedPaymentMethod('apple')}
                                />
                                <PaymentMethodButton
                                    icon="P"
                                    label="PayPal"
                                    selected={selectedPaymentMethod === 'paypal'}
                                    onClick={() => setSelectedPaymentMethod('paypal')}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleTopUp}
                            disabled={processing}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '1rem',
                                background: processing ? 'var(--color-surface-hover)' : 'var(--color-primary)',
                                color: processing ? 'var(--color-text-muted)' : '#1a1a1a',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                opacity: processing ? 0.7 : 1
                            }}
                        >
                            {processing ? 'Obrada...' : `Plati ${selectedAmount.toFixed(2)} €`}
                        </button>
                    </div>
                </div>
            )}

            {/* Ticket Purchase Confirmation Modal */}
            {selectedTicket && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div
                        className="scale-in"
                        style={{
                            background: 'var(--color-surface)',
                            borderRadius: '1.5rem',
                            padding: '2rem',
                            width: '100%',
                            maxWidth: '320px',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>Potvrda kupnje</h3>

                        <div style={{
                            background: 'var(--color-bg)',
                            padding: '1rem',
                            borderRadius: '1rem',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{selectedTicket.name}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{selectedTicket.price.toFixed(2)} €</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{selectedTicket.duration}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    background: 'var(--color-surface-hover)',
                                    color: 'var(--color-text)',
                                    fontWeight: 600,
                                    border: 'none'
                                }}
                            >
                                Odustani
                            </button>
                            <button
                                onClick={handleBuyTicket}
                                disabled={purchaseProcessing}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    background: purchaseProcessing ? 'var(--color-surface-hover)' : 'var(--color-primary)',
                                    color: purchaseProcessing ? 'var(--color-text-muted)' : '#1a1a1a',
                                    fontWeight: 600,
                                    border: 'none',
                                    opacity: purchaseProcessing ? 0.7 : 1
                                }}
                            >
                                {purchaseProcessing ? '...' : 'Potvrdi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PaymentMethodButton = ({ icon, label, selected, onClick }) => (
    <button
        onClick={onClick}
        style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '0.75rem',
            background: 'var(--color-bg)',
            border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: 'var(--color-text)',
            fontWeight: 500,
            justifyContent: 'flex-start',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}>
        <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '0.5rem',
            background: 'var(--color-surface-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 700
        }}>
            {icon}
        </div>
        <span>{label}</span>
        {selected && <Check size={20} color="var(--color-primary)" style={{ marginLeft: 'auto' }} />}
    </button>
);

export default Wallet;

