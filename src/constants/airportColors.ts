import type { AirportType } from "../api/airports";

/** Shared orange for large + medium on the map (medium tone — large hubs are rare). */
const BIG_AIRPORT_MAP_COLOR = "#f97316";

/**
 * Map pin colors by airport type (for react-native-maps Marker pinColor).
 * Large and medium use the same color as one visual category ("Big Airport").
 */
export const AIRPORT_TYPE_COLORS: Record<AirportType, string> = {
  large_airport: BIG_AIRPORT_MAP_COLOR,
  medium_airport: BIG_AIRPORT_MAP_COLOR,
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

/** Display labels (map callout, etc.). Large + medium share "Big Airport". */
export const AIRPORT_TYPE_LABELS: Record<AirportType, string> = {
  large_airport: "Big Airport",
  medium_airport: "Big Airport",
  small_airport: "Small Airport",
  heliport: "Helicopter Airport",
  seaplane_base: "Seaplane Airport",
};

export const MAP_AIRPORT_LEGEND_KEYS = [
  "big",
  "small",
  "heliport",
  "seaplane",
] as const;

export type MapAirportLegendKey = (typeof MAP_AIRPORT_LEGEND_KEYS)[number];

/** Map legend / filter rows (large + medium merged as "big"). */
export const MAP_AIRPORT_LEGEND_ENTRIES: readonly {
  key: MapAirportLegendKey;
  label: string;
  color: string;
  /** API types included in this legend row (for docs / tooling). */
  types: readonly AirportType[];
}[] = [
  {
    key: "big",
    label: "Big Airport",
    color: BIG_AIRPORT_MAP_COLOR,
    types: ["large_airport", "medium_airport"],
  },
  {
    key: "small",
    label: "Small Airport",
    color: AIRPORT_TYPE_COLORS.small_airport,
    types: ["small_airport"],
  },
  {
    key: "heliport",
    label: "Helicopter Airport",
    color: AIRPORT_TYPE_COLORS.heliport,
    types: ["heliport"],
  },
  {
    key: "seaplane",
    label: "Seaplane Airport",
    color: AIRPORT_TYPE_COLORS.seaplane_base,
    types: ["seaplane_base"],
  },
];

export function airportTypeToLegendKey(type: AirportType): MapAirportLegendKey {
  switch (type) {
    case "large_airport":
    case "medium_airport":
      return "big";
    case "small_airport":
      return "small";
    case "heliport":
      return "heliport";
    case "seaplane_base":
      return "seaplane";
    default:
      return "small";
  }
}

export function defaultAirportLegendVisibility(): Record<
  MapAirportLegendKey,
  boolean
> {
  return {
    big: true,
    small: true,
    heliport: true,
    seaplane: true,
  };
}

export function getAirportTypeLabel(type: AirportType): string {
  return AIRPORT_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

export const AIRPORT_TYPE_RADIUS_M: Record<AirportType, number> = {
  large_airport: 9300,
  medium_airport: 8100,
  small_airport: 5600,
  heliport: 1500,
  seaplane_base: 2800,
};

export function getAirportPinColor(type: AirportType): string {
  return AIRPORT_TYPE_COLORS[type] ?? "#94a3b8";
}

export function getAirportCircleRadiusM(type: AirportType): number {
  return AIRPORT_TYPE_RADIUS_M[type] ?? 1000;
}

/**
 * When several airports' no-fly circles overlap on the map, one marker is shown; higher
 * priority wins. Large still beats medium when both overlap (larger no-fly circle).
 */
export function getAirportTypeOverlapPriority(type: AirportType): number {
  switch (type) {
    case "large_airport":
      return 5;
    case "medium_airport":
      return 4;
    case "small_airport":
      return 3;
    case "seaplane_base":
      return 2;
    case "heliport":
      return 1;
    default:
      return 0;
  }
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
