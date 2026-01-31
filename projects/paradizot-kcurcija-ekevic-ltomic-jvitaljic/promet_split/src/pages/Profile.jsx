import { useState } from 'react';
import { User, Settings, CreditCard, Bell, LogOut, HelpCircle, ChevronRight, X, Clock, ArrowUpRight, ArrowDownLeft, Plus, Edit2, Trash2, CheckCircle, Star, MessageSquare } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const {
        user, transactions, paymentMethods,
        addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod,
        notificationSettings, updateNotificationSettings,
        updateUser, stats, savedLocations, addLocation, removeLocation
    } = useUser();

    const [activeModal, setActiveModal] = useState(null); // 'payment', 'notifications', 'general', 'support', 'edit_profile', 'add_card', 'locations', 'security'
    const navigate = useNavigate();

    // Form states
    const [editName, setEditName] = useState(user.name);
    const [editEmail, setEditEmail] = useState(user.email);

    // Add Card Form State
    const [newCardName, setNewCardName] = useState('');
    const [newCardNumber, setNewCardNumber] = useState('');

    // Add Location Form
    const [newLocName, setNewLocName] = useState('');
    const [newLocAddress, setNewLocAddress] = useState('');

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleUpdateProfile = () => {
        updateUser({ name: editName, email: editEmail });
        setActiveModal(null);
    };

    const handleAddCard = () => {
        if (!newCardName || !newCardNumber) return;
        addPaymentMethod({
            type: 'card',
            name: newCardName, // In reality, maybe mask it
            last4: newCardNumber.slice(-4), // Mock logic
            default: paymentMethods.length === 0
        });
        setNewCardName('');
        setNewCardNumber('');
        setActiveModal('payment'); // Go back to payment list
    };

    const handleAddLocation = () => {
        if (!newLocName || !newLocAddress) return;
        addLocation({ name: newLocName, address: newLocAddress });
        setNewLocName('');
        setNewLocAddress('');
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '6rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Profil</h1>
            </header>

            {/* User Card */}
            <div className="fade-in" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'var(--color-surface)',
                borderRadius: '1.5rem',
                border: '1px solid var(--color-border)',
                position: 'relative'
            }}>
                <button
                    onClick={() => {
                        setEditName(user.name);
                        setEditEmail(user.email);
                        setActiveModal('edit_profile');
                    }}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        padding: '0.5rem', borderRadius: '50%', background: 'var(--color-surface-hover)',
                        border: 'none', cursor: 'pointer', color: 'var(--color-text)'
                    }}>
                    <Edit2 size={16} />
                </button>

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
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                </div>
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user.name}</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
                    <div style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(250, 204, 21, 0.1)', color: 'var(--color-primary)', borderRadius: '1rem', fontWeight: 600 }}>
                        {user.balance.toFixed(2)} €
                    </div>
                </div>
            </div>

            {/* Statistics Row (NEW) */}
            <div className="fade-in" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '2rem', animationDelay: '0.05s'
            }}>
                <StatCard label="Vožnje" value={stats.rides} />
                <StatCard label="Km" value={stats.km} />
                <StatCard label="CO2 Ušteda" value={`${stats.co2} kg`} highlight />
            </div>

            {/* Transaction History */}
            <div className="fade-in" style={{ animationDelay: '0.05s', marginBottom: '2.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} /> Povijest transakcija
                </h3>

                <div style={{
                    background: 'var(--color-surface)',
                    borderRadius: '1.5rem',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden'
                }}>
                    {transactions.length > 0 ? (
                        transactions.slice(0, 5).map((tx, index) => (
                            <div key={tx.id} style={{
                                padding: '1rem 1.5rem',
                                borderBottom: index < transactions.slice(0, 5).length - 1 ? '1px solid var(--color-border)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: tx.amount > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: tx.amount > 0 ? '#22c55e' : '#ef4444'
                                    }}>
                                        {tx.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tx.title || (tx.amount > 0 ? 'Uplata' : 'Isplata')}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(tx.date)}</div>
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: 700,
                                    color: tx.amount > 0 ? '#22c55e' : 'var(--color-text)',
                                    fontSize: '1rem'
                                }}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} €
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Nema nedavnih transakcija.
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Sections */}
            <div className="fade-in" style={{ animationDelay: '0.1s' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '0.5rem' }}>Postavke</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <SettingsItem icon={<CreditCard size={20} />} label="Načini plaćanja" onClick={() => setActiveModal('payment')} />
                    <SettingsItem icon={<Settings size={20} />} label="Moje adrese" onClick={() => setActiveModal('locations')} />
                    <SettingsItem icon={<Bell size={20} />} label="Obavijesti" onClick={() => setActiveModal('notifications')} />
                    <SettingsItem icon={<Settings size={20} />} label="Sigurnost" onClick={() => setActiveModal('security')} />
                    <SettingsItem icon={<Settings size={20} />} label="Općenito" onClick={() => setActiveModal('general')} />
                    <SettingsItem icon={<HelpCircle size={20} />} label="Pomoć i podrška" onClick={() => setActiveModal('support')} />
                </div>
            </div>

            <button
                onClick={() => {
                    if (confirm('Jeste li sigurni da se želite odjaviti?')) {
                        navigate('/');
                    }
                }}
                style={{
                    marginTop: '3rem', width: '100%', padding: '1rem',
                    borderRadius: '1rem', background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer'
                }}>
                <LogOut size={20} />
                Odjava
            </button>

            {/* --- MODALS --- */}

            {/* Edit Profile Modal */}
            {activeModal === 'edit_profile' && (
                <Modal title="Uredi profil" onClose={() => setActiveModal(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Ime i prezime</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Email adresa</label>
                            <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <button onClick={handleUpdateProfile} style={primaryButtonStyle}>Spremi promjene</button>
                    </div>
                </Modal>
            )}

            {/* Payment Methods List Modal */}
            {activeModal === 'payment' && (
                <Modal title="Načini plaćanja" onClose={() => setActiveModal(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {paymentMethods.map(method => (
                            <div key={method.id} style={{
                                padding: '1rem', borderRadius: '1rem',
                                background: 'var(--color-bg)', border: method.default ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '0.5rem',
                                    background: 'var(--color-surface-hover)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontWeight: 700
                                }}>
                                    {method.type === 'card' ? 'V' : method.type === 'google' ? 'G' : 'P'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{method.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: method.default ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                        {method.default ? 'Zadano' : 'Klikni na zvjezdicu za zadano'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {!method.default && (
                                        <button onClick={() => setDefaultPaymentMethod(method.id)} style={iconButtonStyle}>
                                            <Star size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => removePaymentMethod(method.id)} style={{ ...iconButtonStyle, color: '#ef4444' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => setActiveModal('add_card')}
                            style={{
                                marginTop: '1rem', padding: '1rem', width: '100%',
                                borderRadius: '1rem', border: '1px dashed var(--color-primary)',
                                background: 'transparent', color: 'var(--color-primary)',
                                fontWeight: 600, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '0.5rem', cursor: 'pointer'
                            }}>
                            <Plus size={20} />
                            Dodaj novu karticu
                        </button>
                    </div>
                </Modal>
            )}

            {/* Add Card Modal */}
            {activeModal === 'add_card' && (
                <Modal title="Nova kartica" onClose={() => setActiveModal('payment')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Naziv kartice (npr. Visa)</label>
                            <input
                                type="text"
                                value={newCardName}
                                onChange={(e) => setNewCardName(e.target.value)}
                                style={inputStyle}
                                placeholder="Moja kartica"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Broj kartice</label>
                            <input
                                type="text"
                                value={newCardNumber}
                                onChange={(e) => setNewCardNumber(e.target.value)}
                                style={inputStyle}
                                placeholder="0000 0000 0000 0000"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Istek</label>
                                <input type="text" placeholder="MM/YY" style={inputStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>CVC</label>
                                <input type="text" placeholder="123" style={inputStyle} />
                            </div>
                        </div>
                        <button onClick={handleAddCard} style={primaryButtonStyle}>Dodaj karticu</button>
                    </div>
                </Modal>
            )}

            {/* Locations Modal */}
            {activeModal === 'locations' && (
                <Modal title="Moje Adrese" onClose={() => setActiveModal(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {savedLocations.map(loc => (
                            <div key={loc.id} style={{
                                padding: '1rem',
                                borderRadius: '1rem',
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{loc.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{loc.address}</div>
                                </div>
                                <button onClick={() => removeLocation(loc.id)} style={{ ...iconButtonStyle, color: '#ef4444' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}

                        <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--color-border)', paddingTop: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Dodaj novu adresu</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input
                                    placeholder="Naziv (npr. Teretana)"
                                    value={newLocName}
                                    onChange={(e) => setNewLocName(e.target.value)}
                                    style={inputStyle}
                                />
                                <input
                                    placeholder="Adresa"
                                    value={newLocAddress}
                                    onChange={(e) => setNewLocAddress(e.target.value)}
                                    style={inputStyle}
                                />
                                <button onClick={handleAddLocation} style={{ ...primaryButtonStyle, marginTop: '0.5rem' }}>
                                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Dodaj
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Security Modal */}
            {activeModal === 'security' && (
                <Modal title="Sigurnost" onClose={() => setActiveModal(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <button style={supportButtonStyle} onClick={() => alert('Mock: Change Password')}>Promijeni lozinku</button>
                        <ToggleItem label="Biometrijska prijava" checked={true} onChange={() => { }} />
                        <ToggleItem label="Dvostupanjska autentifikacija (2FA)" checked={false} onChange={() => { }} />
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '1rem', color: '#ef4444' }}>
                            <h4 style={{ marginBottom: '0.5rem', display: 'flex', items: 'center', gap: '0.5rem' }}>
                                <Trash2 size={16} /> Brisanje računa
                            </h4>
                            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Trajno izbrišite svoj račun i sve podatke.</p>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Notifications Modal */}
            {activeModal === 'notifications' && (
                <Modal title="Obavijesti" onClose={() => setActiveModal(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <ToggleItem
                            label="Obavijesti o transakcijama"
                            checked={notificationSettings.transactions}
                            onChange={(v) => updateNotificationSettings('transactions', v)}
                        />
                        <ToggleItem
                            label="Obavijesti o kartama (istek)"
                            checked={notificationSettings.tickets}
                            onChange={(v) => updateNotificationSettings('tickets', v)}
                        />
                        <ToggleItem
                            label="Promocije i novosti"
                            checked={notificationSettings.promotions}
                            onChange={(v) => updateNotificationSettings('promotions', v)}
                        />
                        <ToggleItem
                            label="Zvučne obavijesti"
                            checked={notificationSettings.sound}
                            onChange={(v) => updateNotificationSettings('sound', v)}
                        />
                    </div>
                </Modal>
            )}

            {/* General Modal */}
            {activeModal === 'general' && (
                <Modal title="Općenito" onClose={() => setActiveModal(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Jezik aplikacije</h4>
                            <p style={{ color: 'var(--color-text-muted)' }}>Hrvatski</p>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Tema</h4>
                            <p style={{ color: 'var(--color-text-muted)' }}>Tamna</p>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Verzija aplikacije</h4>
                            <p style={{ color: 'var(--color-text-muted)' }}>1.0.5 (Build 2024)</p>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Support Modal */}
            {activeModal === 'support' && (
                <Modal title="Pomoć i podrška" onClose={() => setActiveModal(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button style={supportButtonStyle} onClick={() => alert('Otvaranje FAQ...')}>Često postavljana pitanja (FAQ)</button>
                        <button style={supportButtonStyle} onClick={() => alert('Pozivanje podrške...')}>Kontaktirajte podršku</button>

                        <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Pošaljite nam poruku</h4>
                            <textarea
                                placeholder="Opišite svoj problem..."
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '1rem',
                                    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                                    color: 'var(--color-text)', minHeight: '100px', resize: 'vertical'
                                }}
                            ></textarea>
                            <button onClick={() => { alert('Poruka poslana!'); setActiveModal(null); }} style={{ ...primaryButtonStyle, marginTop: '1rem' }}>
                                <MessageSquare size={18} style={{ marginRight: '0.5rem' }} /> Pošalji poruku
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const SettingsItem = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        style={{
            width: '100%', padding: '1.25rem', borderRadius: '1rem',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: 'var(--color-text)', transition: 'background 0.2s', cursor: 'pointer'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>{icon}</div>
            <span style={{ fontWeight: 500 }}>{label}</span>
        </div>
        <ChevronRight size={20} color="var(--color-text-muted)" />
    </button>
);

const Modal = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
        zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
    }}>
        <div className="fade-in" style={{
            background: 'var(--color-surface)',
            borderTopLeftRadius: '2rem', borderTopRightRadius: '2rem',
            padding: '2rem', borderTop: '1px solid var(--color-border)',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>{title}</h2>
                <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-surface-hover)', borderRadius: '50%', cursor: 'pointer', border: 'none', color: 'var(--color-text)' }}>
                    <X size={20} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

const ToggleItem = ({ label, checked, onChange }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{label}</span>
            <button
                onClick={() => onChange(!checked)}
                style={{
                    width: '48px', height: '28px',
                    borderRadius: '14px',
                    background: checked ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                    position: 'relative', transition: '0.2s', border: 'none', cursor: 'pointer'
                }}>
                <div style={{
                    position: 'absolute', top: '2px', left: checked ? '22px' : '2px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'white', transition: '0.2s'
                }} />
            </button>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '1rem',
    borderRadius: '0.75rem',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    outline: 'none',
    fontSize: '1rem'
};

const primaryButtonStyle = {
    width: '100%',
    padding: '1rem',
    borderRadius: '1rem',
    background: 'var(--color-primary)',
    color: '#1a1a1a',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const supportButtonStyle = {
    padding: '1.25rem',
    borderRadius: '1rem',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: 'none',
    textAlign: 'left',
    fontWeight: 500,
    cursor: 'pointer'
};

const iconButtonStyle = {
    padding: '0.5rem',
    background: 'var(--color-surface-hover)',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const StatCard = ({ label, value, highlight }) => (
    <div style={{
        background: 'var(--color-surface)',
        padding: '1rem',
        borderRadius: '1rem',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
    }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: highlight ? '#22c55e' : 'var(--color-text)' }}>{value}</span>
    </div>
);

export default Profile;
