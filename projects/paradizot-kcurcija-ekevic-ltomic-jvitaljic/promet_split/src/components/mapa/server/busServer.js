import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure CORS for both local and Codespaces environments
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);

        // Allow localhost
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }

        // Allow GitHub Codespaces domains
        if (origin.includes('github.dev') || origin.includes('githubpreview.dev') || origin.includes('app.github.dev')) {
            return callback(null, true);
        }

        callback(null, true); // Allow all for development
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Load routes data
let routesData = { fullPath: null };
try {
    const routesPath = path.join(__dirname, '../../../routes.json');
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    routesData = JSON.parse(routesContent);
} catch (err) {
    console.warn('Could not load routes.json, using default stations');
}

// Station coordinates (same as in BusMap)
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

// Timetable (same as in BusMap)
const timetable = [
    320, 350, 380, 410, 440, 470, 500, 530, 560, 590,
    620, 650, 680, 710, 740, 770, 800, 830, 860, 890,
    920, 950, 980, 1010, 1040, 1070, 1100, 1130, 1160, 1190,
    1220, 1250, 1280, 1310, 1340, 1370, 1400, 1430, 20, 50, 80
];

const JOURNEY_DURATION = 95; // minutes
const BUS_LINE = '8';

// Get route data (use routes.json if available, fallback to stations)
let fullRoutePath = (routesData?.fullPath || stations);

// Helper functions
const haversineDistance = ([lat1, lng1], [lat2, lng2]) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Calculate station arrival times
const calculateStationArrivalTimes = (routeData) => {
    let totalDistance = 0;
    const distances = [0];

    for (let i = 1; i < routeData.length; i++) {
        totalDistance += haversineDistance(routeData[i - 1], routeData[i]);
        distances.push(totalDistance);
    }

    const avgSpeed = totalDistance / JOURNEY_DURATION;
    return stations.map(station => {
        let minDist = Infinity;
        let closestIdx = 0;
        for (let i = 0; i < routeData.length; i++) {
            const dist = haversineDistance(station, routeData[i]);
            if (dist < minDist) {
                minDist = dist;
                closestIdx = i;
            }
        }
        return closestIdx > 0 ? distances[closestIdx] / avgSpeed : 0;
    });
};

const stationArrivalTimes = calculateStationArrivalTimes(fullRoutePath);

// Get position along route
const getPositionAlongRoute = (elapsedMinutes, routeData) => {
    if (!routeData || routeData.length === 0) return null;

    const progressRatio = Math.max(0, Math.min(1, elapsedMinutes / JOURNEY_DURATION));
    const targetIndex = progressRatio * (routeData.length - 1);
    const currentIndex = Math.floor(targetIndex);
    const nextIndex = Math.ceil(targetIndex);

    if (currentIndex === nextIndex || currentIndex >= routeData.length - 1) {
        return routeData[Math.min(currentIndex, routeData.length - 1)];
    }

    const [lat1, lng1] = routeData[currentIndex];
    const [lat2, lng2] = routeData[nextIndex];
    const localProgress = targetIndex - currentIndex;

    return [
        lat1 + (lat2 - lat1) * localProgress,
        lng1 + (lng2 - lng1) * localProgress
    ];
};

// Get all active buses
const getActiveBuses = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const currentMinutes = hours * 60 + minutes + seconds / 60;

    const activeBuses = [];

    timetable.forEach((departureTime, index) => {
        const elapsedMinutes = currentMinutes - departureTime;

        if (elapsedMinutes >= 0 && elapsedMinutes < JOURNEY_DURATION) {
            const position = getPositionAlongRoute(elapsedMinutes, fullRoutePath);
            if (position && position.length === 2) {
                activeBuses.push({
                    id: index,
                    lat: position[0],
                    lng: position[1],
                    line: BUS_LINE,
                    elapsedMinutes: elapsedMinutes,
                    departureTime: departureTime
                });
            }
        }
    });

    return activeBuses;
};

// API Routes
app.get('/api/lines', (req, res) => {
    try {
        res.json({ lines: [BUS_LINE] });
    } catch (err) {
        console.error('Error in /api/lines:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/buses', (req, res) => {
    try {
        const line = req.query.line;
        const buses = getActiveBuses();
        const filtered = line ? buses.filter(b => b.line === line) : buses;
        res.json({ buses: filtered });
    } catch (err) {
        console.error('Error in /api/buses:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/bus/:busId', (req, res) => {
    try {
        const buses = getActiveBuses();
        const bus = buses.find(b => b.id === parseInt(req.params.busId));

        if (!bus) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        res.json({ bus });
    } catch (err) {
        console.error('Error in /api/bus/:busId:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/bus/:busId/stations', (req, res) => {
    try {
        const buses = getActiveBuses();
        const bus = buses.find(b => b.id === parseInt(req.params.busId));

        if (!bus) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        const now = new Date();
        const currentMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

        const stationsWithEta = stations.map((station, idx) => {
            const arrivalTime = bus.departureTime + stationArrivalTimes[idx];
            const minutesUntil = Math.round(arrivalTime - currentMin);

            return {
                id: idx,
                number: idx + 1,
                coordinates: station,
                minutesUntil: minutesUntil > 0 ? minutesUntil : 0,
                arrivalTime: arrivalTime
            };
        });

        res.json({
            bus: bus,
            stations: stationsWithEta,
            route: fullRoutePath
        });
    } catch (err) {
        console.error('Error in /api/bus/:busId/stations:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚌 Bus Tracking Server running on port ${PORT}`);
    console.log(`Routes loaded: ${fullRoutePath.length} waypoints`);
    console.log(`Stations: ${stations.length}`);
    console.log(`Timetable: ${timetable.length} departures`);
});
