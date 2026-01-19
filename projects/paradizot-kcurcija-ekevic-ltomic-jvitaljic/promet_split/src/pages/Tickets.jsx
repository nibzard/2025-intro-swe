import { useState } from 'react'; // Fixed import
import TicketCard from '../components/TicketCard';

const Tickets = () => {
    const [activeTab, setActiveTab] = useState('active');

    // Mock data
    const tickets = [
        { id: 1, type: '1 Sat', status: 'active' },
        { id: 2, type: '24 Sata', status: 'not_activated' },
        { id: 3, type: '1 Sat', status: 'expired' },
        { id: 4, type: '1 Sat', status: 'expired' },
    ];

    const filteredTickets = tickets.filter(t => {
        if (activeTab === 'active') return t.status === 'active';
        if (activeTab === 'not_activated') return t.status === 'not_activated';
        if (activeTab === 'expired') return t.status === 'expired';
        return true;
    });

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
                            type={ticket.type}
                            status={ticket.status}
                            onActivate={() => alert('Aktivacija...')} // Mock activation
                        />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
                        Nema karata u ovoj kategoriji.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tickets;
