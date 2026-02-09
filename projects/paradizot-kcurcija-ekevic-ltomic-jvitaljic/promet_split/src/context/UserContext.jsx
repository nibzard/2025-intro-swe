import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // Initialize state from localStorage if available
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user_data');
        return saved ? JSON.parse(saved) : {
            name: 'Ivan Horvat',
            email: 'ivan.horvat@email.com',
            balance: 15.50
        };
    });

    const [notificationSettings, setNotificationSettings] = useState(() => {
        const saved = localStorage.getItem('user_notification_settings');
        return saved ? JSON.parse(saved) : {
            transactions: true,
            tickets: true,
            promotions: false,
            sound: true
        };
    });

    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('user_transactions');
        return saved ? JSON.parse(saved) : [];
    });

    const [tickets, setTickets] = useState(() => {
        const saved = localStorage.getItem('user_tickets');
        return saved ? JSON.parse(saved) : [
            // Initial mock tickets can go here if needed, or start empty?
            // Let's keep the mock ones from Tickets.jsx roughly or just start empty/new.
            // For now let's pre-populate with some "old" ones to show it works
            { id: 1, type: '1 Sat', status: 'active', purchaseDate: new Date().toISOString() },
            { id: 2, type: '24 Sata', status: 'not_activated', purchaseDate: new Date().toISOString() },
        ];
    });

    const [paymentMethods, setPaymentMethods] = useState(() => {
        const saved = localStorage.getItem('user_payment_methods');
        return saved ? JSON.parse(saved) : [
            { id: '1', type: 'card', name: 'Visa **** 1234', default: true },
            { id: '2', type: 'google', name: 'Google Pay', default: false }
        ];
    });

    const [stats] = useState(() => {
        const saved = localStorage.getItem('user_stats');
        return saved ? JSON.parse(saved) : {
            rides: 42,
            km: 156,
            co2: 12.5 // kg
        };
    });

    const [savedLocations, setSavedLocations] = useState(() => {
        const saved = localStorage.getItem('user_saved_locations');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Kuća', address: 'Vukovarska 1' },
            { id: 2, name: 'Posao', address: 'Domovinskog rata 2' }
        ];
    });

    // Persist to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('user_data', JSON.stringify(user));
    }, [user]);

    useEffect(() => {
        localStorage.setItem('user_transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('user_tickets', JSON.stringify(tickets));
    }, [tickets]);

    useEffect(() => {
        localStorage.setItem('user_payment_methods', JSON.stringify(paymentMethods));
    }, [paymentMethods]);

    useEffect(() => {
        localStorage.setItem('user_stats', JSON.stringify(stats));
    }, [stats]);

    useEffect(() => {
        localStorage.setItem('user_saved_locations', JSON.stringify(savedLocations));
    }, [savedLocations]);

    useEffect(() => {
        localStorage.setItem('user_notification_settings', JSON.stringify(notificationSettings));
    }, [notificationSettings]);

    // Actions
    const updateUser = (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    };

    const updateNotificationSettings = (key, value) => {
        setNotificationSettings(prev => ({ ...prev, [key]: value }));
    };

    // Payment Method Actions
    const addPaymentMethod = (method) => {
        setPaymentMethods(prev => [...prev, { ...method, id: Date.now().toString() }]);
    };

    const removePaymentMethod = (id) => {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    };

    const setDefaultPaymentMethod = (id) => {
        setPaymentMethods(prev => prev.map(pm => ({
            ...pm,
            default: pm.id === id
        })));
    };

    const addTransaction = (transaction) => {
        setTransactions(prev => [
            { id: Date.now(), ...transaction },
            ...prev
        ]);
    };

    const addLocation = (location) => {
        setSavedLocations(prev => [...prev, { ...location, id: Date.now() }]);
    };

    const removeLocation = (id) => {
        setSavedLocations(prev => prev.filter(l => l.id !== id));
    };
    const addToBalance = (amount) => {
        setUser(prev => ({ ...prev, balance: prev.balance + amount }));
        addTransaction({
            type: 'topup',
            title: 'Nadoplata lisnice',
            amount: amount,
            date: new Date().toISOString(),
            status: 'completed'
        });
    };

    const subtractFromBalance = (amount) => {
        setUser(prev => ({ ...prev, balance: prev.balance - amount }));
    };



    const addTicket = (ticket) => {
        setTickets(prev => [ticket, ...prev]);
        // Also record transaction
        const durationInfo = ticket.duration ? `(${ticket.duration})` : '';
        addTransaction({
            type: 'purchase',
            title: `Kupnja karte: ${ticket.type} ${durationInfo}`.trim(),
            amount: -ticket.price, // Negative for spending
            date: new Date().toISOString(),
            status: 'completed'
        });
    };

    return (
        <UserContext.Provider value={{
            user,
            setUser,
            transactions,
            addTransaction,
            tickets,
            setTickets,
            addTicket, // Helper that handles balance deduction? Or separate?
            // Let's keep subtractFromBalance separate for better control in UI components
            addToBalance,
            subtractFromBalance,
            paymentMethods,
            setPaymentMethods,
            addPaymentMethod,
            removePaymentMethod,
            setDefaultPaymentMethod,
            updateUser,
            notificationSettings,
            updateNotificationSettings,
            stats,
            savedLocations,
            addLocation,
            removeLocation
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
