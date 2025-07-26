export interface TrackPoint {
  lat: number;
  lon: number;
  elevation: number;
  distance: number; // Cumulative distance from start in miles
}

export interface ChartDataPoint {
  x: number; // distance
  y: number; // elevation
  coordinates: [number, number]; // [lon, lat]
  index: number;
}

export interface ElevationProfile {
  points: TrackPoint[];
  totalDistance: number;
  minElevation: number;
  maxElevation: number;
  elevationGain: number;
}

// Haversine formula to calculate distance between two lat/lon points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export async function parseGPXFile(gpxContent: string): Promise<ElevationProfile> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');

  const trackpoints = xmlDoc.querySelectorAll('trkpt');
  const points: TrackPoint[] = [];
  let cumulativeDistance = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  let lastElevation = 0;
  let elevationGain = 0;

  trackpoints.forEach((trkpt, index) => {
    const lat = parseFloat(trkpt.getAttribute('lat') || '0');
    const lon = parseFloat(trkpt.getAttribute('lon') || '0');
    const eleElement = trkpt.querySelector('ele');
    const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : 0;

    // Convert elevation from meters to feet
    const elevationFeet = elevation * 3.28084;

    // Calculate distance from previous point
    if (index > 0) {
      const prevPoint = points[index - 1];
      const segmentDistance = calculateDistance(prevPoint.lat, prevPoint.lon, lat, lon);
      cumulativeDistance += segmentDistance;
    }

    // Track elevation statistics
    minElevation = Math.min(minElevation, elevationFeet);
    maxElevation = Math.max(maxElevation, elevationFeet);

    // Calculate elevation gain (only positive changes)
    if (index > 0 && elevationFeet > lastElevation) {
      elevationGain += elevationFeet - lastElevation;
    }
    lastElevation = elevationFeet;

    points.push({
      lat,
      lon,
      elevation: elevationFeet,
      distance: cumulativeDistance
    });
  });

  return {
    points,
    totalDistance: cumulativeDistance,
    minElevation: minElevation === Infinity ? 0 : minElevation,
    maxElevation: maxElevation === -Infinity ? 0 : maxElevation,
    elevationGain
  };
}

// Get elevation at a specific distance along the route
export function getElevationAtDistance(profile: ElevationProfile, targetDistance: number): number {
  if (profile.points.length === 0) return 0;
  if (targetDistance <= 0) return profile.points[0].elevation;
  if (targetDistance >= profile.totalDistance) return profile.points[profile.points.length - 1].elevation;

  // Find the two points that bracket the target distance
  for (let i = 0; i < profile.points.length - 1; i++) {
    const currentPoint = profile.points[i];
    const nextPoint = profile.points[i + 1];

    if (targetDistance >= currentPoint.distance && targetDistance <= nextPoint.distance) {
      // Linear interpolation between the two points
      const ratio = (targetDistance - currentPoint.distance) / (nextPoint.distance - currentPoint.distance);
      return currentPoint.elevation + (nextPoint.elevation - currentPoint.elevation) * ratio;
    }
  }

  return profile.points[profile.points.length - 1].elevation;
}

// Convert elevation profile to Chart.js compatible data format
export function formatForChartJS(profile: ElevationProfile): ChartDataPoint[] {
  return profile.points.map((point, index) => ({
    x: point.distance,
    y: point.elevation,
    coordinates: [point.lon, point.lat],
    index
  }));
}

// Get Chart.js dataset configuration for elevation data
export function getElevationDataset(profile: ElevationProfile, options: {
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
} = {}) {
  const {
    fillColor = 'rgba(59, 130, 246, 0.1)',
    borderColor = 'rgba(59, 130, 246, 1)',
    borderWidth = 2
  } = options;

  return {
    label: 'Elevation',
    data: formatForChartJS(profile),
    fill: 'start',
    backgroundColor: fillColor,
    borderColor,
    borderWidth,
    pointRadius: 0,
    pointHoverRadius: 0,
    tension: 0.4,
    cubicInterpolationMode: 'monotone' as const,
  };
}

// Load and parse the route GPX file
export async function loadRouteProfile(): Promise<ElevationProfile> {
  try {
    // Load from public folder
    const response = await fetch('/route.gpx');
    const gpxContent = await response.text();
    return await parseGPXFile(gpxContent);
  } catch (error) {
    console.error('Error loading GPX file:', error);
    return {
      points: [],
      totalDistance: 0,
      minElevation: 0,
      maxElevation: 0,
      elevationGain: 0
    };
  }
}