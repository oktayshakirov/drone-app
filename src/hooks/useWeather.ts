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
): Promise<{ payload: CachePayload | null; age: number }> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return { payload: null, age: Infinity };
  try {
    const payload = JSON.parse(raw) as CachePayload;
    if (!payload?.timestamp || !payload?.data) {
      return { payload: null, age: Infinity };
    }
    return { payload, age: Date.now() - payload.timestamp };
  } catch {
    return { payload: null, age: Infinity };
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
  isOffline: boolean = false,
): {
  data: WeatherData | null;
  error: string | null;
  loading: boolean;
  /** Timestamp (ms) of the data currently shown, or null when none is available. */
  lastUpdated: number | null;
  /** True when the shown data is older than the fresh window (e.g. served from cache offline). */
  isStale: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (latitude == null || longitude == null) {
      setData(null);
      setError(null);
      setLoading(true);
      setLastUpdated(null);
      setIsStale(false);
      return;
    }
    const key = cacheKey(latitude, longitude);

    if (env?.weatherDisabled) {
      setData(null);
      setError(null);
      setLoading(true);
      setLastUpdated(null);
      setIsStale(false);
      return;
    }

    const cache = await readCache(key);

    // Offline: serve cached data of any age and skip the network entirely.
    // Skeletons stay visible only when there is nothing cached to show.
    if (isOffline) {
      if (cache.payload) {
        setData(cache.payload.data);
        setLastUpdated(cache.payload.timestamp);
        setIsStale(cache.age > CACHE_TTL_MS);
        setError(null);
        setLoading(false);
      } else {
        setData(null);
        setLastUpdated(null);
        setIsStale(false);
        setError(null);
        setLoading(true);
      }
      return;
    }

    // Online with a fresh cache hit: show immediately, no network needed.
    if (cache.payload && cache.age <= CACHE_TTL_MS) {
      setData(cache.payload.data);
      setLastUpdated(cache.payload.timestamp);
      setIsStale(false);
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
      setLastUpdated(null);
      setIsStale(false);
      return;
    }

    // Keep any existing data on screen while refreshing; skeletons are shown
    // by the consumer only when there is no data yet.
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
      setLastUpdated(Date.now());
      setIsStale(false);
      setLoading(false);
      await writeCache(key, next);
    } catch (err) {
      void err;
      // Network failed while online: fall back to cached data of any age,
      // flagged stale so the UI can show how old it is.
      if (cache.payload) {
        setData(cache.payload.data);
        setLastUpdated(cache.payload.timestamp);
        setIsStale(cache.age > CACHE_TTL_MS);
        setLoading(false);
        return;
      }
      // Nothing cached: keep skeleton visible.
      setData(null);
      setLastUpdated(null);
      setIsStale(false);
      setError(null);
      setLoading(true);
    }
  }, [latitude, longitude, env, isOffline]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    error,
    loading,
    lastUpdated,
    isStale,
    refetch: useCallback(() => load(), [load]),
  };
}
