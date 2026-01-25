import React, { useState, useEffect } from "react";
import API_URL from "./config";

const API_BASE = `${API_URL}/api`;

function Photo360Viewer({ venueId }) {
  const [venue, setVenue] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  useEffect(() => {
    fetchVenueAndPhotos();
  }, [venueId]);

  const getTourUrl = () => {
    if (!venue || !venue.virtual_tour_url) return '';
    let url = venue.virtual_tour_url;
    if (url.includes('matterport.com')) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}play=1&qs=1&brand=0&mls=2&wh=0&guides=0&title=0`;
    }
    return url;
  };

  const fetchVenueAndPhotos = async () => {
    try {
      // Fetch venue details for virtual tour URL
      const venueRes = await fetch(`${API_BASE}/venues/${venueId}`);
      if (venueRes.ok) {
        const venueData = await venueRes.json();
        setVenue(venueData);
      }

      // Fetch 360 photos
      const photosRes = await fetch(`${API_BASE}/venues/${venueId}/360-photos`);
      if (photosRes.ok) {
        const data = await photosRes.json();
        setPhotos(data);
        if (data.length > 0) {
          setSelectedPhoto(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load 360 data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-small">Ucitavanje 360° prikaza...</div>;
  }

  const hasVirtualTour = venue && venue.virtual_tour_url;

  return (
    <div className="photo-360-section">
      {/* Virtual Tour (iframe) */}
      {hasVirtualTour && (
        <div className="virtual-tour-section">
          <div className="virtual-tour-header">
            <h3>🌐 360° Virtualna Šetnja - {venue.name}</h3>
            <p className="gallery-subtitle">Istražite {venue.name} u 360° panoramskom prikazu</p>
          </div>

          {!showVirtualTour ? (
            <div className="virtual-tour-preview" onClick={() => setShowVirtualTour(true)}>
              <div className="virtual-tour-overlay">
                <div className="play-button">
                  <span>▶</span>
                </div>
                <span className="tour-label">Kliknite za virtualnu šetnju</span>
              </div>
            </div>
          ) : (
            <div className="virtual-tour-container">
              <div className="virtual-tour-controls">
                <button
                  className="close-tour-btn"
                  onClick={() => setShowVirtualTour(false)}
                >
                  ✕ Zatvori virtualnu šetnju
                </button>
              </div>
              <iframe
                src={getTourUrl()}
                title="360 Virtual Tour"
                className="virtual-tour-iframe"
                allowFullScreen
                style={{ width: "100%", height: "600px", border: "none", borderRadius: "12px" }}
              />
            </div>
          )}
          <p className="virtual-tour-hint">
            Koristite miš za rotaciju pogleda. Kliknite na točke za kretanje.
          </p>
        </div>
      )}

      {/* 360 Photos from users */}
      <div className="card">
        <h3>360° Prikazi Sjedala</h3>

        {photos.length === 0 && !venue?.virtual_tour_url ? (
          <p className="no-content">Nema dostupnih 360° fotografija za ovaj venue.</p>
        ) : photos.length === 0 ? (
          <p className="muted">Korisnici jos nisu uploadali 360° fotografije sjedala.</p>
        ) : (
          <>
            {/* Selected photo viewer */}
            {selectedPhoto && (
              <div className="photo-360-viewer">
                <div className="photo-360-container">
                  <img
                    src={`${API_URL}${selectedPhoto.file_path}`}
                    alt="360 view"
                    className="photo-360-image"
                  />
                  <div className="photo-360-info">
                    <strong>
                      Sekcija: {selectedPhoto.section || "N/A"} |
                      Red: {selectedPhoto.row || "N/A"} |
                      Sjedalo: {selectedPhoto.seat_number || "N/A"}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Photo selector */}
            {photos.length > 1 && (
              <div className="photo-360-selector">
                <h4>Odaberite pogled:</h4>
                <div className="photo-360-list">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      className={`photo-360-item ${
                        selectedPhoto?.id === photo.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <div className="photo-360-thumb">
                        <img
                          src={`${API_URL}${photo.file_path}`}
                          alt="thumbnail"
                        />
                      </div>
                      <div className="photo-360-details">
                        <div>Sek: {photo.section || "?"}</div>
                        <div>Red: {photo.row || "?"}</div>
                        <div>Sjed: {photo.seat_number || "?"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Photo360Viewer;
