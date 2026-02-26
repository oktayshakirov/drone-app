import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { FlightOverviewHero } from './src/components/FlightOverviewHero';
import { ConditionsGrid } from './src/components/ConditionsGrid';
import type { GridItem } from './src/components/ConditionsGrid';
import { MetricEducationModal } from './src/components/MetricEducationModal';
import { WeightClassDropdown } from './src/components/WeightClassDropdown';
import { MapPlaceholderCard } from './src/components/MapPlaceholderCard';
import { useLocation } from './src/hooks/useLocation';
import { useWeather } from './src/hooks/useWeather';
import { getWeatherKitEnv } from './src/utils/env';
import { getThresholdsForClass } from './src/constants/droneClasses';
import { evaluateSafety } from './src/utils/goNoGo';
import {
  mpsToMph,
  formatWindMph,
  formatVisibility,
  formatVisibilityMeters,
  formatTemp,
  formatPercent,
  degreesToCardinal,
} from './src/utils/conversions';
import type { WeightClassId } from './src/types/weather';

export default function App() {
  const [weightClass, setWeightClass] = useState<WeightClassId>('sub250');
  const [educationMetric, setEducationMetric] = useState<string | null>(null);

  const { coords, error: locationError, loading: locationLoading } = useLocation();
  const env = useMemo(() => getWeatherKitEnv(), []);
  const { data: weather, error: weatherError, loading: weatherLoading, isMock } = useWeather(
    coords?.latitude ?? null,
    coords?.longitude ?? null,
    env
  );

  const thresholds = getThresholdsForClass(weightClass);
  const safetyStatus = weather ? evaluateSafety(weather.current, thresholds) : 'green';

  const conditionsGridItems = useMemo((): GridItem[] => {
    if (!weather) return [];
    const c = weather.current;
    return [
      {
        title: 'Wind',
        value: `${formatWindMph(mpsToMph(c.wind.speedMps))} gust ${c.wind.gustMps != null ? formatWindMph(mpsToMph(c.wind.gustMps)) : '—'} · ${degreesToCardinal(c.wind.directionDegrees)}`,
        metricKey: 'wind',
        shape: 'wide',
      },
      {
        title: 'Visibility',
        value: c.visibilityMeters != null ? `${formatVisibility(c.visibilityMeters)} (${formatVisibilityMeters(c.visibilityMeters)})` : '—',
        metricKey: 'visibility',
        shape: 'wide',
      },
      { title: 'Temperature', value: formatTemp(c.temperatureCelsius, false), metricKey: 'temperature', shape: 'cube' },
      { title: 'Humidity', value: formatPercent(c.humidityPercent), metricKey: 'humidity', shape: 'cube' },
      { title: 'Cloud cover', value: formatPercent(c.cloudCoverPercent), metricKey: 'cloudCover', shape: 'cube' },
      { title: 'Pressure', value: c.pressureHpa != null ? `${c.pressureHpa} hPa` : '—', metricKey: 'pressure', shape: 'cube' },
      { title: 'Precipitation', value: formatPercent(c.precipitationChancePercent), metricKey: 'precipitation', shape: 'cube' },
      { title: 'UV index', value: c.uvIndex != null ? String(c.uvIndex) : '—', metricKey: 'uvIndex', shape: 'cube' },
      {
        title: 'Sunrise / Sunset',
        value: c.sunrise && c.sunset ? 'See times below' : '—',
        metricKey: 'sunriseSunset',
        shape: 'wide',
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
      <SafeAreaView className="flex-1" style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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
            <WeightClassDropdown selectedId={weightClass} onSelect={setWeightClass} />
          </View>

          {error && (
            <View className="mt-4 p-3 rounded-lg bg-danger-red/20">
              <Text className="text-danger-red text-sm">{error}</Text>
            </View>
          )}

          {isMock && (
            <View className="mt-2 p-2 rounded-lg bg-caution-yellow/20">
              <Text className="text-caution-yellow text-xs">Using sample weather. Add WeatherKit credentials for live data.</Text>
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

          <View className="mt-8 pt-4 border-t border-border">
            <Text className="text-slate-500 text-xs">Weather data</Text>
            <TouchableOpacity onPress={() => setEducationMetric('wind')}>
              <Text className="text-slate-400 text-xs mt-1 underline">Weather</Text>
            </TouchableOpacity>
            <Text className="text-slate-600 text-xs mt-2">
              DronePal uses weather data. Flight guidance is for your drone class only. Check your local rules.
            </Text>
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

const BACKGROUND_GRADIENT: readonly [string, string, ...string[]] = ['#000000', '#0a0a0a', '#111111'];

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { backgroundColor: 'transparent' },
});
