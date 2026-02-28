/**
 * Weather types for DronePal — aligned with WeatherKit API response shape.
 */

export type SafetyStatus = 'green' | 'yellow' | 'red';

export interface WindConditions {
  speedMps: number;
  gustMps: number | null;
  directionDegrees: number | null;
}

export interface CurrentWeatherSummary {
  conditionCode: string | null; // e.g. "MostlyClear", "Cloudy" — WeatherKit PascalCase
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
  sunrise: string | null; // ISO
  sunset: string | null;  // ISO
  kpIndex: number | null; // Geomagnetic Kp index (0–9), space weather
}

export interface HourlyForecastItem {
  date: string; // ISO
  windSpeedMps: number;
  windGustMps: number | null;
  windDirectionDegrees: number | null;
  cloudCoverPercent: number | null;
  precipitationChancePercent: number | null;
  temperatureCelsius: number | null;
}

export interface WeatherData {
  current: CurrentWeatherSummary;
  hourly: HourlyForecastItem[];
}

export interface DroneClassThresholds {
  windGustMphRed: number;
  visibilityMetersRed: number;
  windSpeedMphYellow: number;
  precipitationChanceYellow: number;
}

export type WeightClassId = 'sub250' | '250_500' | '500_1000' | '1000_plus' | 'custom';

export interface WeightClass {
  id: WeightClassId;
  label: string;
  thresholds: DroneClassThresholds;
}
