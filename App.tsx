import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { useNetInfo } from "@react-native-community/netinfo";
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
  SubscriptionManagementModal,
  CameraTutorialListModal,
  DocumentsModal,
} from "./src/components";
import { ConsentDialog } from "./src/components/ads";
import {
  conditionCodeToLabel,
  conditionCodeToIcon,
} from "./src/utils/weatherCondition";
import { SettingsProvider, useSettings } from "./src/contexts/SettingsContext";
import {
  OnboardingProvider,
  useOnboarding,
} from "./src/contexts/OnboardingContext";
import { OnboardingScreen } from "./src/components/onboarding";
import { evaluateSafety, getConditionBreakdown } from "./src/utils/goNoGo";
import {
  getThresholdsForWeightClass,
  WEIGHT_CLASS_OPTIONS,
} from "./src/constants/droneThresholds";
import { ENTITLEMENT_PRO } from "./src/constants/revenueCat";
import { useLocation } from "./src/hooks/useLocation";
import { useWeather } from "./src/hooks/useWeather";
import { useRevenueCat } from "./src/hooks/useRevenueCat";
import { getWeatherKitEnv } from "./src/utils/env";
import type { CameraTutorial } from "./src/constants/cameraTutorials";
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
      <AppWithOnboardingAndPaywall />
    </SettingsProvider>
  );
}

function AppWithOnboardingAndPaywall() {
  const { showPaywall } = useRevenueCat();
  return (
    <OnboardingProvider onComplete={() => showPaywall()}>
      <AppWithOnboarding />
    </OnboardingProvider>
  );
}

function AppWithOnboarding() {
  const { isOnboardingActive, isLoading } = useOnboarding();
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#f3e8db" />
      </View>
    );
  }
  if (isOnboardingActive) {
    return <OnboardingScreen />;
  }
  return <AppContent />;
}

const LAST_FREE_REFRESH_KEY = "dronepal_lastFreeRefresh";
const FREE_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const DEV_FORCE_PRO_KEY = "dronepal_devForcePro";

function AppContent() {
  const [infoMetric, setInfoMetric] = useState<string | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [AdBannerComponent, setAdBannerComponent] =
    useState<React.ComponentType<{ isPro: boolean }> | null>(null);
  const [consentCompleted, setConsentCompleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionManagementVisible, setSubscriptionManagementVisible] =
    useState(false);
  const [cameraTutorialListVisible, setCameraTutorialListVisible] =
    useState(false);
  const [cameraTutorialDetail, setCameraTutorialDetail] =
    useState<CameraTutorial | null>(null);
  const [devForcePro, setDevForcePro] = useState(false);

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
    loading: locationLoading,
    setPickedLocation,
    clearPickedLocation,
  } = useLocation();
  const env = useMemo(() => getWeatherKitEnv(), []);
  const {
    data: weather,
    loading: weatherLoading,
    refetch: refetchWeather,
  } = useWeather(coords?.latitude ?? null, coords?.longitude ?? null, env);

  const {
    isPro: billingIsPro,
    customerInfo,
    loading: revenueCatLoading,
    error: revenueCatError,
    showPaywall,
    showCustomerCenter,
    isAvailable: revenueCatAvailable,
    entitlementResolved,
    restore,
  } = useRevenueCat();
  const netInfo = useNetInfo();
  const isOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;
  const isDevelopment = __DEV__;
  const isPro = billingIsPro || (isDevelopment && devForcePro);

  useEffect(() => {
    if (!isDevelopment) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DEV_FORCE_PRO_KEY);
        if (!cancelled && raw != null) {
          setDevForcePro(raw === "1");
        }
      } catch {
        // Ignore local override load issues.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDevelopment]);

  const setDevForceProEnabled = useCallback(
    (enabled: boolean) => {
      setDevForcePro(enabled);
      AsyncStorage.setItem(DEV_FORCE_PRO_KEY, enabled ? "1" : "0").catch(
        () => undefined,
      );
    },
    [setDevForcePro],
  );

  const proPlanLabel = useMemo(() => {
    if (!customerInfo?.entitlements?.active) return "Pro";
    const ent = customerInfo.entitlements.active[ENTITLEMENT_PRO] as
      | { productIdentifier?: string }
      | undefined;
    const id = ent?.productIdentifier;
    if (id === "lifetime") return "Lifetime";
    if (id === "monthly") return "Monthly";
    return "Pro";
  }, [customerInfo]);

  useEffect(() => {
    if (Constants.appOwnership === "expo") return;
    (async () => {
      try {
        const { default: mobileAds } =
          await import("react-native-google-mobile-ads");
        await mobileAds().initialize();
        const { AdBanner } = await import("./src/components/ads/BannerAd");
        setAdBannerComponent(() => AdBanner);
      } catch {
        // Native module not available or init failed (e.g. dev build not used).
      }
    })();
  }, []);

  // Free users: auto-refresh conditions once every 12h when app is opened.
  useEffect(() => {
    if (isPro || !revenueCatAvailable || !coords) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LAST_FREE_REFRESH_KEY);
        const last = raw ? parseInt(raw, 10) : 0;
        if (Date.now() - last >= FREE_REFRESH_INTERVAL_MS) {
          refetchWeather();
          if (!cancelled) {
            await AsyncStorage.setItem(
              LAST_FREE_REFRESH_KEY,
              String(Date.now()),
            );
          }
        }
      } catch {
        // Ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isPro,
    revenueCatAvailable,
    coords?.latitude,
    coords?.longitude,
    refetchWeather,
  ]);

  const handlePullToRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (!isPro && revenueCatAvailable) {
        await showPaywall();
      } else {
        await refetchWeather();
      }
    } finally {
      setRefreshing(false);
    }
  }, [isPro, revenueCatAvailable, showPaywall, refetchWeather]);

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
    return getConditionBreakdown(weather.current, thresholds, {
      useImperial: settings.units === "imperial",
      windUnit: settings.windUnit,
    });
  }, [weather, settings.droneWeightClass, settings.units, settings.windUnit]);

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
    const c = weather?.current;
    const useImperial = settings.units === "imperial";
    return [
      {
        title: "Visibility",
        value:
          c?.visibilityMeters != null
            ? useImperial
              ? formatVisibility(c.visibilityMeters)
              : formatVisibilityMeters(c.visibilityMeters)
            : "",
        metricKey: "visibility",
        shape: "cube",
      },
      {
        title: "Wind",
        value: c ? formatWind(c.wind.speedMps, settings.windUnit) : "",
        metricKey: "wind",
        shape: "wide",
        windSpeedFormatted: c
          ? formatWind(c.wind.speedMps, settings.windUnit)
          : "",
        windGustFormatted:
          c?.wind.gustMps != null
            ? formatWind(c.wind.gustMps, settings.windUnit)
            : "",
        windDirectionCardinal:
          c?.wind.directionDegrees != null
            ? degreesToCardinal(c.wind.directionDegrees)
            : "",
        directionDegrees: c?.wind.directionDegrees ?? undefined,
      },
      {
        title: "Sunshine time",
        value:
          c?.sunrise && c?.sunset
            ? `${formatSunTime(c.sunrise, settings.timeFormat === "24h")} / ${formatSunTime(c.sunset, settings.timeFormat === "24h")}`
            : "",
        metricKey: "sunriseSunset",
        shape: "wide",
        sunrise: c?.sunrise ?? undefined,
        sunset: c?.sunset ?? undefined,
      },
      {
        title: "Cloud cover",
        value: c ? formatPercent(c.cloudCoverPercent) : "",
        metricKey: "cloudCover",
        shape: "cube",
      },
      {
        title: "Precipitation",
        value: c ? formatPercent(c.precipitationChancePercent) : "",
        metricKey: "precipitation",
        shape: "cube",
      },
      {
        title: "Kp index",
        value: c?.kpIndex != null ? String(c.kpIndex) : "",
        metricKey: "kpIndex",
        shape: "cube",
      },
      {
        title: "UV index",
        value: c?.uvIndex != null ? String(c.uvIndex) : "",
        metricKey: "uvIndex",
        shape: "cube",
      },
      {
        title: "Humidity",
        value: c ? formatPercent(c.humidityPercent) : "",
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
      {
        title: "Camera tutorials",
        value: "Start learning",
        metricKey: "cameraTutorials",
        shape: "wide",
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
  const isInitialLoading = loading && !weather;
  const showHeaderRow = Boolean(coords) || isInitialLoading;
  const showConditionsLayout = Boolean(weather) || isInitialLoading;

  const showOfflineBanner = isOffline && Boolean(weather);
  const showOfflineLoadingBanner = isOffline && !weather;

  return (
    <SafeAreaProvider>
      <View style={styles.background}>
        <SafeAreaView
          className="flex-1"
          style={styles.safeArea}
          edges={["top"]}
        >
          <StatusBar style="light" />
          <View style={styles.mainContent}>
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handlePullToRefresh}
                  tintColor="#94a3b8"
                />
              }
            >
              {showOfflineBanner && (
                <View className="mb-3 p-3 rounded-lg bg-slate-700/40 border border-slate-600/60">
                  <Text className="text-slate-200 text-xs">
                    You are offline. Showing last loaded data.
                  </Text>
                </View>
              )}
              {showOfflineLoadingBanner && (
                <View className="mb-3 p-3 rounded-lg bg-slate-700/40 border border-slate-600/60">
                  <Text className="text-slate-200 text-xs">
                    You are offline. Waiting for connection to load live data.
                  </Text>
                </View>
              )}
              {showHeaderRow && (
                <View className="flex-row items-center justify-between mb-3 py-1.5">
                  <Pressable
                    onPress={() => {
                      if (isInitialLoading) return;
                      if (!isPro && revenueCatAvailable) {
                        showPaywall();
                      } else if (isPro || !revenueCatAvailable) {
                        setLocationPickerVisible(true);
                      }
                    }}
                    className="flex-row items-center gap-2 flex-1 min-w-0 rounded-lg active:opacity-80"
                  >
                    <Ionicons name="location" size={16} color="#94a3b8" />
                    <Text
                      className="text-slate-400 text-sm flex-1"
                      numberOfLines={1}
                    >
                      {coords ? (placeName ?? `Finding your area...`) : ""}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDocumentsModalVisible(true)}
                    className="p-2 -m-2 mr-2 rounded-lg active:opacity-70"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color="#94a3b8"
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => setSettingsModalVisible(true)}
                    className="p-2 -m-2 rounded-lg active:opacity-70"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={22}
                      color="#94a3b8"
                    />
                  </Pressable>
                  {revenueCatAvailable &&
                    entitlementResolved &&
                    !revenueCatLoading &&
                    !isPro && (
                      <Pressable
                        onPress={showPaywall}
                        className="ml-2 p-1 -m-1 rounded-lg active:opacity-70"
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Image
                          source={require("./assets/pro.png")}
                          style={{ width: 27, height: 27 }}
                          resizeMode="contain"
                        />
                      </Pressable>
                    )}
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
              {showConditionsLayout && (
                <View
                  className="flex-row gap-2 mb-4"
                  style={{ width: "100%", flexWrap: "nowrap" }}
                >
                  <View
                    className="min-w-0"
                    style={{ flexGrow: CUBE_FLEX, flexShrink: 1, flexBasis: 0 }}
                  >
                    <GoNoGoCard
                      status={weather ? safetyStatus : "green"}
                      isLoading={isInitialLoading}
                      onPress={() => {
                        if (isInitialLoading) return;
                        if (!isPro && revenueCatAvailable) {
                          showPaywall();
                        } else {
                          setInfoMetric("flightConditions");
                        }
                      }}
                    />
                  </View>
                  <View
                    className="min-w-0"
                    style={{ flexGrow: WIDE_FLEX, flexShrink: 1, flexBasis: 0 }}
                  >
                    <ConditionBox
                      title="Weather"
                      value={
                        weather
                          ? conditionCodeToLabel(weather.current.conditionCode)
                          : ""
                      }
                      metricKey="weather"
                      shape="wide"
                      onPress={(key) => {
                        if (isInitialLoading) return;
                        if (!isPro && revenueCatAvailable) {
                          showPaywall();
                        } else {
                          setInfoMetric(key);
                        }
                      }}
                      iconName={
                        weather
                          ? (conditionCodeToIcon(
                              weather.current.conditionCode,
                            ) as React.ComponentProps<typeof Ionicons>["name"])
                          : "partly-sunny-outline"
                      }
                      currentTemp={
                        weather
                          ? formatTemp(
                              weather.current.temperatureCelsius,
                              settings.units === "imperial",
                            )
                          : ""
                      }
                      minTemp={
                        weather
                          ? formatTemp(
                              heroMinMax.minCelsius,
                              settings.units === "imperial",
                            )
                          : ""
                      }
                      maxTemp={
                        weather
                          ? formatTemp(
                              heroMinMax.maxCelsius,
                              settings.units === "imperial",
                            )
                          : ""
                      }
                      hideInfoIcon
                      isLoading={isInitialLoading}
                    />
                  </View>
                </View>
              )}
              {showConditionsLayout && (
                <View className="mt-4">
                  <ConditionsGrid
                    items={conditionsGridItems}
                    onMetricPress={(key) => {
                      if (isInitialLoading) return;
                      if (key === "map") {
                        setMapModalVisible(true);
                        return;
                      }
                      if (key === "cameraTutorials") {
                        setCameraTutorialListVisible(true);
                        return;
                      }
                      if (!isPro && revenueCatAvailable) {
                        showPaywall();
                        return;
                      }
                      setInfoMetric(key);
                    }}
                    formatSunTime={formatSunTime}
                    use24h={settings.timeFormat === "24h"}
                    conditionStatus={isInitialLoading ? null : conditionStatus}
                    isLoading={isInitialLoading}
                    droneWeightClassLabel={
                      WEIGHT_CLASS_OPTIONS.find(
                        (o) => o.id === settings.droneWeightClass,
                      )?.label ?? null
                    }
                  />
                </View>
              )}
              {isPro && revenueCatAvailable && (
                <Pressable
                  onPress={() => setSubscriptionManagementVisible(true)}
                  className="mt-6 py-3 flex-row items-center justify-center gap-2 rounded-lg active:opacity-80"
                >
                  <Ionicons name="card-outline" size={16} color="#94a3b8" />
                  <Text className="text-slate-400 text-sm">
                    Manage subscription: {proPlanLabel}
                  </Text>
                </Pressable>
              )}
              <View className="mt-8 pt-4 border-t border-border flex-row items-center justify-center gap-1.5">
                <Text className="text-slate-500 text-xs font-bold">
                  Powered by
                </Text>
                <View className="px-2">
                  <Ionicons name="logo-apple" size={14} color="#94a3b8" />
                </View>
                <Text className="text-slate-500 text-xs font-bold">
                  Weather
                </Text>
              </View>
            </ScrollView>
            {AdBannerComponent && (
              <AdBannerComponent
                key={consentCompleted ? "with-consent" : "pending"}
                isPro={isPro}
              />
            )}
          </View>
          <CameraTutorialListModal
            visible={cameraTutorialListVisible}
            isPro={isPro}
            selectedTutorial={cameraTutorialDetail}
            onCloseDetail={() => setCameraTutorialDetail(null)}
            onClose={() => {
              setCameraTutorialDetail(null);
              setCameraTutorialListVisible(false);
            }}
            onSelectTutorial={(tutorial) => {
              if (tutorial.access === "pro" && !isPro && revenueCatAvailable) {
                showPaywall();
                return;
              }
              setCameraTutorialDetail(tutorial);
            }}
          />
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
            hourlyForecast={weather?.hourly ?? null}
            formatWind={formatWind}
            formatPercent={formatPercent}
            formatTemp={formatTemp}
            degreesToCardinal={degreesToCardinal}
            windUnit={settings.windUnit}
            useImperial={settings.units === "imperial"}
          />
          {coords && (
            <MapModal
              visible={mapModalVisible}
              onClose={() => setMapModalVisible(false)}
              latitude={coords.latitude}
              longitude={coords.longitude}
              isPro={isPro}
              showPaywall={showPaywall}
              revenueCatAvailable={revenueCatAvailable}
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
            showDevProToggle={isDevelopment}
            devProEnabled={devForcePro}
            setDevProEnabled={setDevForceProEnabled}
          />
          <DocumentsModal
            visible={documentsModalVisible}
            onClose={() => setDocumentsModalVisible(false)}
          />
          <SubscriptionManagementModal
            visible={subscriptionManagementVisible}
            onClose={() => setSubscriptionManagementVisible(false)}
            customerInfo={customerInfo}
            onOpenCustomerCenter={showCustomerCenter}
          />
          <ConsentDialog onConsentCompleted={() => setConsentCompleted(true)} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#181818" },
  safeArea: { backgroundColor: "#181818" },
  mainContent: { flex: 1 },
});
