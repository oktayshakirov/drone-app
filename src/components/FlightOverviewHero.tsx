import React from "react";
import { View, Text, Image } from "react-native";
import type { SafetyStatus } from "../types/weather";
import { conditionCodeToLabel } from "../utils/weatherCondition";

interface FlightOverviewHeroProps {
  conditionCode: string | null;
  temperatureCelsius: number | null;
  safetyStatus: SafetyStatus;
  formatTemp: (c: number | null, withUnit: boolean) => string;
}

const statusConfig: Record<
  SafetyStatus,
  { label: string; bg: string; text: string }
> = {
  green: { label: "Go", bg: "bg-safe-green", text: "text-surface" },
  yellow: { label: "Caution", bg: "bg-caution-yellow", text: "text-surface" },
  red: { label: "No-Go", bg: "bg-danger-red", text: "text-white" },
};

/**
 * Top section: compact row — drone (square), weather+temp, flight status.
 */
export function FlightOverviewHero({
  conditionCode,
  temperatureCelsius,
  safetyStatus,
  formatTemp,
}: FlightOverviewHeroProps) {
  const status = statusConfig[safetyStatus];
  const conditionLabel = conditionCodeToLabel(conditionCode);
  const tempStr = formatTemp(temperatureCelsius, true);

  return (
    <View className="rounded-xl border border-border bg-card p-2 flex-row gap-2 items-stretch" style={{ minHeight: 72 }}>
      {/* Drone: animated GIF */}
      <View className="w-14 h-14 flex-none self-center rounded-lg bg-surface/90 items-center justify-center overflow-hidden">
        <Image
          source={require("../../assets/drone.gif")}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      {/* Weather + temp */}
      <View className="min-w-0 flex-1 rounded-lg bg-card/50 border border-border/80 px-2.5 justify-center self-stretch">
        <Text className="text-slate-400 text-[9px] uppercase tracking-wider">Weather</Text>
        <Text className="text-white text-sm font-semibold mt-0.5" numberOfLines={2}>
          {conditionLabel}
        </Text>
        <Text className="text-slate-400 text-[9px] uppercase tracking-wider mt-1">Temp</Text>
        <Text className="text-white text-sm font-semibold">{tempStr}</Text>
      </View>

      {/* Flight: compact */}
      <View className={`min-w-0 flex-1 rounded-lg justify-center px-2.5 py-1.5 self-stretch ${status.bg} ${status.text}`} style={{ minWidth: 72 }}>
        <Text className="text-center text-[9px] font-semibold uppercase tracking-wider opacity-90">
          Flight
        </Text>
        <Text className="text-center text-base font-bold mt-0.5">{status.label}</Text>
        <Text className="text-center text-[9px] opacity-85 mt-0.5" numberOfLines={1}>
          {safetyStatus === "green" && "OK to fly."}
          {safetyStatus === "yellow" && "Caution."}
          {safetyStatus === "red" && "Do not fly."}
        </Text>
      </View>
    </View>
  );
}
