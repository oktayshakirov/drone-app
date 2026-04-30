const APPLE_BASE = "https://weatherkit.apple.com/api/v1";
const DEFAULT_DATASETS = "currentWeather,forecastHourly,forecastDaily";

interface KVNamespace {
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

type Env = {
  WEATHERKIT_TEAM_ID: string;
  WEATHERKIT_SERVICE_ID: string;
  WEATHERKIT_KEY_ID: string;
  WEATHERKIT_PRIVATE_KEY: string;
  CACHE_TTL_SECONDS?: string;
  STALE_TTL_SECONDS?: string;
  WEATHER_CACHE: KVNamespace;
};

type WeatherCachePayload = {
  fetchedAt: number;
  weather: WeatherData;
};

type AirportsCachePayload = {
  fetchedAt: number;
  airports: Airport[];
};

const weatherInFlight = new Map<string, Promise<Response>>();
const airportsInFlight = new Map<string, Promise<Response>>();
const KMH_TO_MPS = 1 / 3.6;
const DEFAULT_AIRPORTS_RADIUS_KM = 50;
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

type WindConditions = {
  speedMps: number;
  gustMps: number | null;
  directionDegrees: number | null;
};

type CurrentWeatherSummary = {
  conditionCode: string | null;
  wind: WindConditions;
  visibilityMeters: number | null;
  cloudCoverPercent: number | null;
  temperatureCelsius: number | null;
  humidityPercent: number | null;
  dewPointCelsius: number | null;
  pressureHpa: number | null;
  uvIndex: number | null;
  precipitationChancePercent: number | null;
  precipitationType: string | null;
  sunrise: string | null;
  sunset: string | null;
  kpIndex: number | null;
};

type HourlyForecastItem = {
  date: string;
  windSpeedMps: number;
  windGustMps: number | null;
  windDirectionDegrees: number | null;
  cloudCoverPercent: number | null;
  precipitationChancePercent: number | null;
  temperatureCelsius: number | null;
};

type WeatherData = {
  current: CurrentWeatherSummary;
  hourly: HourlyForecastItem[];
};

type AirportType =
  | "large_airport"
  | "medium_airport"
  | "small_airport"
  | "heliport"
  | "seaplane_base";

type Airport = {
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
};

type OverpassElement = {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type RawCurrentWeather = {
  windSpeed?: number;
  windGust?: number;
  windDirection?: number;
  visibility?: number;
  cloudCover?: number;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  uvIndex?: number;
  conditionCode?: string;
  sunrise?: string;
  sunset?: string;
  precipitation?: { precipitationType?: string };
};

type RawHourly = {
  forecastStart?: string;
  windSpeed?: number;
  windGust?: number;
  windDirection?: number;
  cloudCover?: number;
  precipitationChance?: number;
  temperature?: number;
};

type RawDayForecast = {
  sunrise?: string;
  sunset?: string;
  sun?: { sunrise?: string; sunset?: string };
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function toBase64Url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, "\n");
  const clean = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function signJwt(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: env.WEATHERKIT_KEY_ID, typ: "JWT" };
  const payload = {
    iss: env.WEATHERKIT_TEAM_ID,
    sub: env.WEATHERKIT_SERVICE_ID,
    iat: now,
    exp: now + 55 * 60,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(env.WEATHERKIT_PRIVATE_KEY),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`;
}

function parseNumber(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

function getTtls(env: Env): { fresh: number; stale: number } {
  const fresh = Number.parseInt(env.CACHE_TTL_SECONDS ?? "600", 10);
  const stale = Number.parseInt(env.STALE_TTL_SECONDS ?? "21600", 10);
  return {
    fresh: Number.isFinite(fresh) ? Math.max(30, fresh) : 600,
    stale: Number.isFinite(stale) ? Math.max(300, stale) : 21600,
  };
}

async function readCache(
  env: Env,
  key: string,
  now: number,
  freshTtl: number,
  staleTtl: number,
): Promise<{
  fresh: WeatherCachePayload | null;
  stale: WeatherCachePayload | null;
}> {
  const cached = await env.WEATHER_CACHE.get<WeatherCachePayload>(key, "json");
  if (!cached?.fetchedAt) return { fresh: null, stale: null };
  const ageSeconds = Math.floor((now - cached.fetchedAt) / 1000);
  return {
    fresh: ageSeconds <= freshTtl ? cached : null,
    stale: ageSeconds <= staleTtl ? cached : null,
  };
}

async function readAirportsCache(
  env: Env,
  key: string,
  now: number,
  freshTtl: number,
  staleTtl: number,
): Promise<{
  fresh: AirportsCachePayload | null;
  stale: AirportsCachePayload | null;
}> {
  const cached = await env.WEATHER_CACHE.get<AirportsCachePayload>(key, "json");
  if (!cached?.fetchedAt) return { fresh: null, stale: null };
  const ageSeconds = Math.floor((now - cached.fetchedAt) / 1000);
  return {
    fresh: ageSeconds <= freshTtl ? cached : null,
    stale: ageSeconds <= staleTtl ? cached : null,
  };
}

function bboxFromCenter(lat: number, lng: number, radiusKm: number): {
  south: number;
  west: number;
  north: number;
  east: number;
} {
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

function osmTypeToAirportType(
  aeroway: string,
  tags?: Record<string, string>,
): AirportType {
  const t = (aeroway || "").toLowerCase();
  if (t === "helipad" || t === "heliport") return "heliport";
  if (t === "seaplane_base") return "seaplane_base";
  if (t === "aerodrome") {
    const iata = (tags?.iata ?? "").trim();
    if (/^[A-Z]{3}$/i.test(iata)) return "medium_airport";
  }
  return "small_airport";
}

async function fetchAirportsFromOverpass(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<Airport[]> {
  const { south, west, north, east } = bboxFromCenter(lat, lng, radiusKm);
  const query = `[out:json][timeout:25];(node["aeroway"~"aerodrome|helipad|heliport|seaplane_base"](${south},${west},${north},${east});way["aeroway"~"aerodrome|helipad|heliport|seaplane_base"](${south},${west},${north},${east}););out center;`;

  let lastStatus: number | null = null;
  for (const endpoint of OVERPASS_URLS) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "DronePal-Airports-Proxy/1.0 (+https://dronepal.app)",
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) {
      lastStatus = res.status;
      continue;
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      lastStatus = 406;
      continue;
    }
    const json = (await res.json()) as { elements?: OverpassElement[] };
    const elements = json.elements ?? [];
    const list: Airport[] = [];
    for (const el of elements) {
      const latEl = el.lat ?? el.center?.lat;
      const lonEl = el.lon ?? el.center?.lon;
      if (latEl == null || lonEl == null) continue;
      const name = el.tags?.name ?? el.tags?.ref ?? "Airport";
      list.push({
        icao: el.tags?.icao ?? el.tags?.ref ?? "",
        iata: el.tags?.iata ?? "",
        name: String(name),
        city: el.tags?.addr_city ?? "",
        country: el.tags?.addr_country ?? "",
        type: osmTypeToAirportType(el.tags?.aeroway ?? "", el.tags),
        lat: Number(latEl),
        lon: Number(lonEl),
      });
    }
    return list.filter(
      (a) =>
        Number.isFinite(a.lat) &&
        Number.isFinite(a.lon) &&
        a.lat >= -90 &&
        a.lat <= 90 &&
        a.lon >= -180 &&
        a.lon <= 180,
    );
  }
  throw new Error(
    `Airports upstream request failed. status=${lastStatus ?? "unknown"}`,
  );
}

function toPercent(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, percent));
}

function mapWeather(json: any): WeatherData {
  const currentRaw: RawCurrentWeather = json?.currentWeather ?? {};
  const hourlyRaw: RawHourly[] = json?.forecastHourly?.hours ?? [];
  const forecastDaily = json?.forecastDaily as
    | { days?: RawDayForecast[] }
    | RawDayForecast[]
    | undefined;
  const days = Array.isArray(forecastDaily)
    ? forecastDaily
    : (forecastDaily?.days ?? []);

  const current: CurrentWeatherSummary = {
    conditionCode: currentRaw.conditionCode ?? null,
    wind: {
      speedMps: (currentRaw.windSpeed ?? 0) * KMH_TO_MPS,
      gustMps:
        currentRaw.windGust != null ? currentRaw.windGust * KMH_TO_MPS : null,
      directionDegrees: currentRaw.windDirection ?? null,
    },
    visibilityMeters: currentRaw.visibility ?? null,
    cloudCoverPercent: toPercent(currentRaw.cloudCover),
    temperatureCelsius: currentRaw.temperature ?? null,
    humidityPercent: toPercent(currentRaw.humidity),
    dewPointCelsius: null,
    pressureHpa: currentRaw.pressure ?? null,
    uvIndex: currentRaw.uvIndex ?? null,
    precipitationChancePercent: toPercent(hourlyRaw[0]?.precipitationChance),
    precipitationType: currentRaw.precipitation?.precipitationType ?? null,
    sunrise: currentRaw.sunrise ?? null,
    sunset: currentRaw.sunset ?? null,
    kpIndex: null,
  };

  const today = days[0];
  if (today) {
    current.sunrise = today.sunrise ?? today.sun?.sunrise ?? current.sunrise;
    current.sunset = today.sunset ?? today.sun?.sunset ?? current.sunset;
  }

  const hourly = hourlyRaw.map((h) => ({
    date: h.forecastStart ?? "",
    windSpeedMps: (h.windSpeed ?? 0) * KMH_TO_MPS,
    windGustMps: h.windGust != null ? h.windGust * KMH_TO_MPS : null,
    windDirectionDegrees: h.windDirection ?? null,
    cloudCoverPercent: toPercent(h.cloudCover),
    precipitationChancePercent: toPercent(h.precipitationChance),
    temperatureCelsius: h.temperature ?? null,
  }));

  return { current, hourly };
}

async function fetchFromApple(
  env: Env,
  lat: number,
  lon: number,
  datasets: string,
): Promise<WeatherData> {
  const jwt = await signJwt(env);
  const url = `${APPLE_BASE}/weather/en/${lat}/${lon}?dataSets=${encodeURIComponent(datasets)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    const safeMessage =
      res.status === 429
        ? "Weather service is busy."
        : [502, 503, 504].includes(res.status)
          ? "Weather service temporarily unavailable."
          : contentType.includes("text/html")
            ? "Unexpected weather upstream response."
            : "Weather upstream request failed.";
    throw new Error(`${safeMessage} status=${res.status}`);
  }
  const appleJson = await res.json();
  return mapWeather(appleJson);
}

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      if (req.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }));
      }
      const url = new URL(req.url);

      if (url.pathname === "/health") {
        return withCors(json({ ok: true, service: "drone-pal-weather-proxy" }));
      }

      if (
        url.pathname !== "/weather" &&
        url.pathname !== "/airports"
      ) {
        return withCors(json({ error: "Not found" }, 404));
      }

      if (req.method !== "GET") {
        return withCors(json({ error: "Method not allowed" }, 405));
      }

      if (url.pathname === "/airports") {
        const lat = parseNumber(url.searchParams.get("lat"));
        const lon = parseNumber(url.searchParams.get("lon"));
        const radiusKm =
          parseNumber(url.searchParams.get("radiusKm")) ??
          DEFAULT_AIRPORTS_RADIUS_KM;
        if (lat == null || lon == null) {
          return withCors(json({ error: "Invalid lat/lon" }, 400));
        }
        const roundedLat = roundCoord(lat);
        const roundedLon = roundCoord(lon);
        const roundedRadius = Math.max(5, Math.min(200, Math.round(radiusKm)));
        const cacheKey = `ap:v1:${roundedLat}:${roundedLon}:${roundedRadius}`;
        const inflightKey = `${roundedLat},${roundedLon}:${roundedRadius}`;
        const now = Date.now();
        const { fresh, stale } = getTtls(env);
        const cached = await readAirportsCache(
          env,
          cacheKey,
          now,
          fresh,
          stale,
        );
        if (cached.fresh) {
          return withCors(json(cached.fresh.airports));
        }
        const existing = airportsInFlight.get(inflightKey);
        if (existing) return await existing;

        const task = (async () => {
          try {
            const airports = await fetchAirportsFromOverpass(
              lat,
              lon,
              roundedRadius,
            );
            const payload: AirportsCachePayload = {
              fetchedAt: Date.now(),
              airports,
            };
            await env.WEATHER_CACHE.put(cacheKey, JSON.stringify(payload), {
              expirationTtl: stale,
            });
            return withCors(json(airports));
          } catch (error) {
            if (cached.stale) return withCors(json(cached.stale.airports));
            const message =
              error instanceof Error ? error.message : "Airports proxy failed";
            return withCors(json({ error: message }, 502));
          } finally {
            airportsInFlight.delete(inflightKey);
          }
        })();

        airportsInFlight.set(inflightKey, task);
        return await task;
      }

      const lat = parseNumber(url.searchParams.get("lat"));
      const lon = parseNumber(url.searchParams.get("lon"));
      const datasets = (url.searchParams.get("datasets") ?? DEFAULT_DATASETS).trim();
      if (lat == null || lon == null) {
        return withCors(json({ error: "Invalid lat/lon" }, 400));
      }

      const roundedLat = roundCoord(lat);
      const roundedLon = roundCoord(lon);
      const key = `wx:v2:${roundedLat}:${roundedLon}:${datasets}`;
      const coalesceKey = `${roundedLat},${roundedLon}:${datasets}`;
      const now = Date.now();
      const { fresh, stale } = getTtls(env);
      const cached = await readCache(env, key, now, fresh, stale);
      if (cached.fresh) {
        return withCors(json(cached.fresh.weather));
      }

      const existing = weatherInFlight.get(coalesceKey);
      if (existing) return await existing;

      const task = (async () => {
        try {
          const weather = await fetchFromApple(env, lat, lon, datasets);
          const payload: WeatherCachePayload = { fetchedAt: Date.now(), weather };
          await env.WEATHER_CACHE.put(key, JSON.stringify(payload), {
            expirationTtl: stale,
          });
          return withCors(json(weather));
        } catch (error) {
          if (cached.stale) {
            return withCors(json(cached.stale.weather));
          }
          const message =
            error instanceof Error ? error.message : "Weather proxy failed";
          return withCors(json({ error: message }, 502));
        } finally {
          weatherInFlight.delete(coalesceKey);
        }
      })();

      weatherInFlight.set(coalesceKey, task);
      return await task;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Weather proxy runtime error";
      return withCors(json({ error: message }, 502));
    }
  },
};
