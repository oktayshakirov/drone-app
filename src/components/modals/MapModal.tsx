import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { fetchAirportsInRadius, type Airport, type AirportType } from "../../api/airports";
import { useSettings } from "../../contexts/SettingsContext";
import {
  AIRPORT_TYPE_COLORS,
  getAirportTypeLabel,
} from "../../constants/airportColors";
import type { MapType } from "../../types/settings";
import {
  MapSearchBar,
  NoFlyZoneMapView,
  mergeAirports,
  distanceKm,
  NOMINATIM_URL,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_LATITUDE_DELTA,
  DEFAULT_LONGITUDE_DELTA,
  AIRPORT_FETCH_RADIUS_KM,
  AIRPORT_FETCH_MIN_MOVE_KM,
  AIRPORT_FETCH_THROTTLE_MS,
  type SearchResult,
} from "../map";

const BACKGROUND_GRADIENT: readonly [string, string, ...string[]] = [
  "#000000",
  "#0a0a0a",
  "#111111",
];

const FALLBACK_TOP_INSET = Platform.select({
  ios: 47,
  android: 24,
  default: 0,
});

const MAP_TYPE_OPTIONS: { value: MapType; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "hybrid", label: "Satellite" },
];

const AIRPORT_TYPES_LEGEND = Object.keys(AIRPORT_TYPE_COLORS) as AirportType[];

interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
}

export function MapModal({
  visible,
  onClose,
  latitude,
  longitude,
}: MapModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.gradient}>
          <MapModalContent
            visible={visible}
            latitude={latitude}
            longitude={longitude}
            onClose={onClose}
          />
        </LinearGradient>
      </SafeAreaProvider>
    </Modal>
  );
}

function MapModalContent({
  visible,
  latitude,
  longitude,
  onClose,
}: MapModalProps & { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { settings, setMapType } = useSettings();
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const topInset = insets.top > 0 ? insets.top : FALLBACK_TOP_INSET;
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;

  const mapRef = useRef<React.ComponentRef<typeof MapView> | null>(null);
  const airportFetchAbortRef = useRef<AbortController | null>(null);
  const lastFetchedCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastFetchedAtRef = useRef<number>(0);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const [airports, setAirports] = useState<Airport[]>([]);
  const [airportsLoading, setAirportsLoading] = useState(false);
  const [mapTypeMenuVisible, setMapTypeMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const mapType = settings.mapType;

  const centerRegion = useCallback((lat: number, lng: number) => {
    const region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: DEFAULT_LATITUDE_DELTA,
      longitudeDelta: DEFAULT_LONGITUDE_DELTA,
    };
    const map = mapRef.current as
      | { animateToRegion?: (r: typeof region, d?: number) => void }
      | null;
    map?.animateToRegion?.(region, 350);
  }, []);

  const handleCenterLocation = useCallback(() => {
    centerRegion(latitude, longitude);
  }, [latitude, longitude, centerRegion]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearching(true);
    try {
      const url = `${NOMINATIM_URL}?q=${encodeURIComponent(trimmed)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { "User-Agent": "DronePal/1.0" },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Search failed");
      const data = (await res.json()) as SearchResult[];
      if (!controller.signal.aborted) {
        setSearchResults(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError" && !controller.signal.aborted) {
        setSearchResults([]);
      }
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      runSearch(searchQuery);
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, runSearch]);

  const fetchAirportsForCenter = useCallback((lat: number, lng: number) => {
    airportFetchAbortRef.current?.abort();
    const controller = new AbortController();
    airportFetchAbortRef.current = controller;
    setAirportsLoading(true);
    fetchAirportsInRadius(lat, lng, AIRPORT_FETCH_RADIUS_KM, controller.signal)
      .then((list) => {
        setAirports((prev) => mergeAirports(prev, list, lat, lng));
        lastFetchedCenterRef.current = { lat, lng };
        lastFetchedAtRef.current = Date.now();
      })
      .catch(() => {})
      .finally(() => {
        if (airportFetchAbortRef.current === controller) {
          setAirportsLoading(false);
        }
      });
  }, []);

  const onSelectSearchResult = useCallback(
    (item: SearchResult) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        centerRegion(lat, lon);
        setSearchVisible(false);
        setSearchQuery("");
        setSearchResults([]);
        Keyboard.dismiss();
        fetchAirportsForCenter(lat, lon);
      }
    },
    [centerRegion, fetchAirportsForCenter],
  );

  const searchResultKeyExtractor = useCallback(
    (item: SearchResult) => `${item.lat}-${item.lon}-${item.display_name}`,
    [],
  );

  useEffect(() => {
    if (!visible) {
      airportFetchAbortRef.current?.abort();
      airportFetchAbortRef.current = null;
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      lastFetchedCenterRef.current = null;
      lastFetchedAtRef.current = 0;
      setAirports([]);
      setAirportsLoading(false);
      setSearchVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      setSearching(false);
      setMapTypeMenuVisible(false);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
      return;
    }
    if (!isNative) return;
    lastFetchedCenterRef.current = null;
    lastFetchedAtRef.current = 0;
    fetchAirportsForCenter(latitude, longitude);
  }, [visible, latitude, longitude, isNative, fetchAirportsForCenter]);

  const onRegionChangeComplete = useCallback(
    (region: { latitude: number; longitude: number }) => {
      if (!isNative) return;
      const now = Date.now();
      const last = lastFetchedCenterRef.current;
      const lastTime = lastFetchedAtRef.current;
      if (now - lastTime < AIRPORT_FETCH_THROTTLE_MS) return;
      if (
        last != null &&
        distanceKm(region.latitude, region.longitude, last.lat, last.lng) <
          AIRPORT_FETCH_MIN_MOVE_KM
      )
        return;
      fetchAirportsForCenter(region.latitude, region.longitude);
    },
    [isNative, fetchAirportsForCenter],
  );

  const initialRegion = useMemo(
    () => ({
      latitude,
      longitude,
      latitudeDelta: DEFAULT_LATITUDE_DELTA,
      longitudeDelta: DEFAULT_LONGITUDE_DELTA,
    }),
    [latitude, longitude],
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset, paddingBottom: bottomInset },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>No Fly Zone Map</Text>
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={24} color="#94a3b8" />
        </Pressable>
      </View>

      <MapSearchBar
        visible={searchVisible}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        searching={searching}
        onSelectResult={onSelectSearchResult}
        keyExtractor={searchResultKeyExtractor}
      />

      {/* Loading bar */}
      {airportsLoading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color="#94a3b8" />
          <Text style={styles.loadingText}>Loading airports…</Text>
        </View>
      )}

      {isNative ? (
        <View style={styles.mapWrapper}>
          <NoFlyZoneMapView
            latitude={latitude}
            longitude={longitude}
            airports={airports}
            mapRef={mapRef}
            initialRegion={initialRegion}
            onRegionChangeComplete={onRegionChangeComplete}
            mapType={mapType}
          />

          {/* Legend */}
          <View style={styles.legend}>
            {AIRPORT_TYPES_LEGEND.map((type) => (
              <View key={type} style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: AIRPORT_TYPE_COLORS[type] },
                  ]}
                />
                <Text style={styles.legendLabel}>
                  {getAirportTypeLabel(type)}
                </Text>
              </View>
            ))}
          </View>

          {/* Map type menu */}
          {mapTypeMenuVisible && (
            <View style={styles.mapTypeMenu}>
              {MAP_TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.mapTypeOption,
                    mapType === opt.value && styles.mapTypeOptionActive,
                  ]}
                  onPress={() => {
                    setMapType(opt.value);
                    setMapTypeMenuVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.mapTypeOptionText,
                      mapType === opt.value && styles.mapTypeOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Control buttons */}
          <View style={styles.mapButtons}>
            <Pressable
              onPress={() => setMapTypeMenuVisible((v) => !v)}
              style={styles.mapButton}
            >
              <Ionicons
                name="layers"
                size={22}
                color={mapTypeMenuVisible ? "#cbd5e1" : "#94a3b8"}
              />
            </Pressable>
            <Pressable
              onPress={() => setSearchVisible((v) => !v)}
              style={styles.mapButton}
            >
              <Ionicons
                name="search"
                size={22}
                color={searchVisible ? "#cbd5e1" : "#94a3b8"}
              />
            </Pressable>
            <Pressable onPress={handleCenterLocation} style={styles.mapButton}>
              <Ionicons name="locate" size={22} color="#94a3b8" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="map-outline" size={48} color="#64748b" />
          <Text style={styles.placeholderText}>
            Maps are available on iOS and Android.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    padding: 8,
    margin: -8,
  },
  loadingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  mapWrapper: { flex: 1, position: "relative" },
  legend: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "column",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  mapTypeMenu: {
    position: "absolute",
    bottom: 160,
    right: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    minWidth: 120,
  },
  mapTypeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  mapTypeOptionActive: {
    backgroundColor: "rgba(148,163,184,0.2)",
  },
  mapTypeOptionText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  mapTypeOptionTextActive: {
    color: "#e2e8f0",
    fontWeight: "600",
  },
  mapButtons: {
    position: "absolute",
    bottom: 16,
    right: 12,
    flexDirection: "column",
    gap: 8,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
});
