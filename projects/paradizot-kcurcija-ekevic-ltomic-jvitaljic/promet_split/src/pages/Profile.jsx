import { User, Settings, CreditCard, Bell, LogOut, HelpCircle, ChevronRight } from 'lucide-react';

const Profile = () => {
    // Mock user data
    const user = {
        name: 'Ivan Horvat',
        email: 'ivan.horvat@email.com',
        balance: '15.50 €'
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Profil</h1>
            </header>

            {/* User Card */}
            <div className="fade-in" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                marginBottom: '2.5rem',
                padding: '1.5rem',
                background: 'var(--color-surface)',
                borderRadius: '1.5rem',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a1a1a',
                    fontSize: '2rem',
                    fontWeight: 700
                }}>
                    IH
                </div>
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user.name}</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
                    <div style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(250, 204, 21, 0.1)', color: 'var(--color-primary)', borderRadius: '1rem', fontWeight: 600 }}>
                        {user.balance}
                    </div>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="fade-in" style={{ animationDelay: '0.1s' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '0.5rem' }}>Postavke</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <SettingsItem icon={<CreditCard size={20} />} label="Načini plaćanja" />
                    <SettingsItem icon={<Bell size={20} />} label="Obavijesti" />
                    <SettingsItem icon={<Settings size={20} />} label="Općenito" />
                    <SettingsItem icon={<Settings size={20} />} label="Pomoć i podrška" />
                </div>
            </div>

            <button style={{
                marginTop: '3rem',
                width: '100%',
                padding: '1rem',
                borderRadius: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
            }}>
                <LogOut size={20} />
                Odjava
            </button>
        </div>
    );
};

const SettingsItem = ({ icon, label }) => (
    <button style={{
        width: '100%',
        padding: '1.25rem',
        borderRadius: '1rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'var(--color-text)',
        transition: 'background 0.2s'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>{icon}</div>
            <span style={{ fontWeight: 500 }}>{label}</span>
        </div>
        <ChevronRight size={20} color="var(--color-text-muted)" />
    </button>
);

export default Profile;
