import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getConditionIcon } from "../constants/conditionIcons";

export type WeatherBoxShape = "cube" | "wide";

const ICON_SIZE = 20;
const ICON_COLOR = "#94a3b8";

interface WeatherBoxProps {
  title: string;
  value: string;
  metricKey: string;
  shape: WeatherBoxShape;
  onPress: (metricKey: string) => void;
}

export function WeatherBox({
  title,
  value,
  metricKey,
  shape,
  onPress,
}: WeatherBoxProps) {
  const isCube = shape === "cube";
  const iconName = getConditionIcon(metricKey) as React.ComponentProps<
    typeof Ionicons
  >["name"];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(metricKey)}
      style={isCube ? styles.cube : undefined}
      className={`condition-box ${isCube ? "flex-1 justify-center min-h-[56px] p-2" : "flex-row items-center justify-between"}`}
    >
      {isCube ? (
        <View className="items-center justify-center">
          <View className="mb-1">
            <Ionicons name={iconName} size={26} color={ICON_COLOR} />
          </View>
          <Text className="section-label text-[10px]">{title}</Text>
          <Text
            className="text-white font-semibold mt-0.5 text-sm text-center"
            numberOfLines={2}
          >
            {value}
          </Text>
        </View>
      ) : (
        <>
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className="w-9 h-9 rounded-lg bg-surface/80 items-center justify-center">
              <Ionicons name={iconName} size={ICON_SIZE} color={ICON_COLOR} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="section-label">{title}</Text>
              <Text
                className="text-white font-semibold mt-0.5 text-base"
                numberOfLines={1}
              >
                {value}
              </Text>
            </View>
          </View>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={ICON_COLOR}
          />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cube: { aspectRatio: 1 },
});
