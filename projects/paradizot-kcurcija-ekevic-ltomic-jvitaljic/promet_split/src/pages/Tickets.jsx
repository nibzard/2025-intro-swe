import { useState } from 'react';
import TicketCard from '../components/TicketCard';
import { useWallet } from '../context/WalletContext';
import { QrCode, X } from 'lucide-react';

const Tickets = () => {
    const { tickets, activateTicket, deactivateTicket } = useWallet();
    const [activeTab, setActiveTab] = useState('active');
    const [expandedQrTicket, setExpandedQrTicket] = useState(null);

    const filteredTickets = tickets.filter(t => {
        if (activeTab === 'active') return t.status === 'active';
        if (activeTab === 'not_activated') return t.status === 'not_activated';
        if (activeTab === 'expired') return t.status === 'expired';
        return true;
    });

    const handleActivate = (ticketId) => {
        // Check if there is already an active ticket
        const hasActive = tickets.some(t => t.status === 'active');
        if (hasActive) {
            alert('Već imate aktivnu kartu! Morate je isključiti ili pričekati da istekne prije aktivacije nove.');
            return;
        }

        if (window.confirm('Jeste li sigurni da želite aktivirati kartu?')) {
            activateTicket(ticketId);
            setActiveTab('active'); // Switch to active tab to see the newly activated ticket
        }
    };

    const handleDeactivate = (ticketId) => {
        if (window.confirm('Jeste li sigurni da želite isključiti kartu? Karta će postati nevažeća.')) {
            deactivateTicket(ticketId);
            // Optionally stick to active tab (ticket disappears) or switch to expired?
            // User likely expects it to disappear from "Active", so staying on Active tab is fine.
        }
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Moje Karte</h1>
            </header>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                background: 'var(--color-surface)',
                padding: '0.25rem',
                borderRadius: '1rem',
                marginBottom: '2rem'
            }}>
                {['not_activated', 'active', 'expired'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            background: activeTab === tab ? 'var(--color-surface-hover)' : 'transparent',
                            color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text-muted)',
                            fontWeight: activeTab === tab ? 600 : 500,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'not_activated' && 'Nekorištene'}
                        {tab === 'active' && 'Aktivne'}
                        {tab === 'expired' && 'Istekle'}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="fade-in">
                {filteredTickets.length > 0 ? (
                    filteredTickets.map(ticket => (
                        <TicketCard
                            key={ticket.id}
                            type={ticket.name || ticket.type}
                            status={ticket.status}
                            expires={ticket.expiresAt}
                            onActivate={() => handleActivate(ticket.id)}
                            onDeactivate={() => handleDeactivate(ticket.id)}
                            onQrClick={() => setExpandedQrTicket(ticket)}
                        />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
                        Nema karata u ovoj kategoriji.
                    </div>
                )}
            </div>

            {/* QR Zoom Modal */}
            {expandedQrTicket && (
                <div
                    onClick={() => setExpandedQrTicket(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 300,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem'
                    }}
                >
                    <div
                        className="scale-in"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.5rem',
                            maxWidth: '90%',
                            width: '350px'
                        }}
                    >
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setExpandedQrTicket(null)}
                                style={{
                                    background: '#f3f4f6',
                                    border: 'none',
                                    borderRadius: '50%',
                                    padding: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <X color="#1a1a1a" size={24} />
                            </button>
                        </div>

                        <div style={{
                            width: '200px',
                            height: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <QrCode color="#1a1a1a" size={200} />
                        </div>

                        <div style={{ textAlign: 'center', color: '#1a1a1a' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                {expandedQrTicket.name || expandedQrTicket.type}
                            </h3>
                            <p style={{ opacity: 0.6 }}>
                                Pokažite ovaj kod kontroloru
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
