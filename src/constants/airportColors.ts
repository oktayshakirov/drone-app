import type { AirportType } from "../api/airports";

/**
 * Map pin colors by airport type (for react-native-maps Marker pinColor).
 * Chosen for visibility on dark map and distinction between types.
 */
export const AIRPORT_TYPE_COLORS: Record<AirportType, string> = {
  large_airport: "#ef4444",
  medium_airport: "#f97316",
  small_airport: "#eab308",
  heliport: "#a855f7",
  seaplane_base: "#06b6d4",
};

/** Icon for map marker: "airplane" (Ionicons) or "helicopter" (MaterialCommunityIcons). */
export const AIRPORT_TYPE_MARKER_ICON: Record<
  AirportType,
  { family: "ionicons"; name: string } | { family: "material"; name: string }
> = {
  large_airport: { family: "ionicons", name: "airplane" },
  medium_airport: { family: "ionicons", name: "airplane" },
  small_airport: { family: "ionicons", name: "airplane" },
  heliport: { family: "material", name: "helicopter" },
  seaplane_base: { family: "ionicons", name: "airplane" },
};

/** Display labels for the map legend (title case). */
export const AIRPORT_TYPE_LABELS: Record<AirportType, string> = {
  large_airport: "Large Airport",
  medium_airport: "Medium Airport",
  small_airport: "Small Airport",
  heliport: "Helicopter Airport",
  seaplane_base: "Seaplane Airport",
};

export function getAirportTypeLabel(type: AirportType): string {
  return AIRPORT_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

/** Approximate no-fly / controlled zone radius in meters for circle overlay. */
export const AIRPORT_TYPE_RADIUS_M: Record<AirportType, number> = {
  large_airport: 5000,
  medium_airport: 3000,
  small_airport: 1500,
  heliport: 500,
  seaplane_base: 1000,
};

export function getAirportPinColor(type: AirportType): string {
  return AIRPORT_TYPE_COLORS[type] ?? "#94a3b8";
}

export function getAirportCircleRadiusM(type: AirportType): number {
  return AIRPORT_TYPE_RADIUS_M[type] ?? 1000;
}

/** Returns rgba string for circle fill (hex + alpha). */
export function getAirportCircleFillColor(
  type: AirportType,
  alpha = 0.12,
): string {
  const hex = AIRPORT_TYPE_COLORS[type] ?? "#94a3b8";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
