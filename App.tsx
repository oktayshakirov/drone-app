import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { FlightOverviewHero } from "./src/components/FlightOverviewHero";
import { ConditionsGrid } from "./src/components/ConditionsGrid";
import type { GridItem } from "./src/components/ConditionsGrid";
import { MetricEducationModal } from "./src/components/MetricEducationModal";
import { WeightClassDropdown } from "./src/components/WeightClassDropdown";
import { MapPlaceholderCard } from "./src/components/MapPlaceholderCard";
import { useLocation } from "./src/hooks/useLocation";
import { useWeather } from "./src/hooks/useWeather";
import { useRevenueCat } from "./src/hooks/useRevenueCat";
import { getWeatherKitEnv } from "./src/utils/env";
import { getThresholdsForClass } from "./src/constants/droneClasses";
import { evaluateSafety } from "./src/utils/goNoGo";
import {
  mpsToMph,
  formatWindMph,
  formatVisibility,
  formatVisibilityMeters,
  formatTemp,
  formatPercent,
  formatSunTime,
  degreesToCardinal,
} from "./src/utils/conversions";
import type { WeightClassId } from "./src/types/weather";

export default function App() {
  const [weightClass, setWeightClass] = useState<WeightClassId>("sub250");
  const [educationMetric, setEducationMetric] = useState<string | null>(null);

  const {
    coords,
    placeName,
    error: locationError,
    loading: locationLoading,
  } = useLocation();
  const env = useMemo(() => getWeatherKitEnv(), []);
  const {
    data: weather,
    error: weatherError,
    loading: weatherLoading,
    isMock,
  } = useWeather(coords?.latitude ?? null, coords?.longitude ?? null, env);

  const thresholds = getThresholdsForClass(weightClass);
  const safetyStatus = weather
    ? evaluateSafety(weather.current, thresholds)
    : "green";

  const {
    isPro,
    loading: revenueCatLoading,
    error: revenueCatError,
    showPaywall,
    showCustomerCenter,
    isAvailable: revenueCatAvailable,
    restore,
  } = useRevenueCat();

  const conditionsGridItems = useMemo((): GridItem[] => {
    if (!weather) return [];
    const c = weather.current;
    return [
      {
        title: "Wind",
        value: `${formatWindMph(mpsToMph(c.wind.speedMps))} gust ${c.wind.gustMps != null ? formatWindMph(mpsToMph(c.wind.gustMps)) : "—"} · ${degreesToCardinal(c.wind.directionDegrees)}`,
        metricKey: "wind",
        shape: "wide",
      },
      {
        title: "Visibility",
        value:
          c.visibilityMeters != null
            ? `${formatVisibility(c.visibilityMeters)} (${formatVisibilityMeters(c.visibilityMeters)})`
            : "—",
        metricKey: "visibility",
        shape: "wide",
      },
      {
        title: "Temperature",
        value: formatTemp(c.temperatureCelsius, false),
        metricKey: "temperature",
        shape: "cube",
      },
      {
        title: "Humidity",
        value: formatPercent(c.humidityPercent),
        metricKey: "humidity",
        shape: "cube",
      },
      {
        title: "Cloud cover",
        value: formatPercent(c.cloudCoverPercent),
        metricKey: "cloudCover",
        shape: "cube",
      },
      {
        title: "Pressure",
        value: c.pressureHpa != null ? `${c.pressureHpa} hPa` : "—",
        metricKey: "pressure",
        shape: "cube",
      },
      {
        title: "Precipitation",
        value: formatPercent(c.precipitationChancePercent),
        metricKey: "precipitation",
        shape: "cube",
      },
      {
        title: "UV index",
        value: c.uvIndex != null ? String(c.uvIndex) : "—",
        metricKey: "uvIndex",
        shape: "cube",
      },
      {
        title: "Sunrise / Sunset",
        value:
          c.sunrise && c.sunset
            ? `${formatSunTime(c.sunrise)} / ${formatSunTime(c.sunset)}`
            : "—",
        metricKey: "sunriseSunset",
        shape: "wide",
      },
    ];
  }, [weather]);

  const loading = locationLoading || weatherLoading;
  const error = locationError ?? weatherError;

  if (loading && !weather) {
    return (
      <SafeAreaProvider>
        <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.gradient}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22c55e" />
            <Text className="text-slate-400 mt-4">Loading weather…</Text>
            <StatusBar style="light" />
          </View>
        </LinearGradient>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.gradient}>
        <SafeAreaView
          className="flex-1"
          style={styles.safeArea}
          edges={["top"]}
        >
          <StatusBar style="light" />
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          >
            {coords && (
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="location" size={16} color="#94a3b8" />
                <Text className="text-slate-400 text-sm" numberOfLines={1}>
                  {placeName ??
                    `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`}
                </Text>
              </View>
            )}
            {weather && (
              <View className="mb-4">
                <FlightOverviewHero
                  conditionCode={weather.current.conditionCode}
                  temperatureCelsius={weather.current.temperatureCelsius}
                  safetyStatus={safetyStatus}
                  formatTemp={formatTemp}
                />
              </View>
            )}

            <View className="mb-4">
              <WeightClassDropdown
                selectedId={weightClass}
                onSelect={setWeightClass}
              />
            </View>

            {error && (
              <View className="mt-4 p-3 rounded-lg bg-danger-red/20">
                <Text className="text-danger-red text-sm">{error}</Text>
              </View>
            )}

            {isMock && (
              <View className="mt-2 p-2 rounded-lg bg-caution-yellow/20">
                <Text className="text-caution-yellow text-xs">
                  Using sample weather. Add WeatherKit credentials for live
                  data.
                </Text>
              </View>
            )}

            {weather && (
              <View className="mt-4">
                <ConditionsGrid
                  items={conditionsGridItems}
                  onMetricPress={setEducationMetric}
                />
              </View>
            )}

            <View className="mt-4">
              <MapPlaceholderCard />
            </View>

            {revenueCatAvailable && (
              <View className="mt-6 pt-4 border-t border-border">
                {isPro ? (
                  <Text className="text-slate-400 text-xs text-center mb-2">
                    Drone Pal Pro active
                  </Text>
                ) : (
                  <Pressable
                    onPress={showPaywall}
                    className="rounded-lg border border-border bg-card py-2.5 px-4 mb-2"
                  >
                    <Text className="text-white text-sm font-semibold text-center">
                      Drone Pal Pro — Subscribe
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={async () => {
                    if (isPro) await showCustomerCenter();
                    else {
                      const { success } = await restore();
                      if (!success) await showCustomerCenter();
                    }
                  }}
                  className="py-2"
                >
                  <Text className="text-slate-500 text-xs text-center underline">
                    {isPro ? "Manage subscription" : "Restore purchases"}
                  </Text>
                </Pressable>
                {revenueCatError && (
                  <Text className="text-slate-500 text-[10px] text-center mt-1">
                    {revenueCatError.message}
                  </Text>
                )}
              </View>
            )}

            <View className="mt-8 pt-4 border-t border-border flex-row items-center justify-center gap-1.5">
              <Text className="text-slate-500 text-xs font-bold">
                Powered by
              </Text>
              <View className="px-2">
                <Ionicons name="logo-apple" size={14} color="#94a3b8" />
              </View>
              <Text className="text-slate-500 text-xs font-bold">Weather</Text>
            </View>
          </ScrollView>

          <MetricEducationModal
            visible={educationMetric != null}
            metricKey={educationMetric}
            onClose={() => setEducationMetric(null)}
          />
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const BACKGROUND_GRADIENT: readonly [string, string, ...string[]] = [
  "#000000",
  "#0a0a0a",
  "#111111",
];

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { backgroundColor: "transparent" },
});
