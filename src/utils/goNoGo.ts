import type {
  CurrentWeatherSummary,
  DroneClassThresholds,
  SafetyStatus,
} from "../types/weather";
import { mpsToMph } from "./conversions";

/** Kp index: caution above 5, no-go above 6 (reference doc). */
const KP_YELLOW = 5;
const KP_RED = 7;
/** UV index: caution above 7 (reference doc; no strict no-go for flight). */
const UV_YELLOW = 8;

export interface ConditionBreakdownItem {
  id: string;
  label: string;
  status: SafetyStatus;
  value: string;
  detail: string;
}

/**
 * Per-condition status for display in the flight conditions info modal.
 * Order: Visibility, Wind speed, Wind gust, Precipitation, Kp index, UV index.
 */
export function getConditionBreakdown(
  current: CurrentWeatherSummary,
  thresholds: DroneClassThresholds,
): ConditionBreakdownItem[] {
  const windGustMph =
    current.wind.gustMps != null
      ? mpsToMph(current.wind.gustMps)
      : mpsToMph(current.wind.speedMps);
  const windSpeedMph = mpsToMph(current.wind.speedMps);
  const visibilityM = current.visibilityMeters ?? 10000;
  const precipChance = current.precipitationChancePercent ?? 0;
  const kp = current.kpIndex ?? 0;
  const uv = current.uvIndex ?? 0;

  const visibilityStatus: SafetyStatus =
    visibilityM < thresholds.visibilityMetersRed ? "red" : "green";
  const windSpeedStatus: SafetyStatus =
    windSpeedMph > thresholds.windSpeedMphYellow ? "yellow" : "green";
  const windGustStatus: SafetyStatus =
    windGustMph > thresholds.windGustMphRed ? "red" : "green";
  const precipStatus: SafetyStatus =
    precipChance > thresholds.precipitationChanceYellow ? "yellow" : "green";
  const kpStatus: SafetyStatus =
    kp >= KP_RED ? "red" : kp >= KP_YELLOW ? "yellow" : "green";
  const uvStatus: SafetyStatus = uv >= UV_YELLOW ? "yellow" : "green";

  const visibilityValue =
    visibilityM >= 1000
      ? `${(visibilityM / 1000).toFixed(1)} km`
      : `${visibilityM} m`;

  return [
    {
      id: "visibility",
      label: "Visibility",
      status: visibilityStatus,
      value: visibilityValue,
      detail: `No-go below ${thresholds.visibilityMetersRed / 1000} km`,
    },
    {
      id: "windSpeed",
      label: "Wind speed",
      status: windSpeedStatus,
      value: `${windSpeedMph.toFixed(1)} mph`,
      detail: `Caution above ${thresholds.windSpeedMphYellow} mph`,
    },
    {
      id: "windGust",
      label: "Wind gust",
      status: windGustStatus,
      value: `${windGustMph.toFixed(1)} mph`,
      detail: `No-go above ${thresholds.windGustMphRed} mph`,
    },
    {
      id: "precipitation",
      label: "Precipitation chance",
      status: precipStatus,
      value: `${precipChance}%`,
      detail: `Caution above ${thresholds.precipitationChanceYellow}%`,
    },
    {
      id: "kpIndex",
      label: "Kp index",
      status: kpStatus,
      value: String(kp),
      detail: `Caution ≥${KP_YELLOW}, no-go ≥${KP_RED}`,
    },
    {
      id: "uvIndex",
      label: "UV index",
      status: uvStatus,
      value: String(uv),
      detail: `Caution above ${UV_YELLOW - 1}`,
    },
  ];
}

/**
 * Evaluate Go/No-Go status from current weather and selected drone class thresholds.
 * Includes Kp and UV: Kp ≥7 red, Kp ≥5 yellow; UV ≥8 yellow.
 * Order: RED first, then YELLOW, then GREEN.
 */
export function evaluateSafety(
  current: CurrentWeatherSummary,
  thresholds: DroneClassThresholds,
): SafetyStatus {
  const windGustMph =
    current.wind.gustMps != null
      ? mpsToMph(current.wind.gustMps)
      : mpsToMph(current.wind.speedMps);
  const windSpeedMph = mpsToMph(current.wind.speedMps);
  const visibilityM = current.visibilityMeters ?? 10000;
  const precipChance = current.precipitationChancePercent ?? 0;
  const kp = current.kpIndex ?? 0;
  const uv = current.uvIndex ?? 0;

  if (
    windGustMph > thresholds.windGustMphRed ||
    visibilityM < thresholds.visibilityMetersRed ||
    kp >= KP_RED
  ) {
    return "red";
  }
  if (
    windSpeedMph > thresholds.windSpeedMphYellow ||
    precipChance > thresholds.precipitationChanceYellow ||
    kp >= KP_YELLOW ||
    uv >= UV_YELLOW
  ) {
    return "yellow";
  }
  return "green";
}
