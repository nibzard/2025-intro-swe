import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getAllSports, addCustomSport } from '../data/sports';
import { europeanCities, searchCities, addCustomCity } from '../data/cities';
import './CreateTeam.css';

function CreateTeam() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [showCustomSportModal, setShowCustomSportModal] = useState(false);
  const [customSportName, setCustomSportName] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    country: 'Hrvatska',
    city: '',
    location: '',
    date: '',
    time: '',
    maxPlayers: 10,
    description: ''
  });

  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset city when country changes
    if (name === 'country') {
      setFormData({ ...formData, country: value, city: '' });
      setCitySearch('');
    }
  };

  const handleCitySearch = (value) => {
    setCitySearch(value);
    setShowCityDropdown(true);
  };

  const handleCitySelect = (city, country) => {
    setFormData({ ...formData, city, country });
    setCitySearch(city);
    setShowCityDropdown(false);
  };

  const handleAddCustomSport = () => {
    if (!customSportName.trim()) {
      setToast({ message: 'Upiši naziv sporta!', type: 'error' });
      return;
    }

    const newSport = addCustomSport(customSportName);
    setFormData({ ...formData, sport: newSport.name });
    setCustomSportName('');
    setShowCustomSportModal(false);
    setToast({ message: `Sport "${customSportName}" dodan! 🎉`, type: 'success' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.sport || !formData.city || !formData.date || !formData.time) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Tim uspješno kreiran! 🎉', type: 'success' });
        setTimeout(() => navigate('/my-teams'), 2000);
      } else {
        setToast({ message: data.message || 'Greška pri kreiranju tima', type: 'error' });
      }
    } catch (error) {
      console.error('Create team error:', error);
      setToast({ message: 'Greška pri kreiranju tima', type: 'error' });
    }
  };
  const [showCustomCityModal, setShowCustomCityModal] = useState(false);
const [customCityData, setCustomCityData] = useState({
  cityName: '',
  countryName: ''
});

const handleAddCustomCity = () => {
  if (!customCityData.cityName.trim() || !customCityData.countryName.trim()) {
    setToast({ message: 'Popuni naziv grada i države!', type: 'error' });
    return;
  }

  const newCity = addCustomCity(customCityData.cityName, customCityData.countryName);
  setFormData({ 
    ...formData, 
    city: newCity.city, 
    country: newCity.country 
  });
  setCitySearch(newCity.city);
  setCustomCityData({ cityName: '', countryName: '' });
  setShowCustomCityModal(false);
  setToast({ message: `Grad "${customCityData.cityName}" dodan! 🎉`, type: 'success' });
};
  const filteredCities = citySearch 
    ? searchCities(citySearch).slice(0, 10)
    : [];

  return (
    <div className="create-team-page">
      <Navbar />
      
      <div className="create-team-container">
        <div className="create-team-card card">
          <h1>⚽ Kreiraj novi tim</h1>
          <p className="subtitle">Organiziraj utakmicu i pozovi igrače</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Naziv tima *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="npr. Večernja utakmica na Poljudu"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sport *</label>
                <div className="sport-select-wrapper">
                  <select name="sport" value={formData.sport} onChange={handleChange} required>
                    <option value="">Odaberi sport</option>
                    <optgroup label="Popularni sportovi">
                      {sportsList.filter(s => s.popular).map(sport => (
                        <option key={sport.id} value={sport.name}>{sport.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Ostali sportovi">
                      {sportsList.filter(s => !s.popular).map(sport => (
                        <option key={sport.id} value={sport.name}>{sport.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setShowCustomSportModal(true)}
                    style={{ marginTop: '10px' }}
                  >
                    + Dodaj novi sport
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Država *</label>
                <select name="country" value={formData.country} onChange={handleChange} required>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Grad *</label>
              <div className="city-search-wrapper">
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => setShowCityDropdown(true)}
                  placeholder="Pretraži grad..."
                  required
                />
                {showCityDropdown && filteredCities.length > 0 && (
                  <div className="city-dropdown">
                    {filteredCities.map((item, index) => (
                      <div 
                        key={index}
                        className="city-item"
                        onClick={() => handleCitySelect(item.city, item.country)}
                      >
                        <span className="city-name">{item.city}</span>
                        <span className="city-country">{item.country}</span>
                      </div>
                    ))}
                     <button 
    type="button"
    className="btn btn-secondary btn-small"
    onClick={() => setShowCustomCityModal(true)}
    style={{ marginTop: '10px' }}
  >
    + Dodaj novi grad
  </button>
                  </div>
                )}
                {formData.country && !citySearch && (
                  <div className="city-dropdown">
                    {europeanCities[formData.country]?.slice(0, 10).map((city, index) => (
                      <div 
                        key={index}
                        className="city-item"
                        onClick={() => handleCitySelect(city, formData.country)}
                      >
                        <span className="city-name">{city}</span>
                        <span className="city-country">{formData.country}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Lokacija/Teren *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="npr. Stadion Poljud, Ulica Vice Vukova 6"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Datum *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vrijeme *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Maksimalan broj igrača</label>
              <input
                type="number"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                min="2"
                max="50"
              />
              <small>Uključujući tebe</small>
            </div>

            <div className="form-group">
              <label>Opis (opcionalno)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Dodaj dodatne informacije o utakmici..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Odustani
              </button>
              <button type="submit" className="btn btn-primary">
                Kreiraj tim
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal za custom sport */}
      {showCustomSportModal && (
        <div className="modal-overlay" onClick={() => setShowCustomSportModal(false)}>
          <div className="custom-sport-modal" onClick={(e) => e.stopPropagation()}>
            <h2>➕ Dodaj novi sport</h2>
            <p>Ne vidiš svoj sport na listi? Dodaj ga!</p>
            
            <div className="form-group">
              <label>Naziv sporta</label>
              <input
                type="text"
                value={customSportName}
                onChange={(e) => setCustomSportName(e.target.value)}
                placeholder="npr. Padel, Squash, Paintball..."
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCustomSportModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddCustomSport}
              >
                Dodaj sport
              </button>
            </div>
          </div>
        </div>
      )}
      {showCustomCityModal && (
  <div className="modal-overlay" onClick={() => setShowCustomCityModal(false)}>
    <div className="custom-sport-modal" onClick={(e) => e.stopPropagation()}>
      <h2>🏙️ Dodaj novi grad</h2>
      <p>Ne vidiš svoj grad na listi? Dodaj ga!</p>
      
      <div className="form-group">
        <label>Naziv grada</label>
        <input
          type="text"
          value={customCityData.cityName}
          onChange={(e) => setCustomCityData({ ...customCityData, cityName: e.target.value })}
          placeholder="npr. Mostar, Luxembourg..."
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>Država</label>
        <input
          type="text"
          value={customCityData.countryName}
          onChange={(e) => setCustomCityData({ ...customCityData, countryName: e.target.value })}
          placeholder="npr. Bosna i Hercegovina"
        />
      </div>

      <div className="modal-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => setShowCustomCityModal(false)}
        >
          Odustani
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleAddCustomCity}
        >
          Dodaj grad
        </button>
      </div>
    </div>
  </div>
)}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default CreateTeam;