/**
 * Short, global “why this matters” copy for the metric INFO popup.
 * Country-agnostic; references drone size/weight class where relevant.
 */

export interface Info {
  title: string;
  body: string;
}

export const METRIC_INFO: Record<string, Info> = {
  wind: {
    title: "Wind",
    body:
      "Wind speed and direction affect stability and battery use. Lighter drones are more sensitive. " +
      "Always check conditions at your flying site.",
  },
  gust: {
    title: "Gust",
    body:
      "Gusts are short bursts of stronger wind. They can cause sudden drift or instability. " +
      "Consider gusts when deciding whether it’s safe to fly.",
  },
  windDirection: {
    title: "Wind direction",
    body:
      "Wind direction is where the wind is coming from. A north wind blows from north to south. " +
      "Use it to plan takeoff, landing, and flight path for consistent headwind or tailwind.",
  },
  visibility: {
    title: "Visibility",
    body:
      "Good visibility helps you keep the drone in sight and avoid obstacles. " +
      "Low visibility makes safe flight harder. Check your local rules for minimum requirements.",
  },
  cloudCover: {
    title: "Cloud cover",
    body:
      "Staying clear of clouds keeps your visual reference and reduces the risk of flying in or near cloud. " +
      "Consider cloud base and clearance when planning your flight.",
  },
  temperature: {
    title: "Temperature",
    body:
      "Cold reduces battery performance and can cause voltage drop. " +
      "Warm batteries before flight when it’s cold. Very hot conditions can also affect motors and batteries.",
  },
  humidity: {
    title: "Humidity & dew point",
    body:
      "When dew point is close to temperature, fog or condensation is more likely. " +
      "High humidity can cause moisture on the lens and sensors. Plan takeoff and landing accordingly.",
  },
  precipitation: {
    title: "Precipitation",
    body:
      "Rain or snow can damage electronics and reduce visibility. " +
      "Our caution threshold uses precipitation chance; for your drone class, consider staying grounded when rain is likely.",
  },
  sunriseSunset: {
    title: "Sunrise & sunset",
    body:
      "Many operations are flown in daylight. Sunrise and sunset help you plan flight windows " +
      "and stay within visual line of sight in good light.",
  },
  uvIndex: {
    title: "UV index",
    body:
      "UV index indicates sun strength. For long sessions outdoors, protect yourself from sun exposure " +
      "while you focus on flying safely.",
  },
  kpIndex: {
    title: "Kp index",
    body:
      "Kp index measures geomagnetic activity (0–9). High Kp can cause GPS errors and affect compass reliability. " +
      "Consider postponing flight when Kp is elevated, especially for long-range or precision operations.",
  },
};

export function getInfo(metricKey: string): Info | undefined {
  return METRIC_INFO[metricKey];
}
