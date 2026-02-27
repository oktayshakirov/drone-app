import type {
  CurrentWeatherSummary,
  DroneClassThresholds,
  SafetyStatus,
} from "../types/weather";
import { mpsToMph } from "./conversions";

/**
 * Evaluate Go/No-Go status from current weather and selected drone class thresholds.
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

  if (
    windGustMph > thresholds.windGustMphRed ||
    visibilityM < thresholds.visibilityMetersRed
  ) {
    return "red";
  }
  if (
    windSpeedMph > thresholds.windSpeedMphYellow ||
    precipChance > thresholds.precipitationChanceYellow
  ) {
    return "yellow";
  }
  return "green";
}
