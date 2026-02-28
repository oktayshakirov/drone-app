import React from "react";
import { View, Text, Image } from "react-native";
import { conditionCodeToLabel } from "../utils/weatherCondition";

interface OverviewHeroProps {
  conditionCode: string | null;
}

/**
 * Top section: compact row — drone (square), weather condition.
 */
export function OverviewHero({ conditionCode }: OverviewHeroProps) {
  const conditionLabel = conditionCodeToLabel(conditionCode);

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

      {/* Weather condition */}
      <View className="min-w-0 flex-1 rounded-lg bg-card/50 px-2.5 justify-center self-stretch">
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
  );
}
