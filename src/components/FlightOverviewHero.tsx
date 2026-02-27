import React from "react";
import { View, Text, Image } from "react-native";
import { conditionCodeToLabel } from "../utils/weatherCondition";

interface FlightOverviewHeroProps {
  conditionCode: string | null;
  temperatureCelsius: number | null;
  formatTemp: (c: number | null, withUnit: boolean) => string;
}

/**
 * Top section: compact row — drone (square), weather + temp. Raw data only.
 */
export function FlightOverviewHero({
  conditionCode,
  temperatureCelsius,
  formatTemp,
}: FlightOverviewHeroProps) {
  const conditionLabel = conditionCodeToLabel(conditionCode);
  const tempStr = formatTemp(temperatureCelsius, true);

  return (
    <View
      className="rounded-xl border border-border bg-card p-2 flex-row gap-2 items-stretch"
      style={{ minHeight: 72 }}
    >
      {/* Drone: animated GIF */}
      <View className="w-14 h-14 flex-none self-center rounded-lg bg-surface/90 items-center justify-center overflow-hidden">
        <Image
          source={require("../../assets/drone.gif")}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      {/* Weather + temp (raw from API) */}
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
        <Text className="text-slate-400 text-[9px] uppercase tracking-wider mt-1">
          Temp
        </Text>
        <Text className="text-white text-sm font-semibold">{tempStr}</Text>
      </View>
    </View>
  );
}
