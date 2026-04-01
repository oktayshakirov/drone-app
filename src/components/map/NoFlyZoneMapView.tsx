import React, { useMemo, memo, useState, useEffect } from "react";
import {
  View,
  Platform,
  StyleSheet,
  type NativeSyntheticEvent,
} from "react-native";
import MapView, {
  Marker,
  Polygon,
  Circle,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Airport } from "../../api/airports";
import {
  getAirportPinColor,
  getAirportCircleRadiusM,
  getAirportCircleFillColor,
  getAirportTypeLabel,
  AIRPORT_TYPE_MARKER_ICON,
} from "../../constants/airportColors";
import {
  airportKey,
  circleToPolygonCoords,
  dedupeOverlappingAirportsKeepLargest,
  distanceKm,
  isValidMapCoordinate,
  MAX_MAP_RENDERED_AIRPORTS,
} from "./mapUtils";
import type { MapType } from "../../types/settings";

interface NoFlyZoneMapViewProps {
  latitude: number;
  longitude: number;
  /** Viewport center for ordering which airports to draw when capped (not the user pin). */
  viewCenterLat: number;
  viewCenterLng: number;
  airports: Airport[];
  mapRef: React.RefObject<React.ComponentRef<typeof MapView> | null>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  /** Once per camera move (before region updates) — use to cancel idle pipelines without high-frequency churn. */
  onRegionChangeStart?: (
    event: NativeSyntheticEvent<{ isGesture?: boolean }>,
  ) => void;
  onRegionChangeComplete: (region: {
    latitude: number;
    longitude: number;
  }) => void;
  mapType: MapType;
}

function NoFlyZoneMapViewInner({
  latitude,
  longitude,
  viewCenterLat,
  viewCenterLng,
  airports,
  mapRef,
  initialRegion,
  onRegionChangeStart,
  onRegionChangeComplete,
  mapType,
}: NoFlyZoneMapViewProps) {
  /**
   * ClusteredMapView + Circle/Polygon children caused AIRMap insertReactSubview crashes
   * (invalid index) when panning — the clusterer expects Marker-only children.
   * Plain MapView + a render cap keeps the native tree stable and performant.
   */
  const airportsToDraw = useMemo(() => {
    const valid = airports.filter((a) => isValidMapCoordinate(a.lat, a.lon));
    const deduped = dedupeOverlappingAirportsKeepLargest(valid);
    if (deduped.length <= MAX_MAP_RENDERED_AIRPORTS) return deduped;
    const sortLat = isValidMapCoordinate(viewCenterLat, viewCenterLng)
      ? viewCenterLat
      : latitude;
    const sortLng = isValidMapCoordinate(viewCenterLat, viewCenterLng)
      ? viewCenterLng
      : longitude;
    return [...deduped]
      .sort(
        (a, b) =>
          distanceKm(a.lat, a.lon, sortLat, sortLng) -
          distanceKm(b.lat, b.lon, sortLat, sortLng),
      )
      .slice(0, MAX_MAP_RENDERED_AIRPORTS);
  }, [airports, viewCenterLat, viewCenterLng, latitude, longitude]);

  const airportOverlays = useMemo(() => {
    return airportsToDraw.map((airport) => {
      const radiusM = getAirportCircleRadiusM(airport.type);
      const fillColor = getAirportCircleFillColor(airport.type, 0.3);
      const strokeColor = getAirportPinColor(airport.type);
      const icon = AIRPORT_TYPE_MARKER_ICON[airport.type];
      const stableKey = airportKey(airport);
      return {
        airport,
        stableKey,
        radiusM,
        fillColor,
        strokeColor,
        icon,
        coordinates:
          Platform.OS !== "ios"
            ? circleToPolygonCoords(airport.lat, airport.lon, radiusM)
            : null,
      };
    });
  }, [airportsToDraw]);

  /**
   * When airport data updates, native Google/Apple map layers often skip repainting custom
   * markers/overlays until the user moves the map. Bump an epoch when the *drawn* set changes
   * so Circle/Polygon/Marker keys change and the native views remount with fresh geometry.
   */
  const drawnSetFingerprint = useMemo(
    () => airportsToDraw.map((a) => airportKey(a)).join("|"),
    [airportsToDraw],
  );
  const [overlayEpoch, setOverlayEpoch] = useState(0);
  useEffect(() => {
    setOverlayEpoch((e) => e + 1);
  }, [drawnSetFingerprint]);

  /** Briefly allow marker view bitmap updates after new data (pairs with epoch remount). */
  const [airportMarkerTracksView, setAirportMarkerTracksView] = useState(true);
  useEffect(() => {
    setAirportMarkerTracksView(true);
    const t = setTimeout(() => setAirportMarkerTracksView(false), 750);
    return () => clearTimeout(t);
  }, [drawnSetFingerprint]);

  return (
    <View style={styles.wrapper}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        mapType={mapType}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChangeStart={onRegionChangeStart}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="Current location"
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.currentLocationMarker}>
            <Ionicons name="locate" size={24} color="#fff" />
          </View>
        </Marker>
        {airportOverlays.map(
          ({
            airport,
            stableKey,
            radiusM,
            fillColor,
            strokeColor,
            coordinates,
          }) =>
            Platform.OS === "ios" ? (
              <Circle
                key={`c-${stableKey}-${overlayEpoch}`}
                center={{ latitude: airport.lat, longitude: airport.lon }}
                radius={radiusM}
                fillColor={fillColor}
                strokeColor={strokeColor}
                strokeWidth={2}
              />
            ) : (
              <Polygon
                key={`c-${stableKey}-${overlayEpoch}`}
                coordinates={coordinates!}
                fillColor={fillColor}
                strokeColor={strokeColor}
                strokeWidth={2}
              />
            ),
        )}
        {airportOverlays.map(
          ({ airport, stableKey, strokeColor: color, icon }) => (
            <Marker
              key={`m-${stableKey}-${overlayEpoch}`}
              coordinate={{
                latitude: airport.lat,
                longitude: airport.lon,
              }}
              title={airport.name}
              description={getAirportTypeLabel(airport.type)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={airportMarkerTracksView}
            >
              <View
                style={[styles.airportMarker, { backgroundColor: color }]}
              >
                {icon.family === "ionicons" ? (
                  <Ionicons
                    name={icon.name as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color="#fff"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={
                      icon.name as keyof typeof MaterialCommunityIcons.glyphMap
                    }
                    size={18}
                    color="#fff"
                  />
                )}
              </View>
            </Marker>
          ),
        )}
      </MapView>
    </View>
  );
}

export const NoFlyZoneMapView = memo(NoFlyZoneMapViewInner);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  airportMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
