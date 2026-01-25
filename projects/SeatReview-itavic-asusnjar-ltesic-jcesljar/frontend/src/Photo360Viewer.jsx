import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

function Photo360Viewer({ venueId }) {
  const [venue, setVenue] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenueAndPhotos();
  }, [venueId]);

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

  return (
    <div className="photo-360-section">
      {/* Virtual Tour (iframe) */}
      {venue?.virtual_tour_url && (
        <div className="card virtual-tour-card">
          <h3>🌐 Virtualna Setnja - {venue.name}</h3>
          <div className="virtual-tour-container">
            <iframe
              src={venue.virtual_tour_url}
              width="100%"
              height="500"
              frameBorder="0"
              allowFullScreen
              title="Virtual Tour"
              style={{ borderRadius: "12px" }}
            />
          </div>
          <p className="virtual-tour-hint">
            Koristite mis za rotaciju pogleda. Kliknite na tocke za kretanje.
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
                    src={`http://localhost:5000${selectedPhoto.file_path}`}
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
                          src={`http://localhost:5000${photo.file_path}`}
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
