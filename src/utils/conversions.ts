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

export function formatWindMph(mph: number): string {
  return `${Math.round(mph)} mph`;
}

export function formatVisibility(meters: number): string {
  const miles = metresToStatuteMiles(meters);
  if (miles >= 10) return '10+ mi';
  return `${miles.toFixed(1)} mi`;
}

export function formatVisibilityMeters(meters: number): string {
  if (meters >= 10000) return '10+ km';
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
