/**
 * Unit conversions for weather display. All pure functions.
 */

const MPS_TO_MPH = 2.23694;
const METRES_TO_STATUTE_MILES = 0.000621371;

export function mpsToMph(mps: number): number {
  return mps * MPS_TO_MPH;
}

export function metresToStatuteMiles(m: number): number {
  return m * METRES_TO_STATUTE_MILES;
}

const MPS_TO_KMH = 3.6;
const MPS_TO_KNOTS = 1.94384;

export function mpsToKmh(mps: number): number {
  return mps * MPS_TO_KMH;
}
export function mpsToKnots(mps: number): number {
  return mps * MPS_TO_KNOTS;
}

export function formatWindMph(mph: number): string {
  return `${Math.round(mph)} mph`;
}

/** Format wind speed from m/s to the selected unit (one decimal for consistency). */
export function formatWind(
  mps: number,
  unit: "mph" | "kmh" | "ms" | "knots",
): string {
  switch (unit) {
    case "mph": {
      const mph = mpsToMph(mps);
      return `${mph.toFixed(1)} mph`;
    }
    case "kmh": {
      const kmh = mpsToKmh(mps);
      return `${kmh.toFixed(1)} km/h`;
    }
    case "ms":
      return `${mps.toFixed(1)} m/s`;
    case "knots": {
      const kt = mpsToKnots(mps);
      return `${kt.toFixed(1)} kt`;
    }
    default:
      return `${mpsToMph(mps).toFixed(1)} mph`;
  }
}

export function formatVisibility(meters: number): string {
  const miles = metresToStatuteMiles(meters);
  if (miles >= 10) return '10+ mi';
  return `${miles.toFixed(1)} mi`;
}

export function formatVisibilityMeters(meters: number): string {
  if (meters >= 10000) return "10+ km";
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Format visibility in mi or km based on units. */
export function formatVisibilityWithUnits(
  meters: number,
  useImperial: boolean,
): string {
  if (useImperial) {
    const miles = metresToStatuteMiles(meters);
    if (miles >= 10) return "10+ mi";
    return `${miles.toFixed(1)} mi`;
  }
  if (meters >= 10000) return "10+ km";
  return `${(meters / 1000).toFixed(1)} km`;
}

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function formatTemp(celsius: number | null, useFahrenheit: boolean): string {
  if (celsius == null) return '—';
  const value = useFahrenheit ? celsiusToFahrenheit(celsius) : celsius;
  const unit = useFahrenheit ? '°F' : '°C';
  return `${Math.round(value)}${unit}`;
}

export function formatPercent(value: number | null): string {
  if (value == null) return '—';
  return `${Math.round(value)}%`;
}

export function degreesToCardinal(deg: number | null): string {
  if (deg == null) return '—';
  const cards = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const i = Math.round(deg / 22.5) % 16;
  return cards[i];
}

/** Format ISO date-time string as short time for sunrise/sunset. use24h: "18:30" vs "6:30 PM". */
export function formatSunTime(
  isoString: string | null,
  use24h = false,
): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "—";
    const hours = d.getHours();
    const mins = d.getMinutes();
    if (use24h) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    }
    const am = hours < 12;
    const h = hours % 12 || 12;
    return `${h}:${mins.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
  } catch {
    return "—";
  }
}
