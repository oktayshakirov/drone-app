export type Units = "imperial" | "metric";
export type WindUnit = "mph" | "kmh" | "ms" | "knots";
export type TimeFormat = "12h" | "24h";

export interface Settings {
  units: Units;
  windUnit: WindUnit;
  timeFormat: TimeFormat;
}

export const DEFAULT_SETTINGS: Settings = {
  units: "imperial",
  windUnit: "mph",
  timeFormat: "12h",
};
