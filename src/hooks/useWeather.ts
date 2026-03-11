import { useState, useEffect, useCallback } from "react";
import type { WeatherData } from "../types/weather";
import { fetchWeather } from "../api/weatherKit";
import type { WeatherKitEnv } from "../api/weatherKit";
import { getMockWeather } from "../api/mockWeather";
import { fetchCurrentKpIndex } from "../api/kpIndex";

export function useWeather(
  latitude: number | null,
  longitude: number | null,
  env: WeatherKitEnv | null,
): {
  data: WeatherData | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
  isMock: boolean;
} {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  const load = useCallback((): Promise<void> => {
    if (latitude == null || longitude == null) {
      setLoading(false);
      return Promise.resolve();
    }
    const hasEnv =
      env?.teamId && env?.serviceId && env?.keyId && env?.privateKeyPem;
    if (!hasEnv) {
      setData(getMockWeather());
      setIsMock(true);
      setError(null);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    setError(null);
    setIsMock(false);
    return fetchWeather(latitude, longitude, env)
      .then(async (weather) => {
        const kp = await fetchCurrentKpIndex();
        setData({
          ...weather,
          current: { ...weather.current, kpIndex: kp },
        });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Weather fetch failed"),
      )
      .finally(() => setLoading(false));
  }, [latitude, longitude, env]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, refetch: useCallback(() => load(), [load]), isMock };
}
