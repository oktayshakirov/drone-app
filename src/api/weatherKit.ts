import type {
  CurrentWeatherSummary,
  HourlyForecastItem,
  WeatherData,
  WindConditions,
} from "../types/weather";
import { signWeatherKitJwt } from "../utils/jwt";

const WEATHERKIT_BASE = "https://weatherkit.apple.com/api/v1";
const WEATHER_DATASETS = "currentWeather,forecastHourly,forecastDaily";
const RETRIABLE_STATUS = new Set([502, 503, 504]);
const inFlight = new Map<string, Promise<WeatherData>>();
let requestCounter = 0;

export interface WeatherKitEnv {
  teamId?: string;
  serviceId?: string;
  keyId?: string;
  privateKeyPem?: string;
  proxyBaseUrl?: string;
  directEnabled?: boolean;
  weatherDisabled?: boolean;
  retryMax?: number;
  requestTimeoutMs?: number;
}

/**
 * Fetch a fresh JWT for WeatherKit (ES256 signed with @noble/curves).
 */
async function getToken(env: WeatherKitEnv): Promise<string> {
  if (!env.teamId || !env.serviceId || !env.keyId || !env.privateKeyPem) {
    throw new Error("Weather service is not configured.");
  }
  return signWeatherKitJwt(
    env.teamId,
    env.serviceId,
    env.keyId,
    env.privateKeyPem,
  );
}

/**
 * WeatherKit REST API returns wind speed in km/h (per common convention).
 * We convert to m/s for internal use and display conversions.
 */
const KMH_TO_MPS = 1 / 3.6;

/**
 * Raw WeatherKit current weather response (minimal shape for mapping).
 */
interface RawCurrentWeather {
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
  precipitation?: { precipitationType?: string; intensity?: string };
}

/**
 * Raw WeatherKit hourly forecast hour (minimal shape).
 */
interface RawHourly {
  forecastStart?: string;
  windSpeed?: number;
  windGust?: number;
  windDirection?: number;
  cloudCover?: number;
  precipitationChance?: number;
  temperature?: number;
}

/**
 * Raw WeatherKit daily forecast day (sun times come from here, not currentWeather).
 */
interface RawDayForecast {
  sunrise?: string;
  sunset?: string;
  sun?: { sunrise?: string; sunset?: string };
}

function normalizeChanceToPercent(
  value: number | null | undefined,
): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, percent));
}

function mapWind(raw: RawCurrentWeather): WindConditions {
  const speedKmh = raw.windSpeed ?? 0;
  const gustKmh = raw.windGust;
  return {
    speedMps: speedKmh * KMH_TO_MPS,
    gustMps: gustKmh != null ? gustKmh * KMH_TO_MPS : null,
    directionDegrees: raw.windDirection ?? null,
  };
}

function mapCurrent(raw: RawCurrentWeather): CurrentWeatherSummary {
  return {
    conditionCode: raw.conditionCode ?? null,
    wind: mapWind(raw),
    visibilityMeters: raw.visibility ?? null,
    cloudCoverPercent: normalizeChanceToPercent(raw.cloudCover),
    temperatureCelsius: raw.temperature ?? null,
    humidityPercent: normalizeChanceToPercent(raw.humidity),
    dewPointCelsius: null,
    pressureHpa: raw.pressure ?? null,
    uvIndex: raw.uvIndex ?? null,
    precipitationChancePercent: null,
    precipitationType: raw.precipitation?.precipitationType ?? null,
    sunrise: raw.sunrise ?? null,
    sunset: raw.sunset ?? null,
    kpIndex: null,
  };
}

function mapHourly(raw: RawHourly): HourlyForecastItem {
  const speedKmh = raw.windSpeed ?? 0;
  const gustKmh = raw.windGust;
  return {
    date: raw.forecastStart ?? "",
    windSpeedMps: speedKmh * KMH_TO_MPS,
    windGustMps: gustKmh != null ? gustKmh * KMH_TO_MPS : null,
    windDirectionDegrees: raw.windDirection ?? null,
    cloudCoverPercent: normalizeChanceToPercent(raw.cloudCover),
    precipitationChancePercent: normalizeChanceToPercent(
      raw.precipitationChance,
    ),
    temperatureCelsius: raw.temperature ?? null,
  };
}

function roundCoord(v: number): number {
  return Math.round(v * 100) / 100;
}

function hasDirectCredentials(env: WeatherKitEnv): boolean {
  return Boolean(env.teamId && env.serviceId && env.keyId && env.privateKeyPem);
}

function safeErrorMessage(status: number, contentType: string | null): string {
  if (status === 401 || status === 403) return "Weather service authentication failed.";
  if (status === 429) return "Weather service is busy. Please try again shortly.";
  if (RETRIABLE_STATUS.has(status)) return "Weather service is temporarily unavailable.";
  if (contentType?.includes("text/html")) return "Weather service returned an unexpected response.";
  return "Weather service request failed.";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logStart(
  source: "proxy" | "apple",
  url: string,
  latitude: number,
  longitude: number,
  datasets: string,
): { requestId: number; startedAt: number } {
  const requestId = ++requestCounter;
  const startedAt = Date.now();
  console.info(
    `[Weather] #${requestId} start source=${source} lat=${latitude} lon=${longitude} datasets=${datasets} url=${url}`,
  );
  return { requestId, startedAt };
}

function logEnd(
  requestId: number,
  res: Response,
  startedAt: number,
): void {
  console.info(
    `[Weather] #${requestId} end ok=${res.ok} status=${res.status} durationMs=${Date.now() - startedAt} contentType=${res.headers.get("content-type") ?? "n/a"}`,
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function requestProxy(
  latitude: number,
  longitude: number,
  env: WeatherKitEnv,
): Promise<WeatherData> {
  const base = (env.proxyBaseUrl ?? "").trim();
  if (!base) throw new Error("Proxy URL missing.");
  const urlObj = new URL(base);
  urlObj.searchParams.set("lat", String(latitude));
  urlObj.searchParams.set("lon", String(longitude));
  urlObj.searchParams.set("datasets", WEATHER_DATASETS);
  const url = urlObj.toString();
  const { requestId, startedAt } = logStart(
    "proxy",
    url,
    latitude,
    longitude,
    WEATHER_DATASETS,
  );
  const res = await fetchWithTimeout(
    url,
    { method: "GET", headers: { Accept: "application/json" } },
    env.requestTimeoutMs ?? 15000,
  );
  logEnd(requestId, res, startedAt);
  if (!res.ok) {
    throw new Error(safeErrorMessage(res.status, res.headers.get("content-type")));
  }
  return (await res.json()) as WeatherData;
}

async function requestAppleDirect(
  latitude: number,
  longitude: number,
  env: WeatherKitEnv,
): Promise<WeatherData> {
  const token = await getToken(env);
  const lang = "en";
  const url = `${WEATHERKIT_BASE}/weather/${lang}/${latitude}/${longitude}?dataSets=${WEATHER_DATASETS}`;
  const { requestId, startedAt } = logStart(
    "apple",
    url,
    latitude,
    longitude,
    WEATHER_DATASETS,
  );

  const res = await fetchWithTimeout(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
    env.requestTimeoutMs ?? 15000,
  );
  logEnd(requestId, res, startedAt);

  if (!res.ok) {
    throw new Error(safeErrorMessage(res.status, res.headers.get("content-type")));
  }

  const json = await res.json();
  const currentRaw = (json.currentWeather as RawCurrentWeather) ?? {};
  const hourlyRaw = (json.forecastHourly?.hours as RawHourly[]) ?? [];
  const forecastDaily = json.forecastDaily as
    | { days?: RawDayForecast[] }
    | RawDayForecast[]
    | undefined;
  const dailyDays = Array.isArray(forecastDaily)
    ? forecastDaily
    : (forecastDaily?.days ?? []);
  const current = mapCurrent(currentRaw);
  const firstHourly = hourlyRaw[0];
  if (firstHourly?.precipitationChance != null) {
    current.precipitationChancePercent = normalizeChanceToPercent(
      firstHourly.precipitationChance,
    );
  }
  const today = dailyDays[0];
  if (today) {
    current.sunrise = today.sunrise ?? today.sun?.sunrise ?? current.sunrise;
    current.sunset = today.sunset ?? today.sun?.sunset ?? current.sunset;
  }

  return {
    current,
    hourly: hourlyRaw.map(mapHourly),
  };
}

async function executeWithRetry(
  task: () => Promise<WeatherData>,
  maxRetries: number,
): Promise<WeatherData> {
  let attempt = 0;
  while (true) {
    try {
      return await task();
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      const isRetriable =
        /temporarily unavailable|busy|aborted|abort|timed out|network request failed/i.test(
          message,
        );
      if (!isRetriable || attempt >= maxRetries) {
        if (/aborted|abort|timed out/i.test(message)) {
          throw new Error("Weather service timed out. Please try again.");
        }
        throw error;
      }
      const delay = Math.min(8000, 700 * 2 ** attempt);
      console.warn(
        `[Weather] retry attempt=${attempt + 1} delayMs=${delay} reason=${message}`,
      );
      await sleep(delay);
      attempt += 1;
    }
  }
}

/**
 * Fetch current weather and hourly forecast for a location.
 * Proxy-first, retry-enabled and deduplicated by rounded coordinates.
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  env: WeatherKitEnv,
): Promise<WeatherData> {
  if (env.weatherDisabled) {
    throw new Error("Live weather is temporarily disabled.");
  }

  const key = `${roundCoord(latitude)},${roundCoord(longitude)}:${WEATHER_DATASETS}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const task = (async () => {
    const retries = env.retryMax ?? 3;
    const hasProxy = Boolean(env.proxyBaseUrl?.trim());
    const allowDirect = env.directEnabled ?? true;

    if (hasProxy) {
      try {
        return await executeWithRetry(
          () => requestProxy(latitude, longitude, env),
          retries,
        );
      } catch (proxyError) {
        if (!allowDirect) {
          throw proxyError;
        }
        console.warn("[Weather] proxy failed, trying direct WeatherKit fallback");
      }
    }

    if (!allowDirect || !hasDirectCredentials(env)) {
      throw new Error("Weather service unavailable right now.");
    }

    return executeWithRetry(
      () => requestAppleDirect(latitude, longitude, env),
      retries,
    );
  })();

  inFlight.set(key, task);
  try {
    return await task;
  } finally {
    inFlight.delete(key);
  }
}
