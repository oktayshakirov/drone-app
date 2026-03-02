/**
 * Fetch airports in a radius around a point.
 * Tries AirportRoutes API first; falls back to OpenStreetMap Overpass API.
 */

const AIRPORTS_API_BASE = "https://www.airportroutes.com/api";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DEFAULT_RADIUS_KM = 50;

function bboxFromCenter(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
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

function parseType(raw: string): AirportType {
  if (VALID_TYPES.includes(raw as AirportType)) return raw as AirportType;
  return "small_airport";
}

/** Map OSM aeroway tag to our AirportType */
function osmTypeToAirportType(aeroway: string): AirportType {
  const t = (aeroway || "").toLowerCase();
  if (t === "helipad" || t === "heliport") return "heliport";
  if (t === "seaplane_base") return "seaplane_base";
  return "small_airport";
}

/** Fetch from OpenStreetMap Overpass API (no key, works everywhere). */
async function fetchFromOverpass(
  lat: number,
  lng: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<Airport[]> {
  const { south, west, north, east } = bboxFromCenter(lat, lng, radiusKm);
  const query = `[out:json][timeout:15];(node["aeroway"~"aerodrome|helipad|heliport|seaplane_base"](${south},${west},${north},${east});way["aeroway"~"aerodrome|helipad|heliport|seaplane_base"](${south},${west},${north},${east}););out center;`;
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
        type: osmTypeToAirportType(aeroway),
        lat: Number(latEl),
        lon: Number(lonEl),
      });
    }
    return results;
  } catch {
    return [];
  }
}

interface OverpassElement {
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Fetch airports within radius (km) of lat/lng.
 * Tries AirportRoutes first; on empty response uses Overpass (OSM).
 */
export async function fetchAirportsInRadius(
  lat: number,
  lng: number,
  radiusKm: number = DEFAULT_RADIUS_KM,
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
        return data.map((item) => ({
          icao: item.icao ?? "",
          iata: item.iata ?? "",
          name: item.name ?? "",
          city: item.city ?? "",
          country: item.country ?? "",
          type: parseType(item.type ?? "small_airport"),
          lat: Number(item.lat),
          lon: Number(item.lon),
          elevation: item.elevation,
          scheduled_service: item.scheduled_service,
        }));
      }
    }
  } catch {
    // fall through to Overpass
  }
  return fetchFromOverpass(lat, lng, radiusKm, signal);
}
