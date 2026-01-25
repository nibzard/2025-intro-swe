import { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [balance, setBalance] = useState(0);
    const [tickets, setTickets] = useState([]);

    const addToBalance = (amount) => {
        setBalance((prev) => prev + amount);
    };

    const subtractFromBalance = (amount) => {
        setBalance((prev) => prev - amount);
    };

    const buyTicket = (ticketTemplate) => {
        const newTicket = {
            ...ticketTemplate,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Ensure uniqueness even if fast
            status: 'not_activated',
            purchasedAt: new Date().toISOString(),
        };
        setTickets((prev) => [newTicket, ...prev]);
        subtractFromBalance(ticketTemplate.price);
    };

    const activateTicket = (ticketId) => {
        setTickets((prev) => {
            // Check if any ticket is already active
            const hasActive = prev.some(t => t.status === 'active');
            if (hasActive) {
                // If checking here, we can't easily alert the user without returning status.
                // However, the prompt asked to "correct the code so user cannot have more than one active".
                // We'll enforce it here, preventing the state update for the target ticket if one exists.
                // But this fails silently from UI perspective if we don't handle it in UI. 
                // Let's assume we handle the alert in UI, but this is a safety guard.
                // Actually, let's just implement the logic to NOT activate if hasActive is true? 
                // But the map below is the update logic.
                // We can't nicely return early from setTickets update function to cancel completely 
                // (returning 'prev' works but consumes the update).
                return prev;
            }

            return prev.map(ticket => {
                if (ticket.id === ticketId) {
                    // Start activation...
                    // Double check (redundant but safe) logic inside map not needed if we return prev above.

                    // Parse duration...
                    let durationMinutes = 60;
                    if (ticket.type === '24 Sata') durationMinutes = 1440;

                    const now = new Date();
                    const expiresAt = new Date(now.getTime() + durationMinutes * 60000);

                    return {
                        ...ticket,
                        status: 'active',
                        activatedAt: now.toISOString(),
                        expiresAt: expiresAt.toISOString()
                    };
                }
                return ticket;
            });
        });
    };

    const deactivateTicket = (ticketId) => {
        setTickets((prev) => prev.map(ticket => {
            if (ticket.id === ticketId) {
                return { ...ticket, status: 'expired' };
            }
            return ticket;
        }));
    };

    // Check for expired tickets
    useEffect(() => {
        const interval = setInterval(() => {
            setTickets((prev) => prev.map(ticket => {
                if (ticket.status === 'active' && ticket.expiresAt) {
                    if (new Date() > new Date(ticket.expiresAt)) {
                        return { ...ticket, status: 'expired' };
                    }
                }
                return ticket;
            }));
        }, 1000); // Check every second for immediate feedback in demo

        return () => clearInterval(interval);
    }, []);

    return (
        <WalletContext.Provider value={{ balance, tickets, addToBalance, subtractFromBalance, buyTicket, activateTicket, deactivateTicket }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
