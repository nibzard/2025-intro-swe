import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const FleetTracker = () => {
    // Mock bus data - Replace with real API data
    const buses = [
        { id: 1, name: 'Bus 1', lat: 43.5081, lng: 16.4402, route: 'Line 1' },
        { id: 2, name: 'Bus 2', lat: 43.5100, lng: 16.4500, route: 'Line 2' },
        { id: 3, name: 'Bus 3', lat: 43.5150, lng: 16.4350, route: 'Line 3' },
    ];

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '2rem', height: '100%' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Lokacija Autobusa</h1>
            </header>

            <div style={{
                borderRadius: '1.5rem',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                height: 'calc(100vh - 250px)',
                minHeight: '400px'
            }}>
                <MapContainer
                    center={[43.5081, 16.4402]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    {buses.map((bus) => (
                        <Marker key={bus.id} position={[bus.lat, bus.lng]}>
                            <Popup>
                                <div>
                                    <strong>{bus.name}</strong>
                                    <p style={{ margin: '0.5rem 0 0' }}>{bus.route}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default FleetTracker;
