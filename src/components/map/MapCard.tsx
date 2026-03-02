import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import MapView from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { BOX_HEIGHT } from "../conditions/types";

const ICON_COLOR = "#94a3b8";
const ICON_SIZE = 20;
const PREVIEW_WIDTH = 80;
const PREVIEW_HEIGHT = 56;
const PREVIEW_DELTA = 0.008;

export interface MapCardProps {
  onPress: () => void;
  latitude?: number;
  longitude?: number;
}

/**
 * Wide grid card that opens the in-app map when pressed.
 * Shows a small map preview of the current location when coordinates are provided.
 */
export function MapCard({ onPress, latitude, longitude }: MapCardProps) {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    (Platform.OS === "ios" || Platform.OS === "android");

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="condition-box flex-1 min-h-0 min-w-0 rounded-xl border border-border bg-card p-3"
      style={{ minHeight: BOX_HEIGHT }}
    >
      <View className="flex-1 flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <View style={styles.previewWrapper}>
            {hasCoords ? (
              <MapView
                style={styles.previewMap}
                initialRegion={{
                  latitude,
                  longitude,
                  latitudeDelta: PREVIEW_DELTA,
                  longitudeDelta: PREVIEW_DELTA,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                pointerEvents="none"
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons
                  name="map-outline"
                  size={ICON_SIZE}
                  color={ICON_COLOR}
                />
              </View>
            )}
          </View>
          <View className="flex-1 min-w-0">
            <Text className="section-label">No Fly Zone Map</Text>
            <Text className="text-white font-semibold mt-0.5 text-base">
              View map
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={ICON_COLOR}
          style={{ flexShrink: 0 }}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  previewWrapper: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
  },
  previewMap: {
    width: "100%",
    height: "100%",
  },
  previewPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
