import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SafetyGauge } from './src/components/SafetyGauge';
import { WeatherCard } from './src/components/WeatherCard';
import { MetricEducationModal } from './src/components/MetricEducationModal';
import { WeightClassSelector } from './src/components/WeightClassSelector';
import { DroneHeroPlaceholder } from './src/components/DroneHeroPlaceholder';
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

  const loading = locationLoading || weatherLoading;
  const error = locationError ?? weatherError;

  if (loading && !weather) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-surface items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="text-slate-400 mt-4">Loading weather…</Text>
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <StatusBar style="light" />
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Text className="text-white text-2xl font-bold">DronePal</Text>
          <Text className="text-slate-400 text-sm mt-0.5">Weather for safe flying</Text>

          <View className="mt-4">
            <DroneHeroPlaceholder />
          </View>

          <View className="mt-4">
            <WeightClassSelector selectedId={weightClass} onSelect={setWeightClass} />
          </View>

          <View className="mt-4">
            <SafetyGauge status={safetyStatus} />
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
            <View className="mt-6 gap-3">
              <Text className="section-label">Conditions</Text>
              <WeatherCard
                title="Wind"
                value={`${formatWindMph(mpsToMph(weather.current.wind.speedMps))} gust ${weather.current.wind.gustMps != null ? formatWindMph(mpsToMph(weather.current.wind.gustMps)) : '—'} · ${degreesToCardinal(weather.current.wind.directionDegrees)}`}
                metricKey="wind"
                onPress={setEducationMetric}
              />
              <WeatherCard
                title="Visibility"
                value={weather.current.visibilityMeters != null ? `${formatVisibility(weather.current.visibilityMeters)} (${formatVisibilityMeters(weather.current.visibilityMeters)})` : '—'}
                metricKey="visibility"
                onPress={setEducationMetric}
              />
              <WeatherCard
                title="Cloud cover"
                value={formatPercent(weather.current.cloudCoverPercent)}
                metricKey="cloudCover"
                onPress={setEducationMetric}
              />
              <WeatherCard
                title="Temperature"
                value={formatTemp(weather.current.temperatureCelsius, false)}
                metricKey="temperature"
                onPress={setEducationMetric}
              />
              <WeatherCard
                title="Humidity"
                value={formatPercent(weather.current.humidityPercent)}
                metricKey="humidity"
                onPress={setEducationMetric}
              />
              <WeatherCard
                title="Pressure"
                value={weather.current.pressureHpa != null ? `${weather.current.pressureHpa} hPa` : '—'}
                metricKey="pressure"
                onPress={setEducationMetric}
              />
              <WeatherCard
                title="Precipitation chance"
                value={formatPercent(weather.current.precipitationChancePercent)}
                metricKey="precipitation"
                onPress={setEducationMetric}
              />
              <WeatherCard
                title="Sunrise / Sunset"
                value={weather.current.sunrise && weather.current.sunset ? 'See times below' : '—'}
                metricKey="sunriseSunset"
                onPress={setEducationMetric}
              />
              <WeatherCard
                title="UV index"
                value={weather.current.uvIndex != null ? String(weather.current.uvIndex) : '—'}
                metricKey="uvIndex"
                onPress={setEducationMetric}
              />
            </View>
          )}

          <View className="mt-6">
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
    </SafeAreaProvider>
  );
}
