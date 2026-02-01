import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Bus, ChevronLeft } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

const API_BASE = 'http://localhost:5000/api';

// Custom Bus Icon
const busIconMarkup = renderToStaticMarkup(
    <div style={{ color: '#facc15', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
        <Bus size={20} fill="#1a1a1a" />
    </div>
);

const customBusIcon = L.divIcon({
    html: busIconMarkup,
    className: 'custom-bus-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const TrackingApp = () => {
    const [step, setStep] = useState('lines'); // lines, buses, tracking
    const [lines, setLines] = useState([]);
    const [selectedLine, setSelectedLine] = useState(null);
    const [buses, setBuses] = useState([]);
    const [selectedBus, setSelectedBus] = useState(null);
    const [busDetails, setBusDetails] = useState(null);
    const [stations, setStations] = useState([]);
    const [route, setRoute] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);

    // Fetch available lines
    useEffect(() => {
        const fetchLines = async () => {
            try {
                const res = await fetch(`${API_BASE}/lines`);
                const data = await res.json();
                setLines(data.lines);
            } catch (err) {
                console.error('Error fetching lines:', err);
            }
        };

        if (step === 'lines') {
            fetchLines();
        }
    }, [step]);

    // Fetch buses for selected line
    useEffect(() => {
        if (step !== 'buses' || !selectedLine) return;

        const fetchBuses = async () => {
            try {
                const res = await fetch(`${API_BASE}/buses?line=${selectedLine}`);
                const data = await res.json();
                setBuses(data.buses);
            } catch (err) {
                console.error('Error fetching buses:', err);
            }
        };

        fetchBuses();
        const interval = setInterval(fetchBuses, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, [step, selectedLine]);

    // Fetch bus details and track
    useEffect(() => {
        if (step !== 'tracking' || selectedBus === null) return;

        const fetchBusDetails = async () => {
            try {
                const res = await fetch(`${API_BASE}/bus/${selectedBus}/stations`);
                const data = await res.json();
                setBusDetails(data.bus);
                setStations(data.stations);
                setRoute(data.route);
                setCurrentTime(new Date());
            } catch (err) {
                console.error('Error fetching bus details:', err);
            }
        };

        fetchBusDetails();
        const interval = setInterval(fetchBusDetails, 1000); // Update every second
        return () => clearInterval(interval);
    }, [step, selectedBus]);

    const handleSelectLine = (line) => {
        setSelectedLine(line);
        setStep('buses');
    };

    const handleSelectBus = (bus) => {
        setSelectedBus(bus.id);
        setStep('tracking');
    };

    const handleBack = () => {
        if (step === 'tracking') {
            setStep('buses');
            setSelectedBus(null);
            setBusDetails(null);
            setStations([]);
            setRoute([]);
        } else if (step === 'buses') {
            setStep('lines');
            setSelectedLine(null);
            setBuses([]);
        }
    };

    // Lines View
    if (step === 'lines') {
        return (
            <div style={{ padding: '2rem', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Odaberi liniju</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                    {lines.map(line => (
                        <button
                            key={line}
                            onClick={() => handleSelectLine(line)}
                            style={{
                                padding: '1.5rem',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            Linija {line}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Buses View
    if (step === 'buses') {
        return (
            <div style={{ padding: '2rem', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 style={{ color: 'white', margin: 0 }}>Aktivni autobusi - Linija {selectedLine}</h2>
                </div>

                {buses.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                        Nema aktivnih autobusa na ovoj liniji
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {buses.map(bus => (
                            <button
                                key={bus.id}
                                onClick={() => handleSelectBus(bus)}
                                style={{
                                    padding: '1.5rem',
                                    background: 'rgba(58, 134, 255, 0.2)',
                                    border: '2px solid var(--color-primary)',
                                    borderRadius: '0.5rem',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(58, 134, 255, 0.3)';
                                    e.target.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(58, 134, 255, 0.2)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>Autobus {bus.id + 1}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
                                    Putovanja: {Math.round(bus.elapsedMinutes)}/{95} min
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Tracking View
    if (step === 'tracking' && busDetails) {
        return (
            <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.9)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h3 style={{ color: 'white', margin: 0 }}>Linija {busDetails.line}</h3>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            Autobus {busDetails.id + 1} • {Math.round(busDetails.elapsedMinutes)}/{95} min
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer
                        center={[43.51, 16.44]}
                        zoom={14}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />

                        {/* Route line */}
                        {route.length > 0 && (
                            <Polyline
                                positions={route.map(p => [p[0], p[1]])}
                                color="#3a86ff"
                                weight={3}
                                opacity={0.7}
                            />
                        )}

                        {/* Bus position */}
                        {busDetails && (
                            <Marker 
                                position={[busDetails.lat, busDetails.lng]} 
                                icon={customBusIcon}
                                eventHandlers={{
                                    add: (e) => {
                                        e.target.openPopup();
                                    }
                                }}
                            >
                                <Popup>
                                    <div style={{
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        background: '#facc15',
                                        borderRadius: '4px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                                    }}>
                                        🚌
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Station markers with ETA */}
                        {stations.map((station, idx) => (
                            <Marker
                                key={`station-${idx}`}
                                position={station.coordinates}
                                icon={L.icon({
                                    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzM3NzBmMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTEyIDE1YzEuNjYgMCAzLTEuMzQgMy0zcy0xLjM0LTMtMy0zLTMgMS4zNC0zIDMgMS4zNCAzIDMgMyIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
                                    iconSize: [28, 28],
                                    iconAnchor: [14, 14]
                                })}
                            >
                                <Popup>
                                    <div style={{
                                        padding: '8px 12px',
                                        textAlign: 'center',
                                        minWidth: '140px'
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                                            Stanica {station.number}
                                        </div>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: station.minutesUntil <= 2 ? '#ef4444' : (station.minutesUntil <= 5 ? '#eab308' : '#3a86ff')
                                        }}>
                                            {station.minutesUntil} min
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        );
    }

    return <div style={{ padding: '2rem', color: 'white' }}>Učitavanje...</div>;
};

export default TrackingApp;
