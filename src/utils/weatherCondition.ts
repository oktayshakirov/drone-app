const CONDITION_LABELS: Record<string, string> = {
  Clear: "Clear",
  MostlyClear: "Mostly clear",
  PartlyCloudy: "Partly cloudy",
  MostlyCloudy: "Mostly cloudy",
  Cloudy: "Cloudy",
  Foggy: "Foggy",
  Haze: "Haze",
  Smoky: "Smoky",
  BlowingDust: "Blowing dust",
  Breezy: "Breezy",
  Windy: "Windy",
  Drizzle: "Drizzle",
  Rain: "Rain",
  HeavyRain: "Heavy rain",
  SunShowers: "Sun showers",
  Thunderstorms: "Thunderstorms",
  IsolatedThunderstorms: "Isolated thunderstorms",
  ScatteredThunderstorms: "Scattered thunderstorms",
  StrongStorms: "Strong storms",
  Flurries: "Flurries",
  Snow: "Snow",
  Sleet: "Sleet",
  WintryMix: "Wintry mix",
  SunFlurries: "Sun flurries",
  Blizzard: "Blizzard",
  Frigid: "Frigid",
  Hail: "Hail",
  Hot: "Hot",
};

/** Ionicons name for each condition (sun, rain, clouds, etc.). */
const CONDITION_ICONS: Record<string, string> = {
  Clear: "sunny",
  MostlyClear: "partly-sunny",
  PartlyCloudy: "partly-sunny",
  MostlyCloudy: "cloudy",
  Cloudy: "cloudy",
  Foggy: "cloudy",
  Haze: "cloudy",
  Smoky: "cloudy",
  BlowingDust: "cloudy",
  Breezy: "partly-sunny",
  Windy: "partly-sunny",
  Drizzle: "rainy",
  Rain: "rainy",
  HeavyRain: "rainy",
  SunShowers: "rainy",
  Thunderstorms: "thunderstorm",
  IsolatedThunderstorms: "thunderstorm",
  ScatteredThunderstorms: "thunderstorm",
  StrongStorms: "thunderstorm",
  Flurries: "snow",
  Snow: "snow",
  Sleet: "snow",
  WintryMix: "snow",
  SunFlurries: "snow",
  Blizzard: "snow",
  Frigid: "snow",
  Hail: "thunderstorm",
  Hot: "sunny",
};

export function conditionCodeToLabel(code: string | null): string {
  if (!code) return "—";
  return (
    CONDITION_LABELS[code] ??
    code
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase())
  );
}

export function conditionCodeToIcon(code: string | null): string {
  if (!code) return "partly-sunny";
  return CONDITION_ICONS[code] ?? "partly-sunny";
}
