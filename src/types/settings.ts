import type { WeightClassId } from "../constants/droneThresholds";

export type Units = "imperial" | "metric";
export type WindUnit = "mph" | "kmh" | "ms" | "knots";
export type TimeFormat = "12h" | "24h";
export type MapType = "standard" | "hybrid";

export interface Settings {
  units: Units;
  windUnit: WindUnit;
  timeFormat: TimeFormat;
  compassEnabled: boolean;
  mapType: MapType;
  /** Drone weight class for Go/No-Go thresholds. */
  droneWeightClass: WeightClassId;
}

export const DEFAULT_SETTINGS: Settings = {
  units: "imperial",
  windUnit: "mph",
  timeFormat: "12h",
  compassEnabled: true,
  mapType: "standard",
  droneWeightClass: "sub250",
};
