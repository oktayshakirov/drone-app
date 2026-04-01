import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Platform, type NativeSyntheticEvent } from "react-native";
import MapView from "react-native-maps";
import {
  fetchAirportsInRadius,
  fetchAirportsForMapViewport,
  type Airport,
} from "../../api/airports";
import {
  mergeAirports,
  distanceKm,
  isValidMapCoordinate,
  DEFAULT_LATITUDE_DELTA,
  DEFAULT_LONGITUDE_DELTA,
  AIRPORT_FETCH_RADIUS_KM,
  AIRPORT_VIEWPORT_IDLE_MS,
  AIRPORT_STAY_STILL_GRACE_MS,
  MAP_REGION_AFTER_FETCH_KM,
  MAP_SUPPRESS_REGION_START_AFTER_COUNTDOWN_MS,
} from "./mapUtils";
import {
  isWithinLoadedViewport,
  shouldRunMapIdleFetch,
  isBurstDuplicateRegionComplete,
  isAnchorDuplicateRegionComplete,
  type MapLatLng,
  type RegionCompleteBurst,
} from "./mapViewportFetchGuards";

const FALLBACK_CENTER: MapLatLng = { lat: 20, lng: 0 };

export interface UseMapViewportAirportsOptions {
  visible: boolean;
  isNative: boolean;
  userLat: number;
  userLng: number;
}

export interface UseMapViewportAirportsResult {
  airports: Airport[];
  airportsLoading: boolean;
  idleCountdownSeconds: number | null;
  mapViewCenter: MapLatLng;
  mapRef: React.RefObject<React.ComponentRef<typeof MapView> | null>;
  centerOnRegion: (lat: number, lng: number) => void;
  requestAirportsForUser: (lat: number, lng: number) => void;
  onRegionChangeStart: (
    e: NativeSyntheticEvent<{ isGesture?: boolean }>,
  ) => void;
  onRegionChangeComplete: (region: {
    latitude: number;
    longitude: number;
  }) => void;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

/**
 * Map-driven airport loading: open fetch, user/search, idle viewport fetch after stay-still
 * grace + countdown. All timers and duplicate-region guards live here.
 */
export function useMapViewportAirports(
  options: UseMapViewportAirportsOptions,
): UseMapViewportAirportsResult {
  const { visible, isNative, userLat, userLng } = options;

  const mapRef = useRef<React.ComponentRef<typeof MapView> | null>(null);
  const mapModalSessionRef = useRef(0);
  const wasVisibleRef = useRef(false);
  const airportFetchAbortRef = useRef<AbortController | null>(null);
  const airportFetchRequestIdRef = useRef(0);
  const bootstrapFetchInFlightRef = useRef(false);
  const deferredMapFetchRef = useRef<MapLatLng | null>(null);
  const pendingMapCenterRef = useRef<MapLatLng | null>(null);
  const lastSuccessfulFetchCenterRef = useRef<MapLatLng | null>(null);
  const lastIdleScheduleAnchorRef = useRef<MapLatLng | null>(null);
  const lastMapCompleteBurstRef = useRef<RegionCompleteBurst | null>(null);
  const suppressRegionChangeStartUntilRef = useRef(0);
  const airportRegionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const stayStillGraceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const idleCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const [airports, setAirports] = useState<Airport[]>([]);
  const airportsRef = useRef<Airport[]>([]);
  useEffect(() => {
    airportsRef.current = airports;
  }, [airports]);

  const [airportsLoading, setAirportsLoading] = useState(false);
  const [idleCountdownSeconds, setIdleCountdownSeconds] = useState<number | null>(
    null,
  );
  const [mapViewCenter, setMapViewCenter] = useState<MapLatLng>({
    lat: FALLBACK_CENTER.lat,
    lng: FALLBACK_CENTER.lng,
  });

  const clearAirportRegionDebounce = useCallback(() => {
    if (airportRegionDebounceRef.current) {
      clearTimeout(airportRegionDebounceRef.current);
      airportRegionDebounceRef.current = null;
    }
  }, []);

  const clearIdleCountdown = useCallback(() => {
    if (idleCountdownIntervalRef.current) {
      clearInterval(idleCountdownIntervalRef.current);
      idleCountdownIntervalRef.current = null;
    }
    setIdleCountdownSeconds(null);
  }, []);

  const cancelIdleViewportSchedule = useCallback(() => {
    if (stayStillGraceTimeoutRef.current) {
      clearTimeout(stayStillGraceTimeoutRef.current);
      stayStillGraceTimeoutRef.current = null;
    }
    clearAirportRegionDebounce();
    clearIdleCountdown();
  }, [clearAirportRegionDebounce, clearIdleCountdown]);

  const runAirportFetch = useCallback(
    (lat: number, lng: number, source: "open" | "map" | "user") => {
      if (!isValidMapCoordinate(lat, lng)) return;

      if (source === "map" && bootstrapFetchInFlightRef.current) {
        deferredMapFetchRef.current = { lat, lng };
        return;
      }
      if (source !== "map" && bootstrapFetchInFlightRef.current) {
        bootstrapFetchInFlightRef.current = false;
        deferredMapFetchRef.current = null;
      }

      cancelIdleViewportSchedule();
      pendingMapCenterRef.current = { lat, lng };
      lastIdleScheduleAnchorRef.current = { lat, lng };

      airportFetchAbortRef.current?.abort();
      const controller = new AbortController();
      airportFetchAbortRef.current = controller;
      const requestId = ++airportFetchRequestIdRef.current;
      const sessionAtStart = mapModalSessionRef.current;
      if (source === "open") {
        bootstrapFetchInFlightRef.current = true;
      }
      setAirportsLoading(true);

      const fetchPromise =
        source === "map"
          ? fetchAirportsForMapViewport(
              lat,
              lng,
              AIRPORT_FETCH_RADIUS_KM,
              controller.signal,
            )
          : fetchAirportsInRadius(
              lat,
              lng,
              AIRPORT_FETCH_RADIUS_KM,
              controller.signal,
              { skipEmptyRetry: false },
            );

      fetchPromise
        .then((list) => {
          if (controller.signal.aborted) return;
          if (sessionAtStart !== mapModalSessionRef.current) return;
          if (requestId !== airportFetchRequestIdRef.current) return;
          lastSuccessfulFetchCenterRef.current = { lat, lng };
          if (source === "map" && list.length === 0) {
            setAirports((prev) =>
              prev.filter(
                (a) =>
                  distanceKm(a.lat, a.lon, lat, lng) <=
                  AIRPORT_FETCH_RADIUS_KM * 2,
              ),
            );
          } else {
            setAirports((prev) => mergeAirports(prev, list, lat, lng));
          }
        })
        .catch((err) => {
          const name = (err as Error)?.name;
          if (name === "AbortError" || controller.signal.aborted) return;
        })
        .finally(() => {
          const isCurrentRequest = requestId === airportFetchRequestIdRef.current;
          const finishedBootstrap = source === "open";
          if (finishedBootstrap) {
            bootstrapFetchInFlightRef.current = false;
          }
          if (!isCurrentRequest) return;
          setAirportsLoading(false);
          if (finishedBootstrap && deferredMapFetchRef.current != null) {
            const deferred = deferredMapFetchRef.current;
            deferredMapFetchRef.current = null;
            runAirportFetch(deferred.lat, deferred.lng, "map");
          }
        });
    },
    [cancelIdleViewportSchedule],
  );

  const scheduleIdleViewportFetch = useCallback(() => {
    const p = pendingMapCenterRef.current;
    const last = lastSuccessfulFetchCenterRef.current;

    if (isWithinLoadedViewport(p, last, airportsRef.current.length)) {
      cancelIdleViewportSchedule();
      return;
    }

    cancelIdleViewportSchedule();

    stayStillGraceTimeoutRef.current = setTimeout(() => {
      stayStillGraceTimeoutRef.current = null;

      const pGrace = pendingMapCenterRef.current;
      const lastGrace = lastSuccessfulFetchCenterRef.current;
      if (
        isWithinLoadedViewport(
          pGrace,
          lastGrace,
          airportsRef.current.length,
        )
      ) {
        return;
      }

      suppressRegionChangeStartUntilRef.current =
        Date.now() + MAP_SUPPRESS_REGION_START_AFTER_COUNTDOWN_MS;

      const startSec = Math.ceil(AIRPORT_VIEWPORT_IDLE_MS / 1000);
      setIdleCountdownSeconds(startSec);
      idleCountdownIntervalRef.current = setInterval(() => {
        setIdleCountdownSeconds((s) => {
          if (s == null || s <= 0) return s;
          return s - 1;
        });
      }, 1000);

      airportRegionDebounceRef.current = setTimeout(() => {
        airportRegionDebounceRef.current = null;
        clearIdleCountdown();
        const p2 = pendingMapCenterRef.current;
        if (
          !shouldRunMapIdleFetch(
            p2,
            lastSuccessfulFetchCenterRef.current,
            airportsRef.current.length,
          ) ||
          !p2
        ) {
          return;
        }
        runAirportFetch(p2.lat, p2.lng, "map");
      }, AIRPORT_VIEWPORT_IDLE_MS);
    }, AIRPORT_STAY_STILL_GRACE_MS);
  }, [cancelIdleViewportSchedule, clearIdleCountdown, runAirportFetch]);

  const requestAirportsForUser = useCallback(
    (lat: number, lng: number) => {
      runAirportFetch(lat, lng, "user");
    },
    [runAirportFetch],
  );

  const centerOnRegion = useCallback((lat: number, lng: number) => {
    const region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: DEFAULT_LATITUDE_DELTA,
      longitudeDelta: DEFAULT_LONGITUDE_DELTA,
    };
    const map = mapRef.current as {
      animateToRegion?: (r: typeof region, d?: number) => void;
    } | null;
    map?.animateToRegion?.(region, 350);
  }, []);

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      cancelIdleViewportSchedule();
      airportFetchAbortRef.current?.abort();
      airportFetchAbortRef.current = null;
      airportFetchRequestIdRef.current += 1;
      bootstrapFetchInFlightRef.current = false;
      deferredMapFetchRef.current = null;
      mapModalSessionRef.current += 1;
      pendingMapCenterRef.current = null;
      lastSuccessfulFetchCenterRef.current = null;
      lastIdleScheduleAnchorRef.current = null;
      lastMapCompleteBurstRef.current = null;
      suppressRegionChangeStartUntilRef.current = 0;
      setAirports([]);
      setAirportsLoading(false);
      return;
    }
    if (!isNative) return;
    const openingNow = !wasVisibleRef.current;
    wasVisibleRef.current = true;
    if (openingNow) {
      mapModalSessionRef.current += 1;
      setMapViewCenter({ lat: userLat, lng: userLng });
    }

    pendingMapCenterRef.current = { lat: userLat, lng: userLng };

    const lastFetch = lastSuccessfulFetchCenterRef.current;
    const needsInitialFetch = openingNow || lastFetch == null;
    const movedFromLastFetch =
      lastFetch != null &&
      distanceKm(userLat, userLng, lastFetch.lat, lastFetch.lng) >=
        MAP_REGION_AFTER_FETCH_KM;

    if (needsInitialFetch || movedFromLastFetch) {
      runAirportFetch(userLat, userLng, "open");
    }
  }, [
    visible,
    isNative,
    userLat,
    userLng,
    runAirportFetch,
    cancelIdleViewportSchedule,
  ]);

  const onRegionChangeStart = useCallback(
    (e: NativeSyntheticEvent<{ isGesture?: boolean }>) => {
      if (!isNative) return;
      if (Date.now() < suppressRegionChangeStartUntilRef.current) return;
      if (Platform.OS === "android" && e.nativeEvent?.isGesture === false) {
        return;
      }
      cancelIdleViewportSchedule();
    },
    [isNative, cancelIdleViewportSchedule],
  );

  const onRegionChangeComplete = useCallback(
    (region: { latitude: number; longitude: number }) => {
      if (!isNative) return;
      const lat = region.latitude;
      const lng = region.longitude;
      if (!isValidMapCoordinate(lat, lng)) return;

      const now = Date.now();
      if (isBurstDuplicateRegionComplete(lat, lng, now, lastMapCompleteBurstRef.current)) {
        return;
      }
      lastMapCompleteBurstRef.current = { at: now, lat, lng };

      const anchor = lastIdleScheduleAnchorRef.current;
      if (isAnchorDuplicateRegionComplete(lat, lng, anchor)) {
        return;
      }
      lastIdleScheduleAnchorRef.current = { lat, lng };
      pendingMapCenterRef.current = { lat, lng };
      setMapViewCenter({ lat, lng });
      scheduleIdleViewportFetch();
    },
    [isNative, scheduleIdleViewportFetch],
  );

  const initialRegion = useMemo(
    () => ({
      latitude: userLat,
      longitude: userLng,
      latitudeDelta: DEFAULT_LATITUDE_DELTA,
      longitudeDelta: DEFAULT_LONGITUDE_DELTA,
    }),
    [userLat, userLng],
  );

  return {
    airports,
    airportsLoading,
    idleCountdownSeconds,
    mapViewCenter,
    mapRef,
    centerOnRegion,
    requestAirportsForUser,
    onRegionChangeStart,
    onRegionChangeComplete,
    initialRegion,
  };
}
