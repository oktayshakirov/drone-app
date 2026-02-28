import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker } from "react-native-maps";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BACKGROUND_GRADIENT: readonly [string, string, ...string[]] = [
  "#000000",
  "#0a0a0a",
  "#111111",
];

interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
}

const DEFAULT_LATITUDE_DELTA = 0.01;
const DEFAULT_LONGITUDE_DELTA = 0.01;

/**
 * Full-screen modal with map (Apple Maps on iOS, Google Maps on Android).
 * Uses react-native-maps — works in Expo Go and development builds.
 * Wraps content in SafeAreaProvider so insets work inside the modal.
 */
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
            latitude={latitude}
            longitude={longitude}
            onClose={onClose}
          />
        </LinearGradient>
      </SafeAreaProvider>
    </Modal>
  );
}

// Fallback when modal doesn't report insets (e.g. some iOS presentations)
const FALLBACK_TOP_INSET = Platform.select({ ios: 47, android: 24, default: 0 });

function MapModalContent({
  latitude,
  longitude,
  onClose,
}: MapModalProps & { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const topInset = insets.top > 0 ? insets.top : FALLBACK_TOP_INSET;
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset, paddingBottom: bottomInset },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={24} color="#94a3b8" />
        </Pressable>
      </View>
      {isNative ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: DEFAULT_LATITUDE_DELTA,
            longitudeDelta: DEFAULT_LONGITUDE_DELTA,
          }}
          showsUserLocation={false}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title="Weather location"
          />
        </MapView>
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
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
  map: {
    flex: 1,
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
