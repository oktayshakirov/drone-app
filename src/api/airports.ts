import Constants from "expo-constants";

const DEFAULT_RADIUS_KM = 50;
const EMPTY_RETRY_DELAY_MS = 600;

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

function abortError(): Error {
  const e = new Error("Aborted");
  e.name = "AbortError";
  return e;
}

function getAirportsProxyBaseUrl(): string {
  const extra = (
    Constants.expoConfig as { extra?: Record<string, string | undefined> }
  )?.extra;
  const explicit = extra?.airportsProxyBaseUrl?.trim();
  if (explicit) return explicit;
  const weather = extra?.weatherProxyBaseUrl?.trim();
  if (!weather) return "";
  if (weather.endsWith("/weather")) {
    return `${weather.slice(0, -"/weather".length)}/airports`;
  }
  return `${weather.replace(/\/$/, "")}/airports`;
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

async function fetchFromProxy(
  lat: number,
  lng: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<Airport[]> {
  const base = getAirportsProxyBaseUrl();
  if (!base) throw new Error("Airports proxy is not configured.");
  const url = new URL(base);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("radiusKm", String(Math.round(radiusKm)));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Airports request failed. status=${res.status}`);
  }
  const data = (await res.json()) as Airport[] | unknown;
  if (!Array.isArray(data)) return [];
  return data;
}

async function fetchAirportsOnce(
  lat: number,
  lng: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<Airport[]> {
  try {
    return await fetchFromProxy(lat, lng, radiusKm, signal);
  } catch (e) {
    if (signal?.aborted) throw e;
    return [];
  }
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
