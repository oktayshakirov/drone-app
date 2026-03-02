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
}

export const DEFAULT_SETTINGS: Settings = {
  units: "imperial",
  windUnit: "mph",
  timeFormat: "12h",
  compassEnabled: true,
  mapType: "standard",
};
