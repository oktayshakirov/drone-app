import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  conditionCodeToLabel,
  conditionCodeToIcon,
} from "../../utils/weatherCondition";
import { BOX_HEIGHT } from "./types";

const ICON_COLOR = "#94a3b8";
const WEATHER_ICON_SIZE = 28;

/**
 * Hero cube: drone GIF only. Same visual style as condition boxes.
 */
export function HeroDroneBox() {
  return (
    <View
      className="condition-box flex-1 min-h-0 min-w-0 rounded-xl border border-border bg-card p-3 items-center justify-center"
      style={{ minHeight: BOX_HEIGHT }}
    >
      <View className="w-14 h-14 rounded-lg overflow-hidden">
        <Image
          source={require("../../../assets/drone.gif")}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

export interface HeroWeatherBoxProps {
  conditionCode: string | null;
}

/**
 * Hero wide: weather icon + "Weather" label + condition text. Same style as wide condition box.
 */
export function HeroWeatherBox({ conditionCode }: HeroWeatherBoxProps) {
  const label = conditionCodeToLabel(conditionCode);
  const iconName = conditionCodeToIcon(conditionCode) as React.ComponentProps<
    typeof Ionicons
  >["name"];

  return (
    <View
      className="condition-box flex-1 min-h-0 min-w-0 rounded-xl border border-border bg-card p-3"
      style={{ minHeight: BOX_HEIGHT }}
    >
      <View className="flex-1 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-lg bg-surface/80 items-center justify-center flex-shrink-0">
          <Ionicons
            name={iconName}
            size={WEATHER_ICON_SIZE}
            color={ICON_COLOR}
          />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="section-label">Weather</Text>
          <Text
            className="text-white font-semibold mt-0.5 text-base"
            numberOfLines={2}
          >
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}
