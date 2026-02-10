import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Bus } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useState, useEffect } from 'react';
import routesData from '../../../routes.json';

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

// Support both local development and Codespaces
const getApiBase = () => {
    if (typeof window === 'undefined') return 'http://localhost:5000/api';

    const { hostname, protocol } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }

    if (hostname.includes('github.dev') || hostname.includes('githubpreview.dev')) {
        const serverHostname = hostname.replace(/-\d+\./, '-5000.');
        return `${protocol}//${serverHostname}/api`;
    }

    return `${protocol}//${hostname}:5000/api`;
};

const API_BASE = getApiBase();

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

// Station coordinates in order
const stations = [
    [43.507059808573985, 16.483364568440102],
    [43.50671936644157, 16.48251162597341],
    [43.50630305173669, 16.479051576400675],
    [43.50803832586396, 16.47647665566317],
    [43.509038225738884, 16.47455082959841],
    [43.50763369241433, 16.470447049897746],
    [43.50655595353409, 16.463762985062353],
    [43.506076905949605, 16.460878181023173],
    [43.50520924692942, 16.455728339843347],
    [43.50551560743678, 16.450236102973044],
    [43.50735051888507, 16.442516193273732],
    [43.51287316822321, 16.44270394785081],
    [43.51451877721205, 16.441247508409713],
    [43.513843810640644, 16.43641953223417],
    [43.513120206958604, 16.431022927707343],
    [43.513085193661205, 16.427785501420416],
    [43.50431336797023, 16.423355759104766],
    [43.50296903553701, 16.427818954901586],
    [43.50329198933273, 16.428400994281304],
    [43.503389868337464, 16.427253653409362],
    [43.505323660826235, 16.42869936404932],
    [43.50477167739876, 16.42429987518264],
    [43.51314050174694, 16.429639217358364],
    [43.513004338844226, 16.435076055047627],
    [43.5137318342322, 16.437913832206192],
    [43.51283755230982, 16.44245709408719],
    [43.507391152496176, 16.442372609940183],
    [43.50490458263364, 16.44989730745084],
    [43.50521951764926, 16.45687488550842],
    [43.505775910203454, 16.460238375624993],
    [43.506631888732976, 16.465584018153038],
    [43.50793139657243, 16.471983768892283],
    [43.508349645393196, 16.476047315533002],
    [43.50569420253361, 16.4795395516486],
    [43.507040500628484, 16.483334933103244]
];


const BusMap = () => {
    const splitPosition = [43.508133, 16.440193];
    const [currentTime, setCurrentTime] = useState(new Date());
    const [buses, setBuses] = useState([]);
    const [stationEtas, setStationEtas] = useState([]);
    const [error, setError] = useState(null);

    const [showMap, setShowMap] = useState(false);
    const [fullRoutePath, setFullRoutePath] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);

    // Load route data on mount - loads from routes.json file (instant!)
    useEffect(() => {
        console.log('📍 Loading routes from routes.json file...');
        const pathData = routesData?.fullPath || stations;
        console.log(`📍 Total waypoints: ${pathData.length}\n`);

        setFullRoutePath(pathData);
    }, []);

    // Update buses every second from server simulator
    useEffect(() => {
        const fetchBuses = async () => {
            try {
                const res = await fetch(`${API_BASE}/buses`);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                const activeBuses = data.buses || [];

                setBuses(activeBuses);
                setCurrentTime(new Date());
                setError(null);

                if (activeBuses.length > 0) {
                    const primaryBusId = activeBuses[0].id;
                    const detailRes = await fetch(`${API_BASE}/bus/${primaryBusId}/stations`);
                    if (detailRes.ok) {
                        const detailData = await detailRes.json();
                        if (detailData.route && detailData.route.length > 0) {
                            setFullRoutePath(detailData.route);
                        }
                        setStationEtas(detailData.stations || []);
                    }
                } else {
                    setStationEtas([]);
                }
            } catch (err) {
                console.error('Error fetching buses:', err);
                setError('Ne mogu dohvatiti podatke o autobusima.');
            }
        };

        fetchBuses();

        const interval = setInterval(fetchBuses, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ height: 'calc(100vh - 80px)', width: '100%', position: 'relative' }}>
            {!showMap ? (
                <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.5)',
                    gap: '1.5rem'
                }}>
                    <h2 style={{ color: 'white', fontSize: '1.5rem' }}>Praćenje Autobusa</h2>
                    <button
                        onClick={() => setShowMap(true)}
                        style={{
                            padding: '0.75rem 2rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        Prikaži Kartu
                    </button>
                </div>
            ) : (
                <>
                    <MapContainer
                        center={splitPosition}
                        zoom={14}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />

                        {/* Route line - follows actual roads from OSRM or shows stations as fallback */}
                        <Polyline
                            positions={fullRoutePath.length > 0 ? fullRoutePath : stations}
                            color="#2563eb"
                            weight={5}
                            opacity={0.85}
                            dashArray="5, 5"
                        />

                        {/* Station markers */}
                        {stations.map((station, idx) => (
                            <Marker
                                key={`station-${idx}`}
                                position={station}
                                icon={L.icon({
                                    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzM3NzBmMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTEyIDE1YzEuNjYgMCAzLTEuMzQgMy0zcy0xLjM0LTMtMy0zLTMgMS4zNC0zIDMgMS4zNCAzIDMgMyIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
                                    iconSize: [28, 28],
                                    iconAnchor: [14, 14],
                                    className: selectedStation === idx ? 'selected-station' : ''
                                })}
                                eventHandlers={{
                                    click: () => setSelectedStation(selectedStation === idx ? null : idx)
                                }}
                            >
                                {selectedStation === idx && (
                                    <Popup onClose={() => setSelectedStation(null)} autoOpen={true}>
                                        <div style={{ fontSize: '13px', minWidth: '240px', padding: '5px 0' }}>
                                            <strong style={{ fontSize: '15px', display: 'block', marginBottom: '8px' }}>📍 Stanica {idx + 1}</strong>
                                            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                                            {(() => {
                                                const etaData = stationEtas[idx];

                                                if (!etaData) {
                                                    return <span style={{ color: '#666', fontSize: '12px' }}>Nema dostupnih podataka</span>;
                                                }

                                                const minsTillArrival = etaData.minutesUntil;
                                                let color = '#ef4444';
                                                let label = `Za ${minsTillArrival} min`;

                                                if (minsTillArrival <= 0) {
                                                    color = '#22c55e';
                                                    label = 'Stižu sada!';
                                                } else if (minsTillArrival <= 2) {
                                                    color = '#f97316';
                                                    label = `Za ${minsTillArrival} min (Uskoro!)`;
                                                } else if (minsTillArrival <= 5) {
                                                    color = '#eab308';
                                                    label = `Za ${minsTillArrival} min`;
                                                }

                                                return (
                                                    <>
                                                        <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '13px' }}>🚌 Dolazak autobusa:</div>
                                                        <div style={{
                                                            padding: '8px 10px',
                                                            marginBottom: '5px',
                                                            backgroundColor: `${color}15`,
                                                            border: `1px solid ${color}40`,
                                                            borderLeft: `4px solid ${color}`,
                                                            borderRadius: '3px',
                                                            fontSize: '12px'
                                                        }}>
                                                            <strong style={{ color: color, fontSize: '12px' }}>{label}</strong>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </Popup>
                                )}
                            </Marker>
                        ))}

                        {/* Station info popup - removed as it's now part of Marker popups above */}

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
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sustav aktivan • {buses.length} buseva u vožnji</span>
                        <span style={{ fontSize: '0.75rem', marginLeft: 'auto', opacity: 0.7 }}>
                            {currentTime.toLocaleTimeString()}
                        </span>
                        {error && (
                            <span style={{ fontSize: '0.75rem', marginLeft: '1rem', color: '#fca5a5' }}>{error}</span>
                        )}
                        <button
                            onClick={() => setShowMap(false)}
                            style={{
                                marginLeft: '1rem',
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.8rem',
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            Zatvori
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default BusMap;
