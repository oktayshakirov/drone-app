import {
  distanceKm,
  isValidMapCoordinate,
  MAP_VIEWPORT_REUSE_RADIUS_KM,
  MIN_AIRPORT_FETCH_MOVE_KM,
  MAP_REGION_DUPLICATE_COMPLETE_THRESHOLD_KM,
  MAP_REGION_BURST_COMPLETE_WINDOW_MS,
  MAP_REGION_BURST_COMPLETE_MAX_SEP_KM,
} from "./mapUtils";

export type MapLatLng = { lat: number; lng: number };

export type RegionCompleteBurst = { at: number; lat: number; lng: number };

/** Same viewport as last fetch and we already have data — skip scheduling idle pipeline. */
export function isWithinLoadedViewport(
  p: MapLatLng | null,
  lastFetch: MapLatLng | null,
  airportCount: number,
): boolean {
  return (
    airportCount > 0 &&
    lastFetch != null &&
    p != null &&
    isValidMapCoordinate(p.lat, p.lng) &&
    distanceKm(p.lat, p.lng, lastFetch.lat, lastFetch.lng) <=
      MAP_VIEWPORT_REUSE_RADIUS_KM
  );
}

/** After grace + idle timer: actually hit the API for this center? */
export function shouldRunMapIdleFetch(
  p: MapLatLng | null,
  lastSuccessfulFetch: MapLatLng | null,
  airportCount: number,
): boolean {
  if (!p || !isValidMapCoordinate(p.lat, p.lng)) return false;
  if (isWithinLoadedViewport(p, lastSuccessfulFetch, airportCount)) return false;
  if (lastSuccessfulFetch != null) {
    const moved = distanceKm(
      p.lat,
      p.lng,
      lastSuccessfulFetch.lat,
      lastSuccessfulFetch.lng,
    );
    if (moved < MIN_AIRPORT_FETCH_MOVE_KM) return false;
  }
  return true;
}

export function isBurstDuplicateRegionComplete(
  lat: number,
  lng: number,
  now: number,
  burst: RegionCompleteBurst | null,
): boolean {
  if (burst == null) return false;
  if (now - burst.at >= MAP_REGION_BURST_COMPLETE_WINDOW_MS) return false;
  return (
    distanceKm(lat, lng, burst.lat, burst.lng) <
    MAP_REGION_BURST_COMPLETE_MAX_SEP_KM
  );
}

export function isAnchorDuplicateRegionComplete(
  lat: number,
  lng: number,
  anchor: MapLatLng | null,
): boolean {
  if (anchor == null) return false;
  return (
    distanceKm(lat, lng, anchor.lat, anchor.lng) <
    MAP_REGION_DUPLICATE_COMPLETE_THRESHOLD_KM
  );
}
