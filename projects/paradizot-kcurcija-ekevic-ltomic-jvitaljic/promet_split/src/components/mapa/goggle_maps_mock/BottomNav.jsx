import { NavLink } from 'react-router-dom';
import { Wallet, Ticket, Map as MapIcon, User, Compass } from 'lucide-react';

const BottomNav = () => {
    const navItems = [
        { path: '/', icon: Wallet, label: 'Novčanik' },
        { path: '/tickets', icon: Ticket, label: 'Karte' },
        { path: '/map', icon: MapIcon, label: 'Bus' },
        { path: '/tracking', icon: Compass, label: 'Praćenje' },
        { path: '/profile', icon: User, label: 'Profil' },
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--color-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            padding: '0.75rem 0 1.5rem 0', // Extra padding at bottom for iOS safe area
            zIndex: 100
        }}>
            {navItems.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            gap: '0.35rem',
                            fontSize: '0.7rem',
                            fontWeight: isActive ? 600 : 500,
                            transition: 'all 0.2s ease',
                            transform: isActive ? 'translateY(-2px)' : 'none'
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default BottomNav;
