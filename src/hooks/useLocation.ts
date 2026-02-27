import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export function useLocation(): {
  coords: LocationCoords | null;
  placeName: string | null;
  devicePlaceName: string | null;
  error: string | null;
  loading: boolean;
  setPickedLocation: (location: { latitude: number; longitude: number; placeName: string | null }) => void;
  clearPickedLocation: () => void;
} {
  const [deviceCoords, setDeviceCoords] = useState<LocationCoords | null>(null);
  const [devicePlaceName, setDevicePlaceName] = useState<string | null>(null);
  const [pickedCoords, setPickedCoords] = useState<LocationCoords | null>(null);
  const [pickedPlaceName, setPickedPlaceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        setDeviceCoords({ latitude, longitude });

        try {
          const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (cancelled) return;
          if (address) {
            const parts = [address.city, address.region, address.country].filter(Boolean);
            setDevicePlaceName(parts.length > 0 ? parts.join(', ') : null);
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

  return {
    coords,
    placeName,
    devicePlaceName,
    error,
    loading,
    setPickedLocation,
    clearPickedLocation,
  };
}
