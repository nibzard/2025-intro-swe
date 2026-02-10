import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';

// Support both local development and Codespaces
const getApiBase = () => {
    if (typeof window === 'undefined') return 'http://localhost:5000/api';

    const { hostname, protocol } = window.location;

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }

    // GitHub Codespaces - use the same protocol (https) and replace port in URL
    // Codespaces URLs look like: https://username-repository-port.preview.app.github.dev
    if (hostname.includes('github.dev') || hostname.includes('githubpreview.dev')) {
        // Replace the main app port with server port (5000) in the hostname
        const serverHostname = hostname.replace(/-\d+\./, '-5000.');
        return `${protocol}//${serverHostname}/api`;
    }

    // Fallback for other environments
    return `${protocol}//${hostname}:5000/api`;
};

const API_BASE = getApiBase();
console.log('TrackingApp - API_BASE initialized:', API_BASE);

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
    const [error, setError] = useState(null);

    // Debug logging
    console.log('TrackingApp - Current state:', { step, selectedLine, linesCount: lines.length });
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
                console.log('Fetching lines from:', `${API_BASE}/lines`);
                const res = await fetch(`${API_BASE}/lines`);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                console.log('Lines fetched:', data);
                setLines(data.lines);
                setError(null);
            } catch (err) {
                console.error('Error fetching lines:', err);
                setError(`Failed to fetch lines: ${err.message}`);
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
                console.log('Fetching buses from:', `${API_BASE}/buses?line=${selectedLine}`);
                const res = await fetch(`${API_BASE}/buses?line=${selectedLine}`);
                const data = await res.json();
                console.log('Buses fetched:', data);
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
                {/* Debug Panel */}
                <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid #3b82f6',
                    color: '#93c5fd',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    marginBottom: '1rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace'
                }}>
                    <div><strong>🔍 Debug Info:</strong></div>
                    <div>API_BASE: {API_BASE}</div>
                    <div>Lines count: {lines.length}</div>
                    <div>Step: {step}</div>
                    {error && <div style={{ color: '#fca5a5' }}>Error: {error}</div>}
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        ⚠️ {error}
                        <br />
                        <small>API Base: {API_BASE}</small>
                    </div>
                )}
                <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Odaberi liniju</h2>
                {lines.length === 0 && !error && (
                    <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                        Učitavanje linija...
                    </div>
                )}
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
