// src/MapComponent.jsx
import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Fix for default marker icons ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
// ------------------------------------

function ResizeHandler({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    // run on the next tick so layout is ready
    setTimeout(() => {
      map.invalidateSize();
      map.setView(center, zoom);
    }, 0);
  }, [map, center, zoom]);
  return null;
}

const MapComponent = ({ center = [43.5081, 16.4402], zoom = 13 }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      // run on next tick so layout is ready
      setTimeout(() => {
        mapRef.current.invalidateSize();
        mapRef.current.setView(center, zoom);
      }, 0);
    }
  }, [center, zoom]);

  return (
    <div style={{ height: '100%', width: '100%', minHeight: 400 }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeHandler center={center} zoom={zoom} />
        <Marker position={center}>
          <Popup>Split, Hrvatska</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;