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
import {
  ConditionsGrid,
  type GridItem,
  ConditionBox,
  GoNoGoCard,
  CUBE_FLEX,
  WIDE_FLEX,
  InfoModal,
  type WeatherPreviewData,
  LocationPickerModal,
  MapModal,
  SettingsModal,
} from "./src/components";
import {
  conditionCodeToLabel,
  conditionCodeToIcon,
} from "./src/utils/weatherCondition";
import { SettingsProvider, useSettings } from "./src/contexts/SettingsContext";
import { evaluateSafety, getConditionBreakdown } from "./src/utils/goNoGo";
import {
  getThresholdsForWeightClass,
  WEIGHT_CLASS_OPTIONS,
} from "./src/constants/droneThresholds";
import { useLocation } from "./src/hooks/useLocation";
import { useWeather } from "./src/hooks/useWeather";
import { useRevenueCat } from "./src/hooks/useRevenueCat";
import { getWeatherKitEnv } from "./src/utils/env";
import {
  formatWind,
  formatVisibility,
  formatVisibilityMeters,
  formatTemp,
  formatPercent,
  formatSunTime,
  degreesToCardinal,
} from "./src/utils/conversions";
export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

function AppContent() {
  const [infoMetric, setInfoMetric] = useState<string | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const {
    settings,
    setUnits,
    setWindUnit,
    setTimeFormat,
    setCompassEnabled,
    setDroneWeightClass,
  } = useSettings();
  const {
    coords,
    placeName,
    devicePlaceName,
    error: locationError,
    loading: locationLoading,
    setPickedLocation,
    clearPickedLocation,
  } = useLocation();
  const env = useMemo(() => getWeatherKitEnv(), []);
  const {
    data: weather,
    error: weatherError,
    loading: weatherLoading,
    isMock,
  } = useWeather(coords?.latitude ?? null, coords?.longitude ?? null, env);

  const {
    isPro,
    loading: revenueCatLoading,
    error: revenueCatError,
    showPaywall,
    showCustomerCenter,
    isAvailable: revenueCatAvailable,
    restore,
  } = useRevenueCat();

  const heroMinMax = useMemo(() => {
    if (!weather?.hourly?.length)
      return {
        minCelsius: null as number | null,
        maxCelsius: null as number | null,
      };
    const temps = weather.hourly
      .slice(0, 24)
      .map((h) => h.temperatureCelsius)
      .filter((t): t is number => t != null);
    if (temps.length === 0) return { minCelsius: null, maxCelsius: null };
    return { minCelsius: Math.min(...temps), maxCelsius: Math.max(...temps) };
  }, [weather]);

  const safetyStatus = useMemo(() => {
    if (!weather) return "green" as const;
    const thresholds = getThresholdsForWeightClass(settings.droneWeightClass);
    return evaluateSafety(weather.current, thresholds);
  }, [weather, settings.droneWeightClass]);

  const conditionBreakdown = useMemo(() => {
    if (!weather) return null;
    const thresholds = getThresholdsForWeightClass(settings.droneWeightClass);
    return getConditionBreakdown(weather.current, thresholds);
  }, [weather, settings.droneWeightClass]);

  const conditionStatus = useMemo(() => {
    if (!conditionBreakdown?.length) return null;
    const byId = Object.fromEntries(
      conditionBreakdown.map((item) => [item.id, item.status]),
    ) as Record<string, "green" | "yellow" | "red">;
    const worst = (
      a: "green" | "yellow" | "red",
      b: "green" | "yellow" | "red",
    ) =>
      a === "red" || b === "red"
        ? "red"
        : a === "yellow" || b === "yellow"
          ? "yellow"
          : "green";
    return {
      visibility: byId.visibility,
      wind: worst(byId.windSpeed ?? "green", byId.windGust ?? "green"),
      precipitation: byId.precipitation,
      kpIndex: byId.kpIndex,
      uvIndex: byId.uvIndex,
    } as Record<string, "green" | "yellow" | "red">;
  }, [conditionBreakdown]);

  const weatherPreview = useMemo((): WeatherPreviewData | null => {
    if (!weather) return null;
    const useImperial = settings.units === "imperial";
    return {
      title: "Weather",
      value: conditionCodeToLabel(weather.current.conditionCode),
      iconName: conditionCodeToIcon(
        weather.current.conditionCode,
      ) as React.ComponentProps<typeof Ionicons>["name"],
      currentTemp: formatTemp(weather.current.temperatureCelsius, useImperial),
      minTemp: formatTemp(heroMinMax.minCelsius, useImperial),
      maxTemp: formatTemp(heroMinMax.maxCelsius, useImperial),
    };
  }, [weather, settings.units, heroMinMax.minCelsius, heroMinMax.maxCelsius]);

  const conditionsGridItems = useMemo((): GridItem[] => {
    if (!weather) return [];
    const c = weather.current;
    const useImperial = settings.units === "imperial";
    return [
      {
        title: "Visibility",
        value:
          c.visibilityMeters != null
            ? useImperial
              ? formatVisibility(c.visibilityMeters)
              : formatVisibilityMeters(c.visibilityMeters)
            : "—",
        metricKey: "visibility",
        shape: "cube",
      },
      {
        title: "Wind",
        value: formatWind(c.wind.speedMps, settings.windUnit),
        metricKey: "wind",
        shape: "wide",
        windSpeedFormatted: formatWind(c.wind.speedMps, settings.windUnit),
        windGustFormatted:
          c.wind.gustMps != null
            ? formatWind(c.wind.gustMps, settings.windUnit)
            : "—",
        windDirectionCardinal: degreesToCardinal(c.wind.directionDegrees),
        directionDegrees: c.wind.directionDegrees ?? undefined,
      },
      {
        title: "Sunshine time",
        value:
          c.sunrise && c.sunset
            ? `${formatSunTime(c.sunrise, settings.timeFormat === "24h")} / ${formatSunTime(c.sunset, settings.timeFormat === "24h")}`
            : "—",
        metricKey: "sunriseSunset",
        shape: "wide",
        sunrise: c.sunrise ?? undefined,
        sunset: c.sunset ?? undefined,
      },
      {
        title: "Cloud cover",
        value: formatPercent(c.cloudCoverPercent),
        metricKey: "cloudCover",
        shape: "cube",
      },
      {
        title: "Precipitation",
        value: formatPercent(c.precipitationChancePercent),
        metricKey: "precipitation",
        shape: "cube",
      },
      {
        title: "Kp index",
        value: c.kpIndex != null ? String(c.kpIndex) : "—",
        metricKey: "kpIndex",
        shape: "cube",
      },
      {
        title: "UV index",
        value: c.uvIndex != null ? String(c.uvIndex) : "—",
        metricKey: "uvIndex",
        shape: "cube",
      },
      {
        title: "Humidity",
        value: formatPercent(c.humidityPercent),
        metricKey: "humidity",
        shape: "cube",
      },
      {
        title: "Map",
        value: "View map",
        metricKey: "map",
        shape: "wide",
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      },
    ];
  }, [
    weather,
    settings.units,
    settings.windUnit,
    settings.timeFormat,
    coords?.latitude,
    coords?.longitude,
  ]);

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
              <View className="flex-row items-center justify-between mb-3 py-1.5">
                <Pressable
                  onPress={() => setLocationPickerVisible(true)}
                  className="flex-row items-center gap-2 flex-1 min-w-0 rounded-lg active:opacity-80"
                >
                  <Ionicons name="location" size={16} color="#94a3b8" />
                  <Text
                    className="text-slate-400 text-sm flex-1"
                    numberOfLines={1}
                  >
                    {placeName ??
                      `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSettingsModalVisible(true)}
                  className="p-2 -m-2 rounded-lg active:opacity-70"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="settings-outline" size={22} color="#94a3b8" />
                </Pressable>
              </View>
            )}
            <LocationPickerModal
              visible={locationPickerVisible}
              onClose={() => setLocationPickerVisible(false)}
              onSelect={(loc) => {
                setPickedLocation(loc);
                setLocationPickerVisible(false);
              }}
              onUseCurrent={() => {
                clearPickedLocation();
                setLocationPickerVisible(false);
              }}
              currentPlaceName={devicePlaceName}
            />
            {weather && (
              <View
                className="flex-row gap-2 mb-4"
                style={{ width: "100%", flexWrap: "nowrap" }}
              >
                <View
                  className="min-w-0"
                  style={{ flexGrow: CUBE_FLEX, flexShrink: 1, flexBasis: 0 }}
                >
                  <GoNoGoCard
                    status={safetyStatus}
                    onPress={() => setInfoMetric("flightConditions")}
                  />
                </View>
                <View
                  className="min-w-0"
                  style={{ flexGrow: WIDE_FLEX, flexShrink: 1, flexBasis: 0 }}
                >
                  <ConditionBox
                    title="Weather"
                    value={conditionCodeToLabel(weather.current.conditionCode)}
                    metricKey="weather"
                    shape="wide"
                    onPress={(key) => setInfoMetric(key)}
                    iconName={
                      conditionCodeToIcon(
                        weather.current.conditionCode,
                      ) as React.ComponentProps<typeof Ionicons>["name"]
                    }
                    currentTemp={formatTemp(
                      weather.current.temperatureCelsius,
                      settings.units === "imperial",
                    )}
                    minTemp={formatTemp(
                      heroMinMax.minCelsius,
                      settings.units === "imperial",
                    )}
                    maxTemp={formatTemp(
                      heroMinMax.maxCelsius,
                      settings.units === "imperial",
                    )}
                    hideInfoIcon
                  />
                </View>
              </View>
            )}

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
                  onMetricPress={(key) => {
                    if (key === "map") setMapModalVisible(true);
                    else setInfoMetric(key);
                  }}
                  formatSunTime={formatSunTime}
                  use24h={settings.timeFormat === "24h"}
                  conditionStatus={conditionStatus}
                  droneWeightClassLabel={
                    WEIGHT_CLASS_OPTIONS.find(
                      (o) => o.id === settings.droneWeightClass,
                    )?.label ?? null
                  }
                />
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

          <InfoModal
            visible={infoMetric != null}
            metricKey={infoMetric}
            onClose={() => setInfoMetric(null)}
            conditionBreakdown={
              infoMetric === "flightConditions" ? conditionBreakdown : null
            }
            conditionPreview={
              infoMetric
                ? (conditionsGridItems.find(
                    (i) => i.metricKey === infoMetric,
                  ) ?? null)
                : null
            }
            weatherPreview={infoMetric === "weather" ? weatherPreview : null}
            conditionStatus={conditionStatus}
            formatSunTime={formatSunTime}
            use24h={settings.timeFormat === "24h"}
          />
          {coords && (
            <MapModal
              visible={mapModalVisible}
              onClose={() => setMapModalVisible(false)}
              latitude={coords.latitude}
              longitude={coords.longitude}
            />
          )}
          <SettingsModal
            visible={settingsModalVisible}
            onClose={() => setSettingsModalVisible(false)}
            settings={settings}
            setUnits={setUnits}
            setWindUnit={setWindUnit}
            setTimeFormat={setTimeFormat}
            setCompassEnabled={setCompassEnabled}
            setDroneWeightClass={setDroneWeightClass}
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
