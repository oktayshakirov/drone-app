import type { Airport } from "../../api/airports";

export const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
export const SEARCH_DEBOUNCE_MS = 400;

export const DEFAULT_LATITUDE_DELTA = 0.01;
export const DEFAULT_LONGITUDE_DELTA = 0.01;

export const AIRPORT_FETCH_RADIUS_KM = 50;
export const AIRPORT_FETCH_MIN_MOVE_KM = 5;
export const AIRPORT_FETCH_THROTTLE_MS = 2500;
export const MAX_CACHED_AIRPORTS = 800;

export interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

/** Approximate a circle as a polygon (works when Circle overlay does not render). */
export function circleToPolygonCoords(
  lat: number,
  lon: number,
  radiusM: number,
  points = 32,
): Array<{ latitude: number; longitude: number }> {
  const coords: Array<{ latitude: number; longitude: number }> = [];
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push({
      latitude: lat + (radiusM / metersPerDegreeLat) * Math.cos(angle),
      longitude: lon + (radiusM / metersPerDegreeLon) * Math.sin(angle),
    });
  }
  return coords;
}

export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function airportKey(a: Airport): string {
  if (a.icao) return `icao:${a.icao}`;
  return `pos:${a.lat.toFixed(5)},${a.lon.toFixed(5)}`;
}

export function mergeAirports(
  existing: Airport[],
  incoming: Airport[],
  centerLat: number,
  centerLon: number,
): Airport[] {
  const map = new Map<string, Airport>();
  for (const a of existing) map.set(airportKey(a), a);
  for (const a of incoming) map.set(airportKey(a), a);
  const merged = Array.from(map.values());
  if (merged.length <= MAX_CACHED_AIRPORTS) return merged;
  return merged
    .sort(
      (a, b) =>
        distanceKm(a.lat, a.lon, centerLat, centerLon) -
        distanceKm(b.lat, b.lon, centerLat, centerLon),
    )
    .slice(0, MAX_CACHED_AIRPORTS);
}
