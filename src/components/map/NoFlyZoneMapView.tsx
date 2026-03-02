import React, { useMemo } from "react";
import { View, Platform, StyleSheet } from "react-native";
import ClusteredMapView from "react-native-map-clustering";
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
import { circleToPolygonCoords } from "./mapUtils";
import type { MapType } from "../../types/settings";

interface NoFlyZoneMapViewProps {
  latitude: number;
  longitude: number;
  airports: Airport[];
  mapRef: React.RefObject<React.ComponentRef<typeof MapView> | null>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete: (region: {
    latitude: number;
    longitude: number;
  }) => void;
  mapType: MapType;
}

export function NoFlyZoneMapView({
  latitude,
  longitude,
  airports,
  mapRef,
  initialRegion,
  onRegionChangeComplete,
  mapType,
}: NoFlyZoneMapViewProps) {
  const airportOverlays = useMemo(() => {
    return airports.map((airport) => {
      const radiusM = getAirportCircleRadiusM(airport.type);
      const fillColor = getAirportCircleFillColor(airport.type, 0.3);
      const strokeColor = getAirportPinColor(airport.type);
      const icon = AIRPORT_TYPE_MARKER_ICON[airport.type];
      const circleKey = `circle-${airport.icao || airport.lat}-${airport.lon}`;
      const markerKey = airport.icao || `${airport.lat}-${airport.lon}`;
      return {
        airport,
        circleKey,
        markerKey,
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
  }, [airports]);

  return (
    <View style={styles.wrapper}>
      <ClusteredMapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        mapType={mapType}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        onRegionChangeComplete={onRegionChangeComplete}
        clusterColor="#374151"
        clusterTextColor="#fff"
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="Current location"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.currentLocationMarker}>
            <Ionicons name="locate" size={24} color="#fff" />
          </View>
        </Marker>
        {airportOverlays.map(
          ({
            airport,
            circleKey,
            radiusM,
            fillColor,
            strokeColor,
            coordinates,
          }) =>
            Platform.OS === "ios" ? (
              <Circle
                key={circleKey}
                center={{ latitude: airport.lat, longitude: airport.lon }}
                radius={radiusM}
                fillColor={fillColor}
                strokeColor={strokeColor}
                strokeWidth={2}
              />
            ) : (
              <Polygon
                key={circleKey}
                coordinates={coordinates!}
                fillColor={fillColor}
                strokeColor={strokeColor}
                strokeWidth={2}
              />
            ),
        )}
        {airportOverlays.map(
          ({ airport, markerKey, strokeColor: color, icon }) => (
            <Marker
              key={markerKey}
              coordinate={{
                latitude: airport.lat,
                longitude: airport.lon,
              }}
              title={airport.name}
              description={getAirportTypeLabel(airport.type)}
              anchor={{ x: 0.5, y: 0.5 }}
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
      </ClusteredMapView>
    </View>
  );
}

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
