import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface WeatherCardProps {
  title: string;
  value: string;
  metricKey: string;
  onPress: (metricKey: string) => void;
}

export function WeatherCard({ title, value, metricKey, onPress }: WeatherCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(metricKey)}
      className="card flex-row items-center justify-between"
    >
      <View className="flex-1">
        <Text className="section-label">{title}</Text>
        <Text className="text-white text-xl font-semibold mt-1">{value}</Text>
      </View>
      <Text className="text-slate-500 text-lg">ℹ</Text>
    </TouchableOpacity>
  );
}
