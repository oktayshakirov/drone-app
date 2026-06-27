import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

const LAST_LOCATION_KEY = 'dronepal_lastDeviceLocation';

/** Same precision the weather cache uses (~1.1km), to avoid redundant refetches. */
function coordKey(lat: number, lon: number): string {
  return `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
}

export function useLocation(): {
  coords: LocationCoords | null;
  placeName: string | null;
  devicePlaceName: string | null;
  error: string | null;
  loading: boolean;
  /** True after the OS location permission prompt has returned (granted or denied). Use to sequence other modals (e.g. ads consent). */
  foregroundPermissionResolved: boolean;
  setPickedLocation: (location: { latitude: number; longitude: number; placeName: string | null }) => void;
  clearPickedLocation: () => void;
} {
  const [deviceCoords, setDeviceCoords] = useState<LocationCoords | null>(null);
  const [devicePlaceName, setDevicePlaceName] = useState<string | null>(null);
  const [pickedCoords, setPickedCoords] = useState<LocationCoords | null>(null);
  const [pickedPlaceName, setPickedPlaceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [foregroundPermissionResolved, setForegroundPermissionResolved] =
    useState(false);

  const coords = pickedCoords ?? deviceCoords;
  const placeName = pickedPlaceName ?? devicePlaceName;

  const setPickedLocation = useCallback(
    (location: { latitude: number; longitude: number; placeName: string | null }) => {
      setPickedCoords({ latitude: location.latitude, longitude: location.longitude });
      setPickedPlaceName(location.placeName ?? null);
    },
    [],
  );

  const clearPickedLocation = useCallback(() => {
    setPickedCoords(null);
    setPickedPlaceName(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Tracks the rounded coordinate already applied, so refining the location
    // in the background doesn't trigger a redundant weather refetch when the
    // user hasn't meaningfully moved.
    let appliedKey: string | null = null;

    async function persist(lat: number, lon: number, name: string | null) {
      try {
        await AsyncStorage.setItem(
          LAST_LOCATION_KEY,
          JSON.stringify({ latitude: lat, longitude: lon, placeName: name }),
        );
      } catch {
        // Persisting the last location is best-effort.
      }
    }

    async function reverseGeocode(lat: number, lon: number): Promise<void> {
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (cancelled || !address) return;
        const parts = [address.city, address.region, address.country].filter(Boolean);
        const name = parts.length > 0 ? parts.join(', ') : null;
        if (name) {
          setDevicePlaceName(name);
          void persist(lat, lon, name);
        }
      } catch {
        // Keep existing placeName; we can show coords instead.
      }
    }

    /** Applies a device location, skipping work when it rounds to the same place. */
    function applyDeviceLocation(lat: number, lon: number, refresh: boolean) {
      const key = coordKey(lat, lon);
      if (key === appliedKey) return;
      appliedKey = key;
      setDeviceCoords({ latitude: lat, longitude: lon });
      void persist(lat, lon, null);
      if (refresh) void reverseGeocode(lat, lon);
    }

    async function init() {
      // 1. Instant: hydrate from the persisted last location so cached weather
      //    can render immediately instead of waiting for a GPS fix.
      try {
        const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
        if (raw && !cancelled) {
          const saved = JSON.parse(raw) as Partial<LocationCoords> & {
            placeName?: string | null;
          };
          if (saved?.latitude != null && saved?.longitude != null) {
            appliedKey = coordKey(saved.latitude, saved.longitude);
            setDeviceCoords({ latitude: saved.latitude, longitude: saved.longitude });
            if (saved.placeName) setDevicePlaceName(saved.placeName);
            setLoading(false);
          }
        }
      } catch {
        // Ignore hydration errors; we'll fetch a fresh location below.
      }

      // 2. Permission (instant after the first grant; shows the dialog only once).
      let status: Location.PermissionStatus;
      try {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      } catch {
        if (!cancelled) {
          setError('Failed to get location');
          setLoading(false);
        }
        return;
      } finally {
        if (!cancelled) setForegroundPermissionResolved(true);
      }
      if (cancelled) return;
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      // 3. Fast: last known position needs no satellite fix — usually instant.
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) {
          applyDeviceLocation(last.coords.latitude, last.coords.longitude, true);
          setLoading(false);
        }
      } catch {
        // Fall through to a fresh fix.
      }

      // 4. Refine in the background with a balanced-accuracy fix. Balanced uses
      //    wifi/cell (fast) and is plenty for weather, which rounds to ~1km.
      try {
        const fresh = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        applyDeviceLocation(fresh.coords.latitude, fresh.coords.longitude, true);
      } catch (e) {
        // If we already have coords (hydrated or last-known), keep showing them.
        if (!cancelled && appliedKey == null) {
          setError(e instanceof Error ? e.message : 'Failed to get location');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return {
    coords,
    placeName,
    devicePlaceName,
    error,
    loading,
    foregroundPermissionResolved,
    setPickedLocation,
    clearPickedLocation,
  };
}
