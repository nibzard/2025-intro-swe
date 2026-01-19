import { createContext, useContext, useState } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [balance, setBalance] = useState(0);

    const addToBalance = (amount) => {
        setBalance((prev) => prev + amount);
    };

    const subtractFromBalance = (amount) => {
        setBalance((prev) => prev - amount);
    };

    return (
        <WalletContext.Provider value={{ balance, addToBalance, subtractFromBalance }}>
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
