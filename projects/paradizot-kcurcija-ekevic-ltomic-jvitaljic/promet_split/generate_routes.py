import json
import math
import requests
from typing import List, Tuple

# Real stations from BusMap.jsx
stations = [
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
]

def get_osrm_route(start: List[float], end: List[float]) -> List[List[float]]:
    """
    Get route coordinates from OSRM (Open Source Routing Machine)
    Uses the public demo API
    """
    try:
        # OSRM API format: lng,lat (reversed from our format)
        url = f"https://router.project-osrm.org/route/v1/driving/{start[1]},{start[0]};{end[1]},{end[0]}"
        params = {
            "steps": "false",
            "geometries": "geojson",
            "overview": "full"
        }
        
        response = requests.get(url, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data['code'] == 'Ok' and len(data['routes']) > 0:
                # Extract coordinates from GeoJSON, convert back to [lat, lng]
                coords = data['routes'][0]['geometry']['coordinates']
                return [[coord[1], coord[0]] for coord in coords]
    except Exception as e:
        print(f"  ⚠️  OSRM API error for route {start} -> {end}: {e}")
    
    # Fallback: linear interpolation if API fails
    return interpolate_points(start, end, 40)

def interpolate_points(start, end, num_points):
    """Interpolate points between two coordinates"""
    points = []
    for i in range(num_points):
        t = i / (num_points - 1) if num_points > 1 else 0
        lat = start[0] + (end[0] - start[0]) * t
        lng = start[1] + (end[1] - start[1]) * t
        points.append([lat, lng])
    return points
    return points

# Generate full path with routes from OSRM or interpolation
# For a route with 35 stations, get realistic routes between each pair
full_path = []

for i in range(len(stations) - 1):
    start = stations[i]
    end = stations[i + 1]
    
    print(f"📍 Fetching route {i+1}/{len(stations)-1}: Station {i+1} -> {i+2}...", end=" ")
    
    # Try to get route from OSRM, fallback to interpolation
    route_coords = get_osrm_route(start, end)
    
    # Add all points except the last one (to avoid duplication at station)
    full_path.extend(route_coords[:-1])
    
    print(f"✓ {len(route_coords)} waypoints")

# Add the final station
full_path.append(stations[-1])

print(f"\n✅ Generated {len(full_path)} waypoints from {len(stations)} stations")

# Create the routes.json structure
routes_data = {
    "fullPath": full_path,
    "stations": stations
}

# Write to file
output_path = "src/routes.json"
with open(output_path, 'w') as f:
    json.dump(routes_data, f)

print(f"✅ Saved {output_path}")
print(f"   - Full path: {len(full_path)} waypoints")
print(f"   - Stations: {len(stations)}")
