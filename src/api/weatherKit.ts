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

function mapWind(raw: RawCurrentWeather): WindConditions {
  return {
    speedMps: raw.windSpeed ?? 0,
    gustMps: raw.windGust ?? null,
    directionDegrees: raw.windDirection ?? null,
  };
}

function mapCurrent(raw: RawCurrentWeather): CurrentWeatherSummary {
  return {
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
  };
}

function mapHourly(raw: RawHourly): HourlyForecastItem {
  return {
    date: raw.forecastStart ?? "",
    windSpeedMps: raw.windSpeed ?? 0,
    windGustMps: raw.windGust ?? null,
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
  const datasets = "currentWeather,forecastHourly";
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
  const current = mapCurrent(currentRaw);
  const nextHour = hourlyRaw[0];
  if (nextHour?.precipitationChance != null) {
    current.precipitationChancePercent = nextHour.precipitationChance;
  }

  return {
    current,
    hourly: hourlyRaw.map(mapHourly),
  };
}
