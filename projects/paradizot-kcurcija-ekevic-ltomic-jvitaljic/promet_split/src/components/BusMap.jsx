import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Bus } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Bus Icon
const busIconMarkup = renderToStaticMarkup(
    <div style={{ color: '#facc15', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
        <Bus size={32} fill="#1a1a1a" />
    </div>
);

const customBusIcon = L.divIcon({
    html: busIconMarkup,
    className: 'custom-bus-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const BusMap = () => {
    const splitPosition = [43.508133, 16.440193];

    const buses = [
        { id: 1, lat: 43.510, lng: 16.445, line: '37' },
        { id: 2, lat: 43.505, lng: 16.435, line: '60' },
        { id: 3, lat: 43.512, lng: 16.450, line: '18' },
        { id: 4, lat: 43.500, lng: 16.460, line: '8' },
        { id: 5, lat: 43.515, lng: 16.430, line: '9' }
    ];

    return (
        <div style={{ height: 'calc(100vh - 80px)', width: '100%', position: 'relative' }}>
            <MapContainer
                center={splitPosition}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {buses.map(bus => (
                    <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={customBusIcon}>
                        <Popup>
                            <strong>Bus Linija: {bus.line}</strong><br />
                            Smjer: Centar
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Search Overlay Mock */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                right: '1rem',
                zIndex: 1000,
                background: 'rgba(30, 41, 59, 0.9)',
                backdropFilter: 'blur(8px)',
                padding: '1rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                color: 'white',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
            }}>
                <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sustav aktivan • 5 buseva u blizini</span>
            </div>
        </div>
    );
};

export default BusMap;
