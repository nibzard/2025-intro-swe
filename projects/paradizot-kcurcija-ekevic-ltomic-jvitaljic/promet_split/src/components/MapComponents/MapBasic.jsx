import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Define Fixed Stations in Split
const BUS_LINES = [
  { id: "7", color: "#FFD700", start: [43.5147, 16.4435], end: [43.509, 16.450] },
  { id: "8", color: "#FFD700", start: [43.5081, 16.4589], end: [43.515, 16.435] },
  { id: "9", color: "#FFD700", start: [43.5051, 16.4427], end: [43.5114, 16.4687] }
];

// 2. Custom Icon for the Bus (Yellow Circle with Number)
const createBusIcon = (number) => L.divIcon({
  html: `<div style="background-color: yellow; width: 30px; height: 30px; border-radius: 50%; border: 2px solid black; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: black; box-shadow: 2px 2px 5px rgba(0,0,0,0.3);">${number}</div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const BusTracker = () => {
  const [busData, setBusData] = useState([]);
  const [isActive, setIsActive] = useState(false);

  // 3. Fetch Routes only when "Prati kartu" is clicked
  const handleStartTracking = async () => {
    const routes = await Promise.all(BUS_LINES.map(async (line) => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${line.start[1]},${line.start[0]};${line.end[1]},${line.end[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        return { ...line, route: coords, currentStep: 0 };
      } catch (e) {
        console.error("OSRM Error:", e);
        return null;
      }
    }));
    setBusData(routes.filter(r => r !== null));
    setIsActive(true);
  };

  // 4. Animation loop
  useEffect(() => {
    if (!isActive || busData.length === 0) return;

    const interval = setInterval(() => {
      setBusData(prevData => prevData.map(bus => ({
        ...bus,
        currentStep: (bus.currentStep + 1) % bus.route.length
      })));
    }, 150);

    return () => clearInterval(interval);
  }, [isActive, busData.length]);

  return (
    <div style={{ padding: '20px' }}>
      {/* The Trigger Button */}
      {!isActive && (
        <button 
          onClick={handleStartTracking}
          style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '10px' }}
        >
          Prati kartu
        </button>
      )}

      <div style={{ height: '600px', width: '100%', border: '2px solid #ccc' }}>
        <MapContainer center={[43.51, 16.45]} zoom={13} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Always show Stations */}
          {BUS_LINES.map(line => (
            <React.Fragment key={`station-${line.id}`}>
              <Marker position={line.start}><Popup>Start Linija {line.id}</Popup></Marker>
              <Marker position={line.end}><Popup>Kraj Linija {line.id}</Popup></Marker>
            </React.Fragment>
          ))}

          {/* Show Paths and Moving Buses only when Active */}
          {isActive && busData.map((bus) => (
            <React.Fragment key={`active-${bus.id}`}>
              <Polyline 
                positions={bus.route} 
                pathOptions={{ color: 'blue', weight: 4, opacity: 0.5, dashArray: '10, 10' }} 
              />
              <Marker position={bus.route[bus.currentStep]} icon={createBusIcon(bus.id)}>
                <Popup>Bus {bus.id} u pokretu</Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default BusTracker;