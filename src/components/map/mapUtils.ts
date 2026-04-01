import type { Airport } from "../../api/airports";
import {
  getAirportCircleRadiusM,
  getAirportTypeOverlapPriority,
} from "../../constants/airportColors";

export const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
export const SEARCH_DEBOUNCE_MS = 400;

export const DEFAULT_LATITUDE_DELTA = 0.01;
export const DEFAULT_LONGITUDE_DELTA = 0.01;

export const AIRPORT_FETCH_RADIUS_KM = 50;
/**
 * After the map stops moving (no onRegionChange for this long), fetch airports for the
 * latest viewport center. Longer delay avoids hammering public APIs when panning globally.
 * Driven by onRegionChange + onRegionChangeComplete (react-native-maps pattern).
 */
/** Must align with whole-second countdown (3 → 0) before map-driven airport fetch. */
export const AIRPORT_VIEWPORT_IDLE_MS = 3000;
/**
 * After onRegionChangeComplete, wait this long (map already still) before showing the
 * stay-still bar and starting the 3→0 countdown + idle fetch timer.
 */
export const AIRPORT_STAY_STILL_GRACE_MS = 1000;
/** @deprecated Use AIRPORT_VIEWPORT_IDLE_MS */
export const AIRPORT_REGION_DEBOUNCE_MS = AIRPORT_VIEWPORT_IDLE_MS;
/**
 * Minimum move from last successful fetch center before we hit the API again (noise / dup).
 */
export const MIN_AIRPORT_FETCH_MOVE_KM = 0.08;
/**
 * If the viewport center stays within this distance of the last fetch center and we already
 * have airports in memory, skip map-driven refetch (panning the same loaded area).
 */
export const MAP_VIEWPORT_REUSE_RADIUS_KM = 42;
/**
 * Used when reopening the modal: refetch if user location moved vs last fetch.
 */
export const MAP_REGION_AFTER_FETCH_KM = MIN_AIRPORT_FETCH_MOVE_KM;
/**
 * If onRegionChangeComplete fires again with almost the same center (common on iOS/Android),
 * do not restart grace + countdown. Must be generous: native reports often differ by 50–200m
 * for the same visible map due to span/center math.
 */
export const MAP_REGION_DUPLICATE_COMPLETE_THRESHOLD_KM = 0.5;
/**
 * Ignore extra onRegionChangeComplete bursts shortly after the previous one at nearly the
 * same place (layout / React commit / duplicate native callbacks).
 */
export const MAP_REGION_BURST_COMPLETE_WINDOW_MS = 3500;
/** Only suppress completes this close together (real pans exceed this quickly). */
export const MAP_REGION_BURST_COMPLETE_MAX_SEP_KM = 0.15;
/**
 * Ignore onRegionChangeStart right after the stay-still countdown begins (state update can
 * spuriously fire regionWillChange / camera callbacks on some devices).
 */
export const MAP_SUPPRESS_REGION_START_AFTER_COUNTDOWN_MS = 900;
export const MAX_CACHED_AIRPORTS = 800;
/** Max airports drawn as markers/circles at once — avoids native map view churn and crashes. */
export const MAX_MAP_RENDERED_AIRPORTS = 400;

export interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

/** True if lat/lng are usable on a map (finite and within WGS84 bounds). */
export function isValidMapCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
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
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const metersPerDegreeLon = 111320 * Math.max(cosLat, 1e-5);
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

function ufFind(parent: number[], i: number): number {
  if (parent[i] !== i) parent[i] = ufFind(parent, parent[i]);
  return parent[i];
}

function ufUnion(parent: number[], rank: number[], i: number, j: number): void {
  let ri = ufFind(parent, i);
  let rj = ufFind(parent, j);
  if (ri === rj) return;
  if (rank[ri] < rank[rj]) [ri, rj] = [rj, ri];
  parent[rj] = ri;
  if (rank[ri] === rank[rj]) rank[ri] += 1;
}

/**
 * Clusters airports whose no-fly circles overlap (center distance ≤ sum of radii).
 * Each cluster keeps one airport: highest type priority (see getAirportTypeOverlapPriority).
 */
export function dedupeOverlappingAirportsKeepLargest(airports: Airport[]): Airport[] {
  const valid = airports.filter((a) => isValidMapCoordinate(a.lat, a.lon));
  const n = valid.length;
  if (n <= 1) return valid;

  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const r1 = getAirportCircleRadiusM(valid[i]!.type);
      const r2 = getAirportCircleRadiusM(valid[j]!.type);
      const dM =
        distanceKm(
          valid[i]!.lat,
          valid[i]!.lon,
          valid[j]!.lat,
          valid[j]!.lon,
        ) * 1000;
      if (dM <= r1 + r2) {
        ufUnion(parent, rank, i, j);
      }
    }
  }

  const byRoot = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = ufFind(parent, i);
    if (!byRoot.has(r)) byRoot.set(r, []);
    byRoot.get(r)!.push(i);
  }

  const result: Airport[] = [];
  for (const indices of byRoot.values()) {
    let bestI = indices[0]!;
    let bestP = getAirportTypeOverlapPriority(valid[bestI]!.type);
    for (let k = 1; k < indices.length; k++) {
      const idx = indices[k]!;
      const p = getAirportTypeOverlapPriority(valid[idx]!.type);
      if (
        p > bestP ||
        (p === bestP && airportKey(valid[idx]!) < airportKey(valid[bestI]!))
      ) {
        bestP = p;
        bestI = idx;
      }
    }
    result.push(valid[bestI]!);
  }
  return result;
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
  if (merged.length <= MAX_CACHED_AIRPORTS) {
    if (merged.length > MAX_MAP_RENDERED_AIRPORTS) {
      return merged.sort(
        (a, b) =>
          distanceKm(a.lat, a.lon, centerLat, centerLon) -
          distanceKm(b.lat, b.lon, centerLat, centerLon),
      );
    }
    return merged;
  }
  return merged
    .sort(
      (a, b) =>
        distanceKm(a.lat, a.lon, centerLat, centerLon) -
        distanceKm(b.lat, b.lon, centerLat, centerLon),
    )
    .slice(0, MAX_CACHED_AIRPORTS);
}
