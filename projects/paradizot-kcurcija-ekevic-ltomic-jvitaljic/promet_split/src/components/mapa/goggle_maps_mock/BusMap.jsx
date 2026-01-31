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

// Timetable: departure times for buses (in minutes from midnight) - buses every hour at :20 and :50
const timetable = [
    320, 350,   // 05:20, 05:50
    380, 410,   // 06:20, 06:50
    440, 470,   // 07:20, 07:50
    500, 530,   // 08:20, 08:50
    560, 590,   // 09:20, 09:50
    620, 650,   // 10:20, 10:50
    680, 710,   // 11:20, 11:50
    740, 770,   // 12:20, 12:50
    800, 830,   // 13:20, 13:50
    860, 890,   // 14:20, 14:50
    920, 950,   // 15:20, 15:50
    980, 1010,  // 16:20, 16:50
    1040, 1070, // 17:20, 17:50
    1100, 1130, // 18:20, 18:50
    1160, 1190, // 19:20, 19:50
    1220, 1250, // 20:20, 20:50
    1280, 1310, // 21:20, 21:50
    1340, 1370, // 22:20, 22:50
    1400, 1430, // 23:20, 23:50
    20, 50,     // 00:20, 00:50
    80          // 01:20
];

// Journey duration in minutes
const JOURNEY_DURATION = 95;

// Ensure fullPath is properly loaded from routes.json


// Fetch highly detailed route from OSRM (like Google Maps)


// Calculate distance between two lat/lng points in km
const haversineDistance = ([lat1, lng1], [lat2, lng2]) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Function to calculate position along the route
const getPositionAlongRoute = (elapsedMinutes, routeData) => {
    if (!routeData || routeData.length === 0) {
        return null;
    }

    // Simple linear interpolation based on elapsed time
    // Bus travels entire route in JOURNEY_DURATION minutes
    const progressRatio = Math.max(0, Math.min(1, elapsedMinutes / JOURNEY_DURATION));

    // Find position in the waypoints array based on progress
    const targetIndex = progressRatio * (routeData.length - 1);
    const currentIndex = Math.floor(targetIndex);
    const nextIndex = Math.ceil(targetIndex);

    // If we're at the start or have exact match
    if (currentIndex === nextIndex || currentIndex >= routeData.length - 1) {
        return routeData[Math.min(currentIndex, routeData.length - 1)];
    }

    // Linear interpolation between two waypoints
    const [lat1, lng1] = routeData[currentIndex];
    const [lat2, lng2] = routeData[nextIndex];
    const localProgress = targetIndex - currentIndex;

    const lat = lat1 + (lat2 - lat1) * localProgress;
    const lng = lng1 + (lng2 - lng1) * localProgress;

    return [lat, lng];
};

// Calculate distance-based station arrival times
const calculateStationArrivalTimes = (fullPath) => {
    if (!fullPath || fullPath.length === 0) {
        return stations.map((_, idx) => idx * (JOURNEY_DURATION / (stations.length - 1)));
    }

    // Map each station to its closest waypoint and calculate cumulative time
    const stationTimes = [];

    const totalRouteDistance = calculatePathDistance(fullPath);

    for (let i = 0; i < stations.length; i++) {
        // Find closest waypoint to this station
        let closestIndex = 0;
        let closestDistance = Infinity;

        for (let j = 0; j < fullPath.length; j++) {
            const dist = haversineDistance(stations[i], fullPath[j]);
            if (dist < closestDistance) {
                closestDistance = dist;
                closestIndex = j;
            }
        }

        // Calculate distance up to this waypoint
        const distanceToStation = calculatePathDistance(fullPath.slice(0, closestIndex + 1));
        const timeMinutes = (distanceToStation / totalRouteDistance) * JOURNEY_DURATION;
        stationTimes.push(Math.max(0, timeMinutes));
    }

    return stationTimes;
};

// Calculate total path distance in km
const calculatePathDistance = (path) => {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        total += haversineDistance(path[i], path[i + 1]);
    }
    return total;
};

const BusMap = () => {
    const splitPosition = [43.508133, 16.440193];
    const [currentTime, setCurrentTime] = useState(new Date());
    const [buses, setBuses] = useState([]);

    const [showMap, setShowMap] = useState(false);
    const [fullRoutePath, setFullRoutePath] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [stationArrivalTimes, setStationArrivalTimes] = useState([]);

    // Load route data on mount - loads from routes.json file (instant!)
    useEffect(() => {
        console.log('📍 Loading routes from routes.json file...');
        const pathData = routesData?.fullPath || stations;
        console.log(`📍 Total waypoints: ${pathData.length}\n`);

        setFullRoutePath(pathData);
        const times = calculateStationArrivalTimes(pathData);
        setStationArrivalTimes(times);
    }, []);

    // Update buses every second
    useEffect(() => {
        const updateBuses = () => {
            // Use fullRoutePath directly - same as the blue line
            // Only fall back to stations if we have no route data
            const pathToUse = fullRoutePath.length > 0 ? fullRoutePath : stations;

            // Log on first render only
            if (!window.busPathLogged) {
                window.busPathLogged = true;
                console.log('\n📍 BUS PATH INFO:');
                console.log(`Total waypoints in path: ${pathToUse.length}`);
                console.log(`Using: ${fullRoutePath.length > 0 ? 'OSRM roads' : 'Station fallback'}`);
                console.log(`Blue line waypoints: ${fullRoutePath.length}`);
                console.log(`Bus using waypoints: ${pathToUse.length}`);
                if (pathToUse.length > 0) {
                    console.log(`First point: [${pathToUse[0][0].toFixed(4)}, ${pathToUse[0][1].toFixed(4)}]`);
                    console.log(`Last point: [${pathToUse[pathToUse.length - 1][0].toFixed(4)}, ${pathToUse[pathToUse.length - 1][1].toFixed(4)}]\n`);
                }
            }

            const now = new Date();
            setCurrentTime(now);

            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const currentMinutes = hours * 60 + minutes + seconds / 60;

            const activeBuses = [];
            let busId = 0;

            // Check each departure time
            timetable.forEach(departureTime => {
                const elapsedMinutes = currentMinutes - departureTime;

                // Bus is active if it's between 0 and JOURNEY_DURATION minutes into its journey
                if (elapsedMinutes >= 0 && elapsedMinutes < JOURNEY_DURATION) {
                    // Use exact same path that draws the blue line
                    const position = getPositionAlongRoute(elapsedMinutes, pathToUse);
                    if (position && position.length === 2) {
                        activeBuses.push({
                            id: busId++,
                            lat: position[0],
                            lng: position[1],
                            line: '8',
                            elapsedMinutes: elapsedMinutes,
                            // Debug: store which waypoint index we're at
                            waypointIndex: Math.floor((elapsedMinutes / 95) * (pathToUse.length - 1))
                        });
                    }
                }
            });

            setBuses(activeBuses);
        };

        // Update immediately
        updateBuses();

        // Then update every 50ms for very smooth tracking
        const interval = setInterval(updateBuses, 50);
        return () => clearInterval(interval);
    }, [fullRoutePath]);

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
                                                const currentMin = currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60;
                                                const stationArrivalTime = stationArrivalTimes[idx] || 0;
                                                const arrivingBuses = timetable
                                                    .map(dep => ({ departure: dep, arrival: dep + stationArrivalTime }))
                                                    .filter(b => b.arrival > currentMin)
                                                    .slice(0, 5);

                                                if (arrivingBuses.length === 0) {
                                                    return <span style={{ color: '#666', fontSize: '12px' }}>Nema autobusa u naredne 2h</span>;
                                                }

                                                return (
                                                    <>
                                                        <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '13px' }}>🚌 Dolazak autobusa:</div>
                                                        {arrivingBuses.map((bus, i) => {
                                                            const minsTillArrival = Math.round(bus.arrival - currentMin);
                                                            const hours = Math.floor(bus.arrival / 60) % 24;
                                                            const mins_only = Math.round(bus.arrival % 60);
                                                            const timeStr = `${hours.toString().padStart(2, '0')}:${mins_only.toString().padStart(2, '0')}`;

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
                                                                <div key={i} style={{
                                                                    padding: '8px 10px',
                                                                    marginBottom: '5px',
                                                                    backgroundColor: `${color}15`,
                                                                    border: `1px solid ${color}40`,
                                                                    borderLeft: `4px solid ${color}`,
                                                                    borderRadius: '3px',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    <strong style={{ color: color, fontSize: '12px' }}>{timeStr}</strong> - {label}
                                                                </div>
                                                            );
                                                        })}
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
