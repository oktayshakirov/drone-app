import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export function useLocation(): {
  coords: LocationCoords | null;
  error: string | null;
  loading: boolean;
} {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function requestAndGetLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (cancelled) return;
        setCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to get location');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    requestAndGetLocation();
    return () => { cancelled = true; };
  }, []);

  return { coords, error, loading };
}
