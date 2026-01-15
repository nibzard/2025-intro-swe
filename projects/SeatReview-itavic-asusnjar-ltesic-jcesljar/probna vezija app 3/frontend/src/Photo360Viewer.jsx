import React, { useState, useEffect } from "react";

function Photo360Viewer({ venueId }) {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, [venueId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/venues/${venueId}/360-photos`
      );
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
        if (data.length > 0) {
          setSelectedPhoto(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load 360 photos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="status">Loading 360° views...</div>;
  }

  if (photos.length === 0) {
    return (
      <div className="card">
        <p className="muted">No 360° photos available yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>360° Seat Views</h3>

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
                Section: {selectedPhoto.section || "N/A"} |
                Row: {selectedPhoto.row || "N/A"} |
                Seat: {selectedPhoto.seat_number || "N/A"}
              </strong>
            </div>
            <div className="photo-360-hint">
              💡 Drag image to look around (360° view simulation)
            </div>
          </div>
        </div>
      )}

      {/* Photo selector */}
      {photos.length > 1 && (
        <div className="photo-360-selector">
          <h4>Select Seat View:</h4>
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
                  <div>Sec: {photo.section || "?"}</div>
                  <div>Row: {photo.row || "?"}</div>
                  <div>Seat: {photo.seat_number || "?"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Photo360Viewer;
