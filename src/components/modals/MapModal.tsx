import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Switch,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import {
  MAP_AIRPORT_LEGEND_ENTRIES,
  airportTypeToLegendKey,
  defaultAirportLegendVisibility,
  type MapAirportLegendKey,
} from "../../constants/airportColors";
import type { MapType } from "../../types/settings";
import {
  MapSearchBar,
  NoFlyZoneMapView,
  isValidMapCoordinate,
  NOMINATIM_URL,
  SEARCH_DEBOUNCE_MS,
  useMapViewportAirports,
  type SearchResult,
} from "../map";

const FALLBACK_TOP_INSET = Platform.select({
  ios: 47,
  android: 24,
  default: 0,
});

const MAP_TYPE_OPTIONS: { value: MapType; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "hybrid", label: "Satellite" },
];

const FALLBACK_USER_COORD = { lat: 20, lng: 0 };

interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  isPro?: boolean;
  showPaywall?: () => Promise<void>;
  revenueCatAvailable?: boolean;
}

export function MapModal({
  visible,
  onClose,
  latitude,
  longitude,
  isPro = true,
  showPaywall,
  revenueCatAvailable = false,
}: MapModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <SafeAreaProvider>
        <View style={styles.background}>
          <MapModalContent
            visible={visible}
            latitude={latitude}
            longitude={longitude}
            onClose={onClose}
            isPro={isPro}
            showPaywall={showPaywall}
            revenueCatAvailable={revenueCatAvailable}
          />
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

function MapModalContent({
  visible,
  latitude,
  longitude,
  onClose,
  isPro,
  showPaywall,
  revenueCatAvailable,
}: MapModalProps & { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { settings, setMapType } = useSettings();
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const topInset = insets.top > 0 ? insets.top : FALLBACK_TOP_INSET;
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const [mapTypeMenuVisible, setMapTypeMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const userLatResolved = isValidMapCoordinate(latitude, longitude)
    ? latitude
    : FALLBACK_USER_COORD.lat;
  const userLngResolved = isValidMapCoordinate(latitude, longitude)
    ? longitude
    : FALLBACK_USER_COORD.lng;

  const mapType = settings.mapType;

  const {
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
  } = useMapViewportAirports({
    visible,
    isNative,
    userLat: userLatResolved,
    userLng: userLngResolved,
  });

  const [airportTypesSheetVisible, setAirportTypesSheetVisible] = useState(false);
  const [airportLegendVisibility, setAirportLegendVisibility] = useState<
    Record<MapAirportLegendKey, boolean>
  >(() => defaultAirportLegendVisibility());

  const airportsForMap = useMemo(() => {
    return airports.filter((a) => {
      const key = airportTypeToLegendKey(a.type);
      return airportLegendVisibility[key] !== false;
    });
  }, [airports, airportLegendVisibility]);

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

  useEffect(() => {
    if (!visible) {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      setSearchVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      setSearching(false);
      setMapTypeMenuVisible(false);
      setAirportTypesSheetVisible(false);
      setAirportLegendVisibility(defaultAirportLegendVisibility());
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, [visible]);

  const handleCenterLocation = useCallback(() => {
    if (!isValidMapCoordinate(latitude, longitude)) return;
    centerOnRegion(latitude, longitude);
    requestAirportsForUser(latitude, longitude);
  }, [latitude, longitude, centerOnRegion, requestAirportsForUser]);

  const onSelectSearchResult = useCallback(
    (item: SearchResult) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        centerOnRegion(lat, lon);
        setSearchVisible(false);
        setSearchQuery("");
        setSearchResults([]);
        Keyboard.dismiss();
        requestAirportsForUser(lat, lon);
      }
    },
    [centerOnRegion, requestAirportsForUser],
  );

  const searchResultKeyExtractor = useCallback(
    (item: SearchResult) => `${item.lat}-${item.lon}-${item.display_name}`,
    [],
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset, paddingBottom: bottomInset },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>No Fly Zone Map</Text>
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close map"
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

      {(idleCountdownSeconds != null || airportsLoading) && (
        <View
          style={styles.loadingBar}
          accessibilityLiveRegion="polite"
          accessibilityRole="progressbar"
          accessibilityLabel={
            airportsLoading
              ? "Loading airports"
              : idleCountdownSeconds != null
                ? `Stay still, ${idleCountdownSeconds} seconds to load airports`
                : undefined
          }
        >
          <ActivityIndicator size="small" color="#94a3b8" />
          <Text style={styles.loadingText}>
            {airportsLoading
              ? "Loading airports…"
              : idleCountdownSeconds != null
                ? `Stay still — ${idleCountdownSeconds}s to load airports`
                : ""}
          </Text>
        </View>
      )}

      {isNative ? (
        <View style={styles.mapWrapper}>
          <NoFlyZoneMapView
            latitude={userLatResolved}
            longitude={userLngResolved}
            viewCenterLat={mapViewCenter.lat}
            viewCenterLng={mapViewCenter.lng}
            airports={airportsForMap}
            mapRef={mapRef}
            initialRegion={initialRegion}
            onRegionChangeStart={onRegionChangeStart}
            onRegionChangeComplete={onRegionChangeComplete}
            mapType={mapType}
          />

          {mapTypeMenuVisible && (
            <Pressable
              style={styles.mapTypeMenuBackdrop}
              onPress={() => setMapTypeMenuVisible(false)}
              accessibilityLabel="Dismiss map type menu"
              accessibilityRole="button"
            />
          )}

          <Pressable
            style={styles.legend}
            onPress={() => {
              setMapTypeMenuVisible(false);
              setAirportTypesSheetVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Airport types: show or hide on map"
          >
            {MAP_AIRPORT_LEGEND_ENTRIES.map((entry) => (
              <View
                key={entry.key}
                style={[
                  styles.legendRow,
                  !airportLegendVisibility[entry.key] && styles.legendRowDimmed,
                ]}
              >
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: entry.color },
                  ]}
                />
                <Text style={styles.legendLabel}>{entry.label}</Text>
              </View>
            ))}
          </Pressable>

          <Modal
            visible={airportTypesSheetVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setAirportTypesSheetVisible(false)}
            statusBarTranslucent={Platform.OS === "android"}
          >
            <View style={styles.airportTypesOverlay}>
              <Pressable
                style={styles.airportTypesBackdrop}
                onPress={() => setAirportTypesSheetVisible(false)}
                accessibilityLabel="Dismiss airport types"
                accessibilityRole="button"
              />
              <View style={styles.airportTypesCard} accessibilityViewIsModal>
                <Text style={styles.airportTypesTitle}>Airports on map</Text>
                <Text style={styles.airportTypesSubtitle}>
                  Turn types off to hide them on the map.
                </Text>
                {MAP_AIRPORT_LEGEND_ENTRIES.map((entry) => (
                  <View key={entry.key} style={styles.airportTypesRow}>
                    <View style={styles.airportTypesRowLeft}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: entry.color },
                        ]}
                      />
                      <Text style={styles.airportTypesRowLabel}>{entry.label}</Text>
                    </View>
                    <Switch
                      value={airportLegendVisibility[entry.key]}
                      onValueChange={(on) =>
                        setAirportLegendVisibility((prev) => ({
                          ...prev,
                          [entry.key]: on,
                        }))
                      }
                      trackColor={{ false: "#334155", true: "#475569" }}
                      thumbColor={
                        airportLegendVisibility[entry.key] ? "#e2e8f0" : "#64748b"
                      }
                      ios_backgroundColor="#334155"
                      accessibilityLabel={`Show ${entry.label}`}
                    />
                  </View>
                ))}
                <Pressable
                  style={styles.airportTypesDoneButton}
                  onPress={() => setAirportTypesSheetVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <Text style={styles.airportTypesDoneText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          {mapTypeMenuVisible && (
            <View style={styles.mapTypeMenu} pointerEvents="box-none">
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
                  accessibilityRole="button"
                  accessibilityLabel={`${opt.label} map style`}
                  accessibilityState={{ selected: mapType === opt.value }}
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

          <View style={styles.mapButtons}>
            <Pressable
              onPress={() => setMapTypeMenuVisible((v) => !v)}
              style={styles.mapButton}
              accessibilityRole="button"
              accessibilityLabel="Map type"
              accessibilityState={{ expanded: mapTypeMenuVisible }}
            >
              <Ionicons
                name="layers"
                size={22}
                color={mapTypeMenuVisible ? "#cbd5e1" : "#94a3b8"}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                if (!isPro && revenueCatAvailable && showPaywall) {
                  showPaywall();
                } else {
                  setSearchVisible((v) => !v);
                }
              }}
              style={styles.mapButton}
              accessibilityRole="button"
              accessibilityLabel="Search place"
              accessibilityState={{ expanded: searchVisible }}
            >
              <Ionicons
                name="search"
                size={22}
                color={searchVisible ? "#cbd5e1" : "#94a3b8"}
              />
            </Pressable>
            <Pressable
              onPress={handleCenterLocation}
              style={styles.mapButton}
              accessibilityRole="button"
              accessibilityLabel="Center on my location"
            >
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
  background: { flex: 1, backgroundColor: "#181818" },
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
  mapTypeMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  legend: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
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
  legendRowDimmed: {
    opacity: 0.4,
  },
  airportTypesOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  airportTypesBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  airportTypesCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    zIndex: 1,
    elevation: 8,
  },
  airportTypesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 6,
  },
  airportTypesSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 16,
  },
  airportTypesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.25)",
  },
  airportTypesRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  airportTypesRowLabel: {
    fontSize: 15,
    color: "#e2e8f0",
    flex: 1,
  },
  airportTypesDoneButton: {
    marginTop: 18,
    paddingVertical: 12,
    alignItems: "center",
  },
  airportTypesDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  mapTypeMenu: {
    position: "absolute",
    bottom: 160,
    right: 12,
    zIndex: 15,
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
    zIndex: 10,
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
