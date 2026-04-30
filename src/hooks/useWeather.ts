import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WeatherData } from "../types/weather";
import { fetchWeather } from "../api/weatherKit";
import type { WeatherKitEnv } from "../api/weatherKit";
import { fetchCurrentKpIndex } from "../api/kpIndex";

const CACHE_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 6 * 60 * 60 * 1000;

interface CachePayload {
  timestamp: number;
  data: WeatherData;
}

function cacheKey(lat: number, lon: number): string {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;
  return `weather:v2:${roundedLat},${roundedLon}`;
}

async function readCache(
  key: string,
): Promise<{ payload: CachePayload | null; isFresh: boolean; isStaleValid: boolean }> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return { payload: null, isFresh: false, isStaleValid: false };
  try {
    const payload = JSON.parse(raw) as CachePayload;
    if (!payload?.timestamp || !payload?.data) {
      return { payload: null, isFresh: false, isStaleValid: false };
    }
    const age = Date.now() - payload.timestamp;
    return {
      payload,
      isFresh: age <= CACHE_TTL_MS,
      isStaleValid: age <= STALE_TTL_MS,
    };
  } catch {
    return { payload: null, isFresh: false, isStaleValid: false };
  }
}

async function writeCache(key: string, data: WeatherData): Promise<void> {
  const payload: CachePayload = { timestamp: Date.now(), data };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}

export function useWeather(
  latitude: number | null,
  longitude: number | null,
  env: WeatherKitEnv | null,
): {
  data: WeatherData | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    if (latitude == null || longitude == null) {
      setData(null);
      setError(null);
      setLoading(true);
      return;
    }
    const key = cacheKey(latitude, longitude);

    if (env?.weatherDisabled) {
      setData(null);
      setError(null);
      setLoading(true);
      return;
    }

    const cache = await readCache(key);
    if (cache.payload && cache.isFresh) {
      setData(cache.payload.data);
      setError(null);
      setLoading(false);
      return;
    }

    const hasProxy = Boolean(env?.proxyBaseUrl?.trim());
    const hasDirect =
      Boolean(env?.teamId && env?.serviceId && env?.keyId && env?.privateKeyPem) &&
      (env?.directEnabled ?? true);
    if (!hasProxy && !hasDirect) {
      setData(null);
      setError(null);
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const weather = await fetchWeather(latitude, longitude, env ?? {});
      let next = weather;
      try {
        const kp = await fetchCurrentKpIndex();
        next = {
          ...weather,
          current: { ...weather.current, kpIndex: kp },
        };
      } catch {
        // Keep weather even if KP index endpoint fails.
      }
      setData(next);
      await writeCache(key, next);
    } catch (err) {
      if (cache.payload && cache.isStaleValid) {
        setData(cache.payload.data);
        setLoading(false);
        return;
      }
      // Keep skeleton visible when weather cannot be loaded.
      void err;
      setData(null);
      setError(null);
      setLoading(true);
    }
  }, [latitude, longitude, env]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    error,
    loading,
    refetch: useCallback(() => load(), [load]),
  };
}
