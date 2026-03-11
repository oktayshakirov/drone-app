import type { WeatherData } from "../types/weather";

/**
 * Mock weather for development when WeatherKit credentials are not set.
 */
export function getMockWeather(): WeatherData {
  return {
    current: {
      conditionCode: "PartlyCloudy",
      wind: {
        speedMps: 3.5,
        gustMps: 5,
        directionDegrees: 270,
      },
      visibilityMeters: 10000,
      cloudCoverPercent: 25,
      temperatureCelsius: 18,
      humidityPercent: 65,
      dewPointCelsius: 11,
      pressureHpa: 1013,
      uvIndex: 4,
      precipitationChancePercent: 10,
      precipitationType: null,
      sunrise: "2025-02-25T06:45:00Z",
      sunset: "2025-02-25T17:30:00Z",
      kpIndex: 2,
    },
    hourly: Array.from({ length: 24 }, (_, i) => ({
      date: new Date(Date.now() + i * 3600000).toISOString(),
      windSpeedMps: 3 + i * 0.1,
      windGustMps: 5 + i * 0.1,
      windDirectionDegrees: 270,
      cloudCoverPercent: 20 + i,
      precipitationChancePercent: 10,
      temperatureCelsius: 18 - i * 0.5,
    })),
  };
}
