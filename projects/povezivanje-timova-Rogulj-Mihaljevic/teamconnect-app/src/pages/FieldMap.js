import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './FieldMap.css';

function FieldMap() {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [filter, setFilter] = useState({ sport: '', city: '' });
  const [toast, setToast] = useState(null);

  const sportovi = ['⚽ Nogomet', '🏀 Košarka', '🏐 Odbojka', '🎾 Tenis'];
  const gradovi = ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar'];

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = () => {
    const saved = localStorage.getItem('sportsFields');
    if (saved) {
      setFields(JSON.parse(saved));
    } else {
      // Demo tereni
      const demo = [
        {
          id: 1,
          name: 'Stadion Poljud',
          sport: '⚽ Nogomet',
          city: 'Split',
          address: 'Mediteranskih igara 2',
          rating: 4.8,
          reviews: 124,
          price: '500 kn/h',
          availability: 'Dostupno',
          facilities: ['Parking', 'Tuš', 'Rasvjeta', 'Svlačionice'],
          image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
          coordinates: { lat: 43.5109, lng: 16.4410 }
        },
        {
          id: 2,
          name: 'Arena Zagreb',
          sport: '🏀 Košarka',
          city: 'Zagreb',
          address: 'Ulica Vice Vukova 6',
          rating: 4.9,
          reviews: 289,
          price: '800 kn/h',
          availability: 'Rezervirano',
          facilities: ['Parking', 'Tuš', 'Klima', 'Restoran', 'Svlačionice'],
          image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
          coordinates: { lat: 45.8016, lng: 15.9667 }
        },
        {
          id: 3,
          name: 'Spaladium Arena',
          sport: '🏐 Odbojka',
          city: 'Split',
          address: 'Zrinsko Frankopanska 211',
          rating: 4.7,
          reviews: 156,
          price: '600 kn/h',
          availability: 'Dostupno',
          facilities: ['Parking', 'Tuš', 'Kafić', 'Svlačionice'],
          image: 'https://images.unsplash.com/photo-1593642532400-2682810df593?w=800',
          coordinates: { lat: 43.5199, lng: 16.4732 }
        }
      ];
      setFields(demo);
      localStorage.setItem('sportsFields', JSON.stringify(demo));
    }
  };

  const filterFields = () => {
    return fields.filter(field => {
      const sportMatch = !filter.sport || field.sport === filter.sport;
      const cityMatch = !filter.city || field.city === filter.city;
      return sportMatch && cityMatch;
    });
  };

  const getAvailabilityColor = (availability) => {
    return availability === 'Dostupno' ? '#4caf50' : '#f44336';
  };

  const filteredFields = filterFields();

  return (
    <div className="field-map-page">
      <Navbar />
      
      <div className="field-map-container">
        <div className="map-header">
          <h1>📍 Mapa Terena</h1>
          <p>Pronađi savršeni teren za svoju utakmicu</p>
        </div>

        <div className="map-layout">
          <div className="fields-sidebar">
            <div className="sidebar-filters card">
              <h3>🔍 Filtriraj</h3>
              
              <div className="form-group">
                <label>Sport</label>
                <select 
                  value={filter.sport} 
                  onChange={(e) => setFilter({ ...filter, sport: e.target.value })}
                >
                  <option value="">Svi sportovi</option>
                  {sportovi.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Grad</label>
                <select 
                  value={filter.city} 
                  onChange={(e) => setFilter({ ...filter, city: e.target.value })}
                >
                  <option value="">Svi gradovi</option>
                  {gradovi.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {(filter.sport || filter.city) && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => setFilter({ sport: '', city: '' })}
                >
                  Resetiraj
                </button>
              )}
            </div>

            <div className="fields-list">
              {filteredFields.length === 0 ? (
                <div className="no-fields">
                  <span className="empty-icon">🏟️</span>
                  <p>Nema terena s ovim filterima</p>
                </div>
              ) : (
                filteredFields.map(field => (
                  <div 
                    key={field.id} 
                    className={`field-card card ${selectedField?.id === field.id ? 'selected' : ''}`}
                    onClick={() => setSelectedField(field)}
                  >
                    <div className="field-image" style={{ backgroundImage: `url(${field.image})` }}>
                      <div 
                        className="field-availability"
                        style={{ background: getAvailabilityColor(field.availability) }}
                      >
                        {field.availability}
                      </div>
                    </div>

                    <div className="field-info">
                      <div className="field-header-info">
                        <h4>{field.name}</h4>
                        <div className="field-rating">
                          ⭐ {field.rating} ({field.reviews})
                        </div>
                      </div>

                      <p className="field-sport">{field.sport}</p>
                      <p className="field-location">📍 {field.city}, {field.address}</p>
                      <p className="field-price">💰 {field.price}</p>

                      <div className="field-facilities">
                        {field.facilities.slice(0, 3).map((facility, idx) => (
                          <span key={idx} className="facility-badge">
                            {facility}
                          </span>
                        ))}
                        {field.facilities.length > 3 && (
                          <span className="facility-more">+{field.facilities.length - 3}</span>
                        )}
                      </div>

                      <button 
                        className="btn btn-primary btn-small"
                        onClick={() => setToast({ message: 'Rezervacija dolazi uskoro!', type: 'info' })}
                      >
                        Rezerviraj
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="map-view card">
            {selectedField ? (
              <div className="selected-field-details">
                <div 
                  className="selected-field-image"
                  style={{ backgroundImage: `url(${selectedField.image})` }}
                >
                  <button 
                    className="close-detail-btn"
                    onClick={() => setSelectedField(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="selected-field-content">
                  <h2>{selectedField.name}</h2>
                  <div className="detail-meta">
                    <span className="detail-sport">{selectedField.sport}</span>
                    <span className="detail-rating">⭐ {selectedField.rating}</span>
                    <span 
                      className="detail-availability"
                      style={{ background: getAvailabilityColor(selectedField.availability) }}
                    >
                      {selectedField.availability}
                    </span>
                  </div>

                  <div className="detail-info">
                    <p><strong>📍 Adresa:</strong> {selectedField.address}, {selectedField.city}</p>
                    <p><strong>💰 Cijena:</strong> {selectedField.price}</p>
                    <p><strong>⭐ Ocjena:</strong> {selectedField.rating}/5 ({selectedField.reviews} recenzija)</p>
                  </div>

                  <div className="detail-facilities">
                    <h4>Sadržaji:</h4>
                    <div className="facilities-grid">
                      {selectedField.facilities.map((facility, idx) => (
                        <div key={idx} className="facility-item">
                          ✓ {facility}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => setToast({ message: 'Rezervacija dolazi uskoro!', type: 'info' })}
                    >
                      Rezerviraj sada
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${selectedField.coordinates.lat},${selectedField.coordinates.lng}`,
                          '_blank'
                        );
                      }}
                    >
                      Otvori u Google Maps
                    </button>
                  </div>

                  <div className="detail-map-placeholder">
                    <div className="map-icon">🗺️</div>
                    <p>Interaktivna mapa dolazi uskoro!</p>
                    <small>Koordinate: {selectedField.coordinates.lat}, {selectedField.coordinates.lng}</small>
                  </div>
                </div>
              </div>
            ) : (
              <div className="map-placeholder">
                <div className="map-icon">🗺️</div>
                <h3>Interaktivna mapa</h3>
                <p>Odaberi teren s liste da vidiš detalje</p>
                <small>Google Maps integracija dolazi uskoro</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default FieldMap;