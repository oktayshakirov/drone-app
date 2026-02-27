import React from "react";
import { View, Text } from "react-native";

export function MapPlaceholderCard() {
  return (
    <View className="card">
      <Text className="section-label">Map</Text>
      <Text className="text-white font-semibold mt-1">
        Flight areas & airspace
      </Text>
      <Text className="text-slate-500 text-sm mt-2">
        Map view and airspace info will be available in a future update.
      </Text>
    </View>
  );
}
