/**
 * Drone weight class presets and thresholds for Go/No-Go logic.
 *
 * Based on:
 * - docs/DRONE_FLIGHT_CONDITIONS_REFERENCE.md
 * - docs/DRONE_WEIGHT_CLASS_RESEARCH.md (EASA C0/C1/C2, manufacturer specs,
 *   Beaufort scale, VLOS and precipitation guidance)
 *
 * Weight classes align with EASA Open Category (C0 &lt;250 g, C1 ≤900 g, C2 ≤4 kg)
 * and common consumer segments. Lighter drones use stricter wind/gust limits.
 */

import type { DroneClassThresholds } from "../types/weather";

export type WeightClassId = "sub250" | "250_500" | "500_1000" | "1000_plus";

export interface WeightClassOption {
  id: WeightClassId;
  label: string;
  thresholds: DroneClassThresholds;
}

/** No-go when visibility below 1 km (VLOS unsafe; EU/FAA guidance). */
const VISIBILITY_RED_M = 1000;

/**
 * Preset weight classes and thresholds (mph, m, %).
 *
 * - windGustMphRed: no-go when gust exceeds this (mph).
 * - windSpeedMphYellow: caution when sustained wind exceeds this (mph).
 * - visibilityMetersRed: no-go when visibility below this (m).
 * - precipitationChanceYellow: caution when precipitation chance above this (%).
 */
export const WEIGHT_CLASS_OPTIONS: WeightClassOption[] = [
  {
    id: "sub250",
    label: "< 250 g",
    thresholds: {
      windGustMphRed: 18,
      visibilityMetersRed: VISIBILITY_RED_M,
      windSpeedMphYellow: 10,
      precipitationChanceYellow: 30,
    },
  },
  {
    id: "250_500",
    label: "250 g – 500 g",
    thresholds: {
      windGustMphRed: 24,
      visibilityMetersRed: VISIBILITY_RED_M,
      windSpeedMphYellow: 12,
      precipitationChanceYellow: 30,
    },
  },
  {
    id: "500_1000",
    label: "500 g – 1 kg",
    thresholds: {
      windGustMphRed: 30,
      visibilityMetersRed: VISIBILITY_RED_M,
      windSpeedMphYellow: 15,
      precipitationChanceYellow: 40,
    },
  },
  {
    id: "1000_plus",
    label: "1 kg+",
    thresholds: {
      windGustMphRed: 34,
      visibilityMetersRed: VISIBILITY_RED_M,
      windSpeedMphYellow: 20,
      precipitationChanceYellow: 40,
    },
  },
];

export function getThresholdsForWeightClass(
  id: WeightClassId,
): DroneClassThresholds {
  const option = WEIGHT_CLASS_OPTIONS.find((o) => o.id === id);
  if (!option) {
    return WEIGHT_CLASS_OPTIONS[0].thresholds;
  }
  return option.thresholds;
}
