import { useState, useEffect, useCallback } from "react";
import type { WeatherData } from "../types/weather";
import { fetchWeather } from "../api/weatherKit";
import type { WeatherKitEnv } from "../api/weatherKit";
import { getMockWeather } from "../api/mockWeather";

export function useWeather(
  latitude: number | null,
  longitude: number | null,
  env: WeatherKitEnv | null,
): {
  data: WeatherData | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
  isMock: boolean;
} {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  const load = useCallback(() => {
    if (latitude == null || longitude == null) {
      setLoading(false);
      return;
    }
    const hasEnv =
      env?.teamId && env?.serviceId && env?.keyId && env?.privateKeyPem;
    if (!hasEnv) {
      setData(getMockWeather());
      setIsMock(true);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setIsMock(false);
    fetchWeather(latitude, longitude, env)
      .then(setData)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Weather fetch failed"),
      )
      .finally(() => setLoading(false));
  }, [latitude, longitude, env]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, refetch: load, isMock };
}
