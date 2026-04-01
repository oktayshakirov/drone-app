/**
 * Fetch airports in a radius around a point.
 * Tries AirportRoutes API first; falls back to OpenStreetMap Overpass API.
 * Retries once when the combined result is empty (common with flaky public APIs).
 */

const AIRPORTS_API_BASE = "https://www.airportroutes.com/api";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DEFAULT_RADIUS_KM = 50;
const EMPTY_RETRY_DELAY_MS = 600;

/** React Native / Hermes has no global DOMException; match fetch abort with Error + name. */
function abortError(): Error {
  const e = new Error("Aborted");
  e.name = "AbortError";
  return e;
}

function bboxFromCenter(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const lngDelta = radiusKm / (111.32 * Math.max(cosLat, 1e-5));
  return {
    south: lat - latDelta,
    west: lng - lngDelta,
    north: lat + latDelta,
    east: lng + lngDelta,
  };
}

export type AirportType =
  | "large_airport"
  | "medium_airport"
  | "small_airport"
  | "heliport"
  | "seaplane_base";

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  type: AirportType;
  lat: number;
  lon: number;
  elevation?: number;
  scheduled_service?: boolean;
}

interface AirportRoutesItem {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  type: string;
  lat: number;
  lon: number;
  elevation?: number;
  scheduled_service?: boolean;
}

const VALID_TYPES: AirportType[] = [
  "large_airport",
  "medium_airport",
  "small_airport",
  "heliport",
  "seaplane_base",
];

/** Parse type from API (OurAirports/AirportRoutes or variations). */
function parseType(raw: string, scheduledService?: boolean): AirportType {
  const normalized = (raw ?? "").toLowerCase().trim().replace(/\s+/g, "_");
  if (VALID_TYPES.includes(normalized as AirportType)) {
    const type = normalized as AirportType;
    if (type === "small_airport" && scheduledService) return "medium_airport";
    return type;
  }
  if (normalized.startsWith("large")) return "large_airport";
  if (normalized.startsWith("medium")) return "medium_airport";
  if (normalized.startsWith("small")) return "small_airport";
  if (scheduledService) return "medium_airport";
  return "small_airport";
}

/** Map OSM aeroway + tags to our AirportType. OSM has no size; infer from IATA. */
function osmTypeToAirportType(aeroway: string, tags?: Record<string, string>): AirportType {
  const t = (aeroway || "").toLowerCase();
  if (t === "helipad" || t === "heliport") return "heliport";
  if (t === "seaplane_base") return "seaplane_base";
  if (t === "aerodrome") {
    const iata = (tags?.iata ?? "").trim();
    if (/^[A-Z]{3}$/i.test(iata)) return "medium_airport";
  }
  return "small_airport";
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    let settled = false;
    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };
    const finishResolve = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const finishReject = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };
    const onAbort = () => {
      clearTimeout(t);
      finishReject(abortError());
    };
    const t = setTimeout(() => {
      if (signal?.aborted) {
        finishReject(abortError());
        return;
      }
      finishResolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

interface OverpassElement {
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Fetch from OpenStreetMap Overpass API (no key, works everywhere). */
async function fetchFromOverpass(
  lat: number,
  lng: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<Airport[]> {
  const { south, west, north, east } = bboxFromCenter(lat, lng, radiusKm);
  const query = `[out:json][timeout:25];(node["aeroway"~"aerodrome|helipad|heliport|seaplane_base"](${south},${west},${north},${east});way["aeroway"~"aerodrome|helipad|heliport|seaplane_base"](${south},${west},${north},${east}););out center;`;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal,
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { elements?: OverpassElement[] };
    const elements = json.elements ?? [];
    const results: Airport[] = [];
    for (const el of elements) {
      const latEl = el.lat ?? el.center?.lat;
      const lonEl = el.lon ?? el.center?.lon;
      if (latEl == null || lonEl == null) continue;
      const aeroway = el.tags?.aeroway ?? "";
      const name = el.tags?.name ?? el.tags?.ref ?? "Airport";
      results.push({
        icao: el.tags?.icao ?? el.tags?.ref ?? "",
        iata: el.tags?.iata ?? "",
        name: String(name),
        city: el.tags?.addr_city ?? "",
        country: el.tags?.addr_country ?? "",
        type: osmTypeToAirportType(aeroway, el.tags),
        lat: Number(latEl),
        lon: Number(lonEl),
      });
    }
    return results.filter(
      (a) =>
        Number.isFinite(a.lat) &&
        Number.isFinite(a.lon) &&
        a.lat >= -90 &&
        a.lat <= 90 &&
        a.lon >= -180 &&
        a.lon <= 180,
    );
  } catch (e) {
    if (signal?.aborted) throw e;
    return [];
  }
}

/**
 * One pass: AirportRoutes geosearch, then Overpass if no data.
 */
async function fetchAirportsOnce(
  lat: number,
  lng: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<Airport[]> {
  try {
    const url = `${AIRPORTS_API_BASE}/geosearch-airports/?lat=${lat}&lng=${lng}&radius=${Math.round(radiusKm)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DronePal/1.0 (https://github.com/dronepal)",
      },
      signal,
    });
    if (res.ok) {
      const data = (await res.json()) as AirportRoutesItem[] | unknown;
      if (Array.isArray(data) && data.length > 0) {
        return data
          .map((item) => ({
            icao: item.icao ?? "",
            iata: item.iata ?? "",
            name: item.name ?? "",
            city: item.city ?? "",
            country: item.country ?? "",
            type: parseType(item.type ?? "small_airport", item.scheduled_service),
            lat: Number(item.lat),
            lon: Number(item.lon),
            elevation: item.elevation,
            scheduled_service: item.scheduled_service,
          }))
          .filter(
            (a) =>
              Number.isFinite(a.lat) &&
              Number.isFinite(a.lon) &&
              a.lat >= -90 &&
              a.lat <= 90 &&
              a.lon >= -180 &&
              a.lon <= 180,
          );
      }
    }
  } catch (e) {
    if (signal?.aborted) throw e;
  }
  if (signal?.aborted) {
    throw abortError();
  }
  return fetchFromOverpass(lat, lng, radiusKm, signal);
}

export type FetchAirportsOptions = {
  /** When true, skip the empty-result retry (faster; use for map pans where user can move again). */
  skipEmptyRetry?: boolean;
};

/**
 * Fetch airports within radius (km) of lat/lng.
 * Retries once after a short delay if the first full attempt returns empty (not aborted),
 * unless `skipEmptyRetry` is set (e.g. map-driven loads).
 */
export async function fetchAirportsInRadius(
  lat: number,
  lng: number,
  radiusKm: number = DEFAULT_RADIUS_KM,
  signal?: AbortSignal,
  options?: FetchAirportsOptions,
): Promise<Airport[]> {
  let list = await fetchAirportsOnce(lat, lng, radiusKm, signal);
  if (list.length > 0 || signal?.aborted) {
    return list;
  }
  if (options?.skipEmptyRetry) {
    return list;
  }
  try {
    await delay(EMPTY_RETRY_DELAY_MS, signal);
  } catch {
    return list;
  }
  if (signal?.aborted) {
    return list;
  }
  list = await fetchAirportsOnce(lat, lng, radiusKm, signal);
  return list;
}

/** Full fetch rounds for map viewport when APIs return [] (flaky public endpoints). */
const MAP_VIEWPORT_MAX_EMPTY_ROUNDS = 3;
/** Pause between rounds to reduce rate-limit / overload. */
const MAP_VIEWPORT_ROUND_GAP_MS = 900;

/**
 * For map pans: run multiple full fetch cycles (each cycle already includes internal empty retry)
 * until we get at least one airport or all rounds return empty. Callers should keep "loading"
 * until this resolves so the UI does not stop early on a transient [].
 */
export async function fetchAirportsForMapViewport(
  lat: number,
  lng: number,
  radiusKm: number = DEFAULT_RADIUS_KM,
  signal?: AbortSignal,
): Promise<Airport[]> {
  let lastEmpty: Airport[] = [];
  for (let round = 0; round < MAP_VIEWPORT_MAX_EMPTY_ROUNDS; round++) {
    if (signal?.aborted) throw abortError();
    const list = await fetchAirportsInRadius(lat, lng, radiusKm, signal, {
      skipEmptyRetry: false,
    });
    if (list.length > 0) return list;
    lastEmpty = list;
    if (round < MAP_VIEWPORT_MAX_EMPTY_ROUNDS - 1) {
      await delay(MAP_VIEWPORT_ROUND_GAP_MS, signal);
    }
  }
  return lastEmpty;
}
