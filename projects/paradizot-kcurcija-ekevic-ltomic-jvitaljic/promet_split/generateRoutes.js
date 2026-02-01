// Script to pre-fetch and cache all routes from OSRM
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function fetchRoute(start, end, retries = 3) {
    const [lat1, lng1] = start;
    const [lat2, lng2] = end;
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full`;
    
    try {
        console.log(`Fetching segment: [${lat1.toFixed(4)}, ${lng1.toFixed(4)}] -> [${lat2.toFixed(4)}, ${lng2.toFixed(4)}]`);
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates;
            const roadPoints = coords.map(([lng, lat]) => [lat, lng]);
            console.log(`✓ Loaded: ${roadPoints.length} waypoints, distance: ${(data.routes[0].distance / 1000).toFixed(2)}km`);
            return roadPoints;
        } else if (data.code === 'NoRoute' && retries > 0) {
            console.log(`No route found, retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, 1000));
            return fetchRoute(start, end, retries - 1);
        }
        
        console.log(`Fallback to straight line`);
        return [start, end];
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return [start, end];
    }
}

async function generateRoutes() {
    console.log('🚀 Starting route generation...\n');
    
    const routes = [];
    let totalWaypoints = 0;
    
    for (let i = 0; i < stations.length - 1; i++) {
        console.log(`\n[${i + 1}/${stations.length - 1}]`);
        const route = await fetchRoute(stations[i], stations[i + 1]);
        routes.push(route);
        totalWaypoints += route.length;
        
        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
    }
    
    const routeData = {
        routes,
        lastUpdated: new Date().toISOString(),
        stations: stations.length,
        segments: routes.length,
        totalWaypoints,
        metadata: {
            description: 'Pre-calculated route data for bus line 8 in Split',
            source: 'OSRM (Open Source Routing Machine)',
            version: '1.0'
        }
    };
    
    const outputPath = path.join(__dirname, 'src', 'data', 'routeData.json');
    fs.writeFileSync(outputPath, JSON.stringify(routeData, null, 2));
    
    console.log(`\n✅ Route generation complete!`);
    console.log(`📊 Total waypoints: ${totalWaypoints}`);
    console.log(`📁 Saved to: ${outputPath}\n`);
}

generateRoutes().catch(console.error);
