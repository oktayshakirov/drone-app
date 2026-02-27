import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export function useLocation(): {
  coords: LocationCoords | null;
  placeName: string | null;
  error: string | null;
  loading: boolean;
} {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
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
        const { latitude, longitude } = location.coords;
        setCoords({ latitude, longitude });

        try {
          const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (cancelled) return;
          if (address) {
            const parts = [address.city, address.region, address.country].filter(Boolean);
            setPlaceName(parts.length > 0 ? parts.join(', ') : null);
          }
        } catch {
          // Keep placeName null; we can show coords instead
        }
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

  return { coords, placeName, error, loading };
}
