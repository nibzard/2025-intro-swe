import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import './EventTicketing.css';

function EventTicketing() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('events'); // events, myTickets
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toast, setToast] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({
    quantity: 1,
    seatType: 'standard',
    name: '',
    email: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadEvents();
    loadMyTickets();
  }, []);

  const loadEvents = () => {
    const saved = localStorage.getItem('events');
    if (saved) {
      setEvents(JSON.parse(saved));
    } else {
      const demoEvents = [
        {
          id: 1,
          name: 'Finale Turnira - Plavi Lavovi vs Crveni Tigrovi',
          sport: '⚽ Nogomet',
          date: '2026-02-15',
          time: '19:00',
          venue: 'Stadion Poljud, Split',
          capacity: 1000,
          soldTickets: 687,
          ticketTypes: [
            { type: 'standard', name: 'Standardna', price: 50, available: 200 },
            { type: 'vip', name: 'VIP', price: 150, available: 50 },
            { type: 'premium', name: 'Premium', price: 100, available: 63 }
          ],
          image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
          description: 'Veliko finale ljetnog turnira! Ne propustite!',
          organizer: 'TeamConnect',
          status: 'selling' // selling, soldout, ended
        },
        {
          id: 2,
          name: 'Košarkaško natjecanje - Polufinale',
          sport: '🏀 Košarka',
          date: '2026-02-20',
          time: '18:30',
          venue: 'Arena Zagreb',
          capacity: 800,
          soldTickets: 543,
          ticketTypes: [
            { type: 'standard', name: 'Standardna', price: 40, available: 157 },
            { type: 'vip', name: 'VIP', price: 120, available: 100 }
          ],
          image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
          description: 'Uzbudljivo košarkaško polufinale!',
          organizer: 'TeamConnect',
          status: 'selling'
        }
      ];
      setEvents(demoEvents);
      localStorage.setItem('events', JSON.stringify(demoEvents));
    }
  };

  const loadMyTickets = () => {
    const saved = localStorage.getItem('myTickets');
    if (saved) {
      setMyTickets(JSON.parse(saved));
    } else {
      const demoTickets = [
        {
          id: 'TKT-001-2026',
          eventId: 1,
          eventName: 'Finale Turnira - Plavi Lavovi vs Crveni Tigrovi',
          date: '2026-02-15',
          time: '19:00',
          venue: 'Stadion Poljud, Split',
          seatType: 'VIP',
          quantity: 2,
          totalPrice: 300,
          purchaseDate: new Date(Date.now() - 86400000).toISOString(),
          qrCode: 'QR-CODE-DATA-001',
          status: 'valid' // valid, used, cancelled
        }
      ];
      setMyTickets(demoTickets);
      localStorage.setItem('myTickets', JSON.stringify(demoTickets));
    }
  };

  const handlePurchaseClick = (event) => {
    setSelectedEvent(event);
    setPurchaseForm({
      quantity: 1,
      seatType: event.ticketTypes[0].type,
      name: currentUser.username || '',
      email: currentUser.email || ''
    });
    setShowPurchaseModal(true);
  };

  const handlePurchase = () => {
    if (!purchaseForm.name || !purchaseForm.email) {
      setToast({ message: 'Popuni sva polja!', type: 'error' });
      return;
    }

    const selectedType = selectedEvent.ticketTypes.find(t => t.type === purchaseForm.seatType);
    
    if (purchaseForm.quantity > selectedType.available) {
      setToast({ message: 'Nema dovoljno dostupnih karata!', type: 'error' });
      return;
    }

    const newTicket = {
      id: `TKT-${Date.now()}-2026`,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      date: selectedEvent.date,
      time: selectedEvent.time,
      venue: selectedEvent.venue,
      seatType: selectedType.name,
      quantity: purchaseForm.quantity,
      totalPrice: selectedType.price * purchaseForm.quantity,
      purchaseDate: new Date().toISOString(),
      qrCode: `QR-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status: 'valid'
    };

    // Ažuriraj karte
    const updatedTickets = [...myTickets, newTicket];
    setMyTickets(updatedTickets);
    localStorage.setItem('myTickets', JSON.stringify(updatedTickets));

    // Ažuriraj event (prodano karata)
    const updatedEvents = events.map(e => {
      if (e.id === selectedEvent.id) {
        return {
          ...e,
          soldTickets: e.soldTickets + purchaseForm.quantity,
          ticketTypes: e.ticketTypes.map(t => 
            t.type === purchaseForm.seatType 
              ? { ...t, available: t.available - purchaseForm.quantity }
              : t
          )
        };
      }
      return e;
    });
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));

    setShowPurchaseModal(false);
    setToast({ message: 'Karte uspješno kupljene! 🎉', type: 'success' });
    setActiveTab('myTickets');
  };

  const handleShowQR = (ticket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const getTicketTypeColor = (type) => {
    const colors = {
      standard: '#4caf50',
      premium: '#ff9800',
      vip: '#e91e63'
    };
    return colors[type] || colors.standard;
  };

  const getStatusBadge = (status) => {
    const badges = {
      selling: { text: 'U prodaji', color: '#4caf50' },
      soldout: { text: 'Rasprodano', color: '#f44336' },
      ended: { text: 'Završeno', color: '#999' }
    };
    return badges[status] || badges.selling;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('hr-HR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="event-ticketing-page">
      <Navbar />
      
      <div className="ticketing-container">
        <div className="ticketing-header">
          <h1>🎫 Event Ticketing</h1>
          <p>Kupi ulaznice za nadolazeće događaje</p>
        </div>

        <div className="ticketing-tabs">
          <button 
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Dostupni eventi ({events.length})
          </button>
          <button 
            className={`tab ${activeTab === 'myTickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('myTickets')}
          >
            Moje karte ({myTickets.length})
          </button>
        </div>

        {activeTab === 'events' && (
          <div className="events-grid">
            {events.length === 0 ? (
              <div className="empty-events card">
                <span className="empty-icon">🎫</span>
                <h3>Nema dostupnih događaja</h3>
                <p>Provjerite uskoro za nove događaje!</p>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="event-card card">
                  <div 
                    className="event-image"
                    style={{ backgroundImage: `url(${event.image})` }}
                  >
                    <div 
                      className="event-status"
                      style={{ background: getStatusBadge(event.status).color }}
                    >
                      {getStatusBadge(event.status).text}
                    </div>
                  </div>

                  <div className="event-content">
                    <div className="event-sport">{event.sport}</div>
                    <h3>{event.name}</h3>
                    
                    <div className="event-info">
                      <p>📅 {formatDate(event.date)}</p>
                      <p>🕐 {event.time}</p>
                      <p>📍 {event.venue}</p>
                      <p>👤 Organizator: {event.organizer}</p>
                    </div>

                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}

                    <div className="ticket-availability">
                      <div className="availability-header">
                        <span>Dostupnost karata:</span>
                        <span className="availability-count">
                          {event.capacity - event.soldTickets}/{event.capacity}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(event.soldTickets / event.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="ticket-types">
                      {event.ticketTypes.map((type, index) => (
                        <div key={index} className="ticket-type-item">
                          <div className="ticket-type-info">
                            <span 
                              className="ticket-type-badge"
                              style={{ background: getTicketTypeColor(type.type) }}
                            >
                              {type.name}
                            </span>
                            <span className="ticket-price">{type.price} kn</span>
                          </div>
                          <span className="ticket-available">
                            {type.available > 0 ? `${type.available} dostupno` : 'Rasprodano'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button 
                      className="btn btn-primary"
                      onClick={() => handlePurchaseClick(event)}
                      disabled={event.status === 'soldout'}
                    >
                      {event.status === 'soldout' ? 'Rasprodano' : 'Kupi kartu'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'myTickets' && (
          <div className="tickets-grid">
            {myTickets.length === 0 ? (
              <div className="empty-tickets card">
                <span className="empty-icon">🎫</span>
                <h3>Nemaš kupljenih karata</h3>
                <p>Kupi karte za nadolazeće događaje!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('events')}
                >
                  Pregledaj događaje
                </button>
              </div>
            ) : (
              myTickets.map(ticket => (
                <div key={ticket.id} className="ticket-card card">
                  <div className="ticket-header">
                    <div className="ticket-id">#{ticket.id}</div>
                    <div 
                      className={`ticket-status-badge ${ticket.status}`}
                    >
                      {ticket.status === 'valid' && '✓ Važeća'}
                      {ticket.status === 'used' && '✓ Iskorištena'}
                      {ticket.status === 'cancelled' && '✕ Otkazana'}
                    </div>
                  </div>

                  <h3>{ticket.eventName}</h3>

                  <div className="ticket-details">
                    <div className="ticket-detail-item">
                      <span className="detail-icon">📅</span>
                      <span>{formatDate(ticket.date)}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <span className="detail-icon">🕐</span>
                      <span>{ticket.time}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{ticket.venue}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <span className="detail-icon">🎫</span>
                      <span>{ticket.seatType} × {ticket.quantity}</span>
                    </div>
                    <div className="ticket-detail-item">
                      <span className="detail-icon">💰</span>
                      <span>{ticket.totalPrice} kn</span>
                    </div>
                  </div>

                  <div className="ticket-purchase-date">
                    Kupljeno: {new Date(ticket.purchaseDate).toLocaleDateString('hr-HR')}
                  </div>

                  {ticket.status === 'valid' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleShowQR(ticket)}
                    >
                      📱 Prikaži QR kod
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal za kupnju karte */}
      {showPurchaseModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎫 Kupi kartu</h2>
            <h3>{selectedEvent.name}</h3>

            <div className="purchase-event-info">
              <p>📅 {formatDate(selectedEvent.date)} u {selectedEvent.time}</p>
              <p>📍 {selectedEvent.venue}</p>
            </div>

            <div className="form-group">
              <label>Tip karte *</label>
              <select 
                value={purchaseForm.seatType}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, seatType: e.target.value })}
              >
                {selectedEvent.ticketTypes.map(type => (
                  <option key={type.type} value={type.type} disabled={type.available === 0}>
                    {type.name} - {type.price} kn ({type.available} dostupno)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Količina *</label>
              <input
                type="number"
                value={purchaseForm.quantity}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: parseInt(e.target.value) })}
                min="1"
                max={selectedEvent.ticketTypes.find(t => t.type === purchaseForm.seatType)?.available || 1}
              />
            </div>

            <div className="form-group">
              <label>Ime i prezime *</label>
              <input
                type="text"
                value={purchaseForm.name}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, name: e.target.value })}
                placeholder="Upiši ime i prezime"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={purchaseForm.email}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="purchase-summary">
              <div className="summary-row">
                <span>Cijena po karti:</span>
                <span className="summary-value">
                  {selectedEvent.ticketTypes.find(t => t.type === purchaseForm.seatType)?.price} kn
                </span>
              </div>
              <div className="summary-row">
                <span>Količina:</span>
                <span className="summary-value">× {purchaseForm.quantity}</span>
              </div>
              <div className="summary-row total">
                <span>Ukupno:</span>
                <span className="summary-value">
                  {(selectedEvent.ticketTypes.find(t => t.type === purchaseForm.seatType)?.price || 0) * purchaseForm.quantity} kn
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowPurchaseModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handlePurchase}
              >
                Kupi sada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal za QR kod */}
      {showQRModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📱 QR Kod - Check-in</h2>
            
            <div className="qr-code-container">
              <div className="qr-code-placeholder">
                <div className="qr-grid">
                  {[...Array(25)].map((_, i) => (
                    <div 
                      key={i} 
                      className="qr-pixel"
                      style={{ 
                        background: Math.random() > 0.5 ? '#000' : '#fff',
                        opacity: Math.random() 
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="qr-code-text">{selectedTicket.qrCode}</p>
            </div>

            <div className="qr-ticket-info">
              <h4>{selectedTicket.eventName}</h4>
              <p>📅 {formatDate(selectedTicket.date)} u {selectedTicket.time}</p>
              <p>🎫 {selectedTicket.seatType} × {selectedTicket.quantity}</p>
              <p>#{selectedTicket.id}</p>
            </div>

            <div className="qr-instructions">
              <p>💡 Prikaži ovaj QR kod na ulazu</p>
              <small>QR kod je valjan samo jednom</small>
            </div>

            <button 
              className="btn btn-secondary"
              onClick={() => setShowQRModal(false)}
            >
              Zatvori
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default EventTicketing;