import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  conditionCodeToLabel,
  conditionCodeToIcon,
} from "../utils/weatherCondition";

const WEATHER_ICON_SIZE = 36;
const WEATHER_ICON_COLOR = "#94a3b8";

interface OverviewHeroProps {
  conditionCode: string | null;
}

/**
 * Top section: compact row — drone (square), weather icon + condition text.
 */
export function OverviewHero({ conditionCode }: OverviewHeroProps) {
  const conditionLabel = conditionCodeToLabel(conditionCode);
  const iconName = conditionCodeToIcon(conditionCode) as React.ComponentProps<
    typeof Ionicons
  >["name"];

  return (
    <View
      className="rounded-xl border border-border bg-card p-2 flex-row gap-2 items-stretch"
      style={{ minHeight: 72 }}
    >
      {/* Drone: animated GIF */}
      <View className="w-14 h-14 flex-none self-center rounded-lg items-center justify-center overflow-hidden">
        <Image
          source={require("../../assets/drone.gif")}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      {/* Weather: icon + condition text */}
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5 rounded-lg bg-card/50 px-2.5 self-stretch">
        <View className="flex-none items-center justify-center">
          <Ionicons
            name={iconName}
            size={WEATHER_ICON_SIZE}
            color={WEATHER_ICON_COLOR}
          />
        </View>
        <View className="min-w-0 flex-1 justify-center py-1">
          <Text className="text-slate-400 text-[9px] uppercase tracking-wider">
            Weather
          </Text>
          <Text
            className="text-white text-sm font-semibold mt-0.5"
            numberOfLines={2}
          >
            {conditionLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}
