import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './FieldMap.css';

function FieldMap() {
  // ============ STATE ============
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [filter, setFilter] = useState({ sport: '', city: '' });
  const [toast, setToast] = useState(null);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [fieldForm, setFieldForm] = useState({
    name: '',
    sport: '',
    city: '',
    country: 'Hrvatska',
    address: '',
    price: '',
    facilities: [],
    description: '',
    images: []
  });

  // ============ CONSTANTS ============
  const sportsList = [
    { id: 1, name: '⚽ Nogomet', popular: true },
    { id: 2, name: '🏀 Košarka', popular: true },
    { id: 3, name: '🏐 Odbojka', popular: true },
    { id: 4, name: '🎾 Tenis', popular: true }
  ];

  const countries = ['Hrvatska', 'Srbija', 'Bosna i Hercegovina', 'Slovenija', 'Crna Gora'];

  const europeanCities = {
    'Hrvatska': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula', 'Šibenik', 'Dubrovnik'],
    'Srbija': ['Beograd', 'Novi Sad', 'Niš', 'Kragujevac'],
    'Bosna i Hercegovina': ['Sarajevo', 'Banja Luka', 'Mostar', 'Tuzla'],
    'Slovenija': ['Ljubljana', 'Maribor', 'Celje', 'Kranj'],
    'Crna Gora': ['Podgorica', 'Nikšić', 'Bar', 'Budva']
  };

  const sportovi = ['⚽ Nogomet', '🏀 Košarka', '🏐 Odbojka', '🎾 Tenis'];
  const gradovi = ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar'];

  const availableFacilities = [
    'Parking', 'Tuš', 'Svlačionice', 'Rasvjeta', 'WiFi', 
    'Klima', 'Kafić', 'Restoran', 'Tribine', 'Ozvučenje'
  ];

  // ============ EFFECTS ============
  useEffect(() => {
    loadFields();
  }, []);

  // ============ API FUNCTIONS ============
  const loadFields = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/fields');

      if (response.ok) {
        const data = await response.json();
        setFields(data);
      } else {
        console.error('Failed to load fields');
      }
    } catch (error) {
      console.error('Load fields error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ HANDLER FUNCTIONS ============
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (files.length > 5) {
      setToast({ message: 'Maksimalno 5 slika!', type: 'error' });
      return;
    }

    const validFiles = [];
    const validFileObjects = [];
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setToast({ message: `${file.name} nije slika!`, type: 'error' });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setToast({ message: `${file.name} je prevelika! Max 10MB`, type: 'error' });
        return;
      }
      
      validFiles.push(URL.createObjectURL(file));
      validFileObjects.push(file);
    });

    setSelectedImages([...selectedImages, ...validFiles]);
    setSelectedImageFiles([...selectedImageFiles, ...validFileObjects]);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setSelectedImageFiles(selectedImageFiles.filter((_, i) => i !== index));
  };

  const handleToggleFacility = (facility) => {
    const facilities = fieldForm.facilities || [];
    if (facilities.includes(facility)) {
      setFieldForm({ ...fieldForm, facilities: facilities.filter(f => f !== facility) });
    } else {
      setFieldForm({ ...fieldForm, facilities: [...facilities, facility] });
    }
  };

  const handleAddField = async () => {
    if (!fieldForm.name || !fieldForm.sport || !fieldForm.city) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }

    if (selectedImages.length === 0) {
      setToast({ message: 'Dodaj barem jednu sliku!', type: 'error' });
      return;
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      
      formData.append('data', JSON.stringify({
        name: fieldForm.name,
        sport: fieldForm.sport,
        city: fieldForm.city,
        country: fieldForm.country,
        address: fieldForm.address,
        price: fieldForm.price || 0,
        facilities: fieldForm.facilities || [],
        description: fieldForm.description || '',
        coordinates: fieldForm.coordinates || { lat: 45.8150, lng: 15.9819 }
      }));

      for (let i = 0; i < selectedImageFiles.length; i++) {
        formData.append('images', selectedImageFiles[i]);
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          setToast({ message: '🎉 Teren uspješno dodan!', type: 'success' });
          setShowAddFieldModal(false);
          setFieldForm({
            name: '',
            sport: '',
            city: '',
            country: 'Hrvatska',
            address: '',
            price: '',
            facilities: [],
            description: ''
          });
          setSelectedImages([]);
          setSelectedImageFiles([]);
          setUploadProgress(0);
          setIsUploading(false);
          loadFields();
        } else {
          const error = JSON.parse(xhr.responseText);
          setToast({ message: error.message || 'Greška pri dodavanju terena', type: 'error' });
          setIsUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        setToast({ message: 'Greška pri uploadu', type: 'error' });
        setIsUploading(false);
      });

      xhr.open('POST', 'http://localhost:5000/api/fields');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Add field error:', error);
      setToast({ message: 'Greška pri dodavanju terena', type: 'error' });
      setIsUploading(false);
    }
  };

  // ============ HELPER FUNCTIONS ============
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

  // ============ RENDER ============
  return (
    <div className="field-map-page">
      <Navbar />
      
      <div className="field-map-container">
        {/* HEADER */}
        <div className="map-header">
          <h1>📍 Mapa Terena</h1>
          <p>Pronađi savršeni teren za svoju utakmicu</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddFieldModal(true)}
          >
            + Dodaj novi teren
          </button>
        </div>

        {/* ADD FIELD MODAL */}
        {showAddFieldModal && (
          <div className="modal-overlay" onClick={() => setShowAddFieldModal(false)}>
            <div className="add-field-modal" onClick={(e) => e.stopPropagation()}>
              <h2>🏟️ Dodaj novi teren</h2>
              
              <div className="form-group">
                <label>Naziv terena *</label>
                <input
                  type="text"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  placeholder="npr. Stadion Poljud"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sport *</label>
                  <select 
                    value={fieldForm.sport}
                    onChange={(e) => setFieldForm({ ...fieldForm, sport: e.target.value })}
                  >
                    <option value="">Odaberi</option>
                    {sportsList.filter(s => s.popular).map(sport => (
                      <option key={sport.id} value={sport.name}>{sport.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Cijena (€/h)</label>
                  <input
                    type="number"
                    value={fieldForm.price}
                    onChange={(e) => setFieldForm({ ...fieldForm, price: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Država *</label>
                  <select 
                    value={fieldForm.country}
                    onChange={(e) => setFieldForm({ ...fieldForm, country: e.target.value, city: '' })}
                  >
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Grad *</label>
                  <select 
                    value={fieldForm.city}
                    onChange={(e) => setFieldForm({ ...fieldForm, city: e.target.value })}
                  >
                    <option value="">Odaberi</option>
                    {fieldForm.country && europeanCities[fieldForm.country]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Adresa *</label>
                <input
                  type="text"
                  value={fieldForm.address}
                  onChange={(e) => setFieldForm({ ...fieldForm, address: e.target.value })}
                  placeholder="npr. Mediteranskih igara 2"
                />
              </div>

              <div className="form-group">
                <label>Opis</label>
                <textarea
                  value={fieldForm.description}
                  onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
                  rows="3"
                  placeholder="Dodaj opis terena..."
                />
              </div>

              <div className="form-group">
                <label>Sadržaji</label>
                <div className="facilities-checkboxes">
                  {availableFacilities.map(facility => (
                    <label key={facility} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(fieldForm.facilities || []).includes(facility)}
                        onChange={() => handleToggleFacility(facility)}
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Slike terena</label>
                <div className="image-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="field-images"
                  />
                  <label htmlFor="field-images" className="image-upload-label">
                    <div className="upload-icon">📷</div>
                    <p>Klikni za dodavanje slika</p>
                    <small>Možeš dodati više slika (max 5)</small>
                  </label>
                  
                  {isUploading && (
                    <div className="upload-progress">
                      <div className="progress-bar-upload">
                        <div 
                          className="progress-fill-upload"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="progress-text">{uploadProgress}% uploadano...</p>
                    </div>
                  )}
                  
                  {selectedImages.length > 0 && (
                    <div className="image-preview-grid">
                      {selectedImages.map((img, index) => (
                        <div key={index} className="image-preview">
                          <img src={img} alt={`Preview ${index + 1}`} />
                          <button 
                            className="remove-image"
                            onClick={() => handleRemoveImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowAddFieldModal(false)}
                  disabled={isUploading}
                >
                  Odustani
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddField}
                  disabled={isUploading}
                >
                  {isUploading ? `Uploading ${uploadProgress}%...` : 'Dodaj teren'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="map-layout">
          {/* SIDEBAR */}
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

            {/* FIELDS LIST */}
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
                    <div 
                      className="field-image"
                      style={{ 
                        backgroundImage: field.images && field.images.length > 0
                          ? `url(http://localhost:5000/${field.images[0].filepath.replace(/\\/g, '/')})`
                          : `url(${field.image})`
                      }}
                    >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setToast({ message: 'Rezervacija dolazi uskoro!', type: 'info' });
                        }}
                      >
                        Rezerviraj
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MAP VIEW */}
          <div className="map-view card">
            {selectedField ? (
              <div className="selected-field-details">
                <div 
                  className="selected-field-image"
                  style={{ 
                    backgroundImage: selectedField.images && selectedField.images.length > 0
                      ? `url(http://localhost:5000/${selectedField.images[0].filepath.replace(/\\/g, '/')})`
                      : `url(${selectedField.image})`
                  }}
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