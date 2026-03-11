import type {
  CurrentWeatherSummary,
  HourlyForecastItem,
  WeatherData,
  WindConditions,
} from "../types/weather";
import { signWeatherKitJwt } from "../utils/jwt";

const WEATHERKIT_BASE = "https://weatherkit.apple.com/api/v1";

export interface WeatherKitEnv {
  teamId: string;
  serviceId: string;
  keyId: string;
  privateKeyPem: string;
}

/**
 * Fetch a fresh JWT for WeatherKit (ES256 signed with @noble/curves).
 */
async function getToken(env: WeatherKitEnv): Promise<string> {
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
  forecastStart?: string;
  sunrise?: string;
  sunset?: string;
  sun?: { sunrise?: string; sunset?: string };
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
    cloudCoverPercent: raw.cloudCover ?? null,
    temperatureCelsius: raw.temperature ?? null,
    humidityPercent: raw.humidity ?? null,
    dewPointCelsius: null, // Add if WeatherKit provides it
    pressureHpa: raw.pressure ?? null,
    uvIndex: raw.uvIndex ?? null,
    precipitationChancePercent: null, // From hourly
    precipitationType: raw.precipitation?.precipitationType ?? null,
    sunrise: raw.sunrise ?? null,
    sunset: raw.sunset ?? null,
    kpIndex: null, // WeatherKit does not provide; use separate Kp API if needed
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
    cloudCoverPercent: raw.cloudCover ?? null,
    precipitationChancePercent: raw.precipitationChance ?? null,
    temperatureCelsius: raw.temperature ?? null,
  };
}

/**
 * Fetch current weather and hourly forecast for a location.
 * Requires valid WeatherKit credentials in env.
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  env: WeatherKitEnv,
): Promise<WeatherData> {
  const token = await getToken(env);
  const lang = "en";
  const datasets = "currentWeather,forecastHourly,forecastDaily";
  const url = `${WEATHERKIT_BASE}/weather/${lang}/${latitude}/${longitude}?dataSets=${datasets}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    if (__DEV__) {
      console.warn("[WeatherKit] Error response:", res.status, text);
    }
    throw new Error(`WeatherKit error ${res.status}: ${text}`);
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
  const nextHour = hourlyRaw[0];
  if (nextHour?.precipitationChance != null) {
    current.precipitationChancePercent = nextHour.precipitationChance;
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
