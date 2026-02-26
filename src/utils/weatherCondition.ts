/**
 * WeatherKit conditionCode is PascalCase (e.g. MostlyClear, PartlyCloudy).
 * Map to human-readable labels for display.
 */
const CONDITION_LABELS: Record<string, string> = {
  Clear: 'Clear',
  MostlyClear: 'Mostly clear',
  PartlyCloudy: 'Partly cloudy',
  MostlyCloudy: 'Mostly cloudy',
  Cloudy: 'Cloudy',
  Foggy: 'Foggy',
  Haze: 'Haze',
  Smoky: 'Smoky',
  BlowingDust: 'Blowing dust',
  Breezy: 'Breezy',
  Windy: 'Windy',
  Drizzle: 'Drizzle',
  Rain: 'Rain',
  HeavyRain: 'Heavy rain',
  SunShowers: 'Sun showers',
  Thunderstorms: 'Thunderstorms',
  IsolatedThunderstorms: 'Isolated thunderstorms',
  ScatteredThunderstorms: 'Scattered thunderstorms',
  StrongStorms: 'Strong storms',
  Flurries: 'Flurries',
  Snow: 'Snow',
  Sleet: 'Sleet',
  WintryMix: 'Wintry mix',
  SunFlurries: 'Sun flurries',
  Blizzard: 'Blizzard',
  Frigid: 'Frigid',
  Hail: 'Hail',
  Hot: 'Hot',
};

export function conditionCodeToLabel(code: string | null): string {
  if (!code) return '—';
  return CONDITION_LABELS[code] ?? code.replace(/([A-Z])/g, ' $1').trim().toLowerCase().replace(/^./, (c) => c.toUpperCase());
}
