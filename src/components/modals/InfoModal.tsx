import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getInfo } from "../../constants/metricCopy";
import type { ConditionBreakdownItem } from "../../utils/goNoGo";
import type { SafetyStatus } from "../../types/weather";
import type { HourlyForecastItem } from "../../types/weather";
import type { WindUnit } from "../../types/settings";
import type { GridItem } from "../conditions/types";
import { ConditionBox } from "../conditions/ConditionBox";
import { WindCard } from "../conditions/WindCard";
import { SunshineCurveCard } from "../conditions/SunshineCurveCard";
import { InfoList } from "../ui/InfoList";

/** Data to show the weather condition (hero-style) in the info modal when metricKey is "weather". */
export interface WeatherPreviewData {
  title: string;
  value: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  currentTemp: string;
  minTemp: string;
  maxTemp: string;
}

interface InfoModalProps {
  visible: boolean;
  metricKey: string | null;
  onClose: () => void;
  /** When metricKey is "flightConditions", show this breakdown of green/yellow/red per condition. */
  conditionBreakdown?: ConditionBreakdownItem[] | null;
  /** Current condition data for the opened metric; used to show a larger preview at the top. */
  conditionPreview?: GridItem | null;
  /** When metricKey is "weather", show this condition + temps as the preview. */
  weatherPreview?: WeatherPreviewData | null;
  /** Per-metric Go/No-Go status; show "Current status" row in modal when this metric has one. */
  conditionStatus?: Record<string, SafetyStatus> | null;
  formatSunTime?: (iso: string, use24h: boolean) => string;
  use24h?: boolean;
  /** Hourly forecast for wind, cloud cover, precipitation, temperature. */
  hourlyForecast?: HourlyForecastItem[] | null;
  formatWind?: (mps: number, unit: WindUnit) => string;
  formatPercent?: (n: number | null) => string;
  formatTemp?: (celsius: number | null, useFahrenheit: boolean) => string;
  degreesToCardinal?: (deg: number | null) => string;
  windUnit?: WindUnit;
  useImperial?: boolean;
}

const STATUS_LABELS: Record<SafetyStatus, string> = {
  green: "Go",
  yellow: "Caution",
  red: "No-Go",
};

const STATUS_COLORS = {
  green: { bg: "bg-safe-green/20", text: "text-safe-green", icon: "checkmark-circle" as const },
  yellow: { bg: "bg-caution-yellow/20", text: "text-caution-yellow", icon: "warning" as const },
  red: { bg: "bg-danger-red/20", text: "text-danger-red", icon: "close-circle" as const },
};

function ConditionRow({ item }: { item: ConditionBreakdownItem }) {
  const style = STATUS_COLORS[item.status];
  return (
    <View className={`flex-row items-center justify-between py-2.5 px-3 rounded-lg ${style.bg} mb-2`}>
      <View className="flex-row items-center gap-2 flex-1 min-w-0">
        <Ionicons
          name={style.icon}
          size={22}
          color={item.status === "green" ? "#22c55e" : item.status === "yellow" ? "#eab308" : "#ef4444"}
        />
        <View className="flex-1 min-w-0">
          <Text className="text-white font-medium text-base">{item.label}</Text>
          <Text className="text-slate-400 text-sm mt-0.5">{item.detail}</Text>
        </View>
      </View>
      <Text className={`font-semibold text-base ${style.text}`}>{item.value}</Text>
    </View>
  );
}

/** Renders a larger version of the condition for the info modal (no onPress). */
function ConditionPreviewBlock({
  item,
  formatSunTime,
  use24h = false,
}: {
  item: GridItem;
  formatSunTime?: (iso: string, use24h: boolean) => string;
  use24h?: boolean;
}) {
  if (item.metricKey === "wind" && item.windSpeedFormatted != null) {
    return (
      <WindCard
        windSpeed={item.windSpeedFormatted}
        windGust={item.windGustFormatted ?? "—"}
        directionCardinal={item.windDirectionCardinal ?? "—"}
        directionDegrees={item.directionDegrees ?? null}
        size="large"
      />
    );
  }
  if (
    item.metricKey === "sunriseSunset" &&
    item.sunrise != null &&
    item.sunset != null &&
    formatSunTime
  ) {
    return (
      <SunshineCurveCard
        sunrise={item.sunrise}
        sunset={item.sunset}
        formatTime={formatSunTime}
        use24h={use24h}
        size="large"
      />
    );
  }
  return (
    <ConditionBox
      title={item.title}
      value={item.value}
      metricKey={item.metricKey}
      shape={item.shape}
      size="large"
    />
  );
}

/** Single condition status row (Go / Caution / No-Go) for info modals. */
function ConditionStatusRow({ status }: { status: SafetyStatus }) {
  const style = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const color = status === "green" ? "#22c55e" : status === "yellow" ? "#eab308" : "#ef4444";
  return (
    <View className={`flex-row items-center justify-between gap-2 py-2.5 px-3 rounded-lg ${style.bg} mb-4`}>
      <View className="flex-row items-center gap-2 flex-1 min-w-0">
        <Ionicons name={style.icon} size={22} color={color} />
        <Text className="text-white font-medium text-base">Current status</Text>
      </View>
      <Text className={`font-semibold text-base ${style.text}`}>{label}</Text>
    </View>
  );
}

/** Format hour offset for forecast labels. */
function formatHourLabel(index: number): string {
  return index === 0 ? "Now" : `In ${index}h`;
}

/** Metrics that support hourly forecast display. */
const FORECAST_METRICS = ["wind", "cloudCover", "precipitation", "weather"] as const;

interface ForecastBlockProps {
  hourly: HourlyForecastItem[];
  metricKey: string;
  formatWind: (mps: number, unit: WindUnit) => string;
  formatPercent: (n: number | null) => string;
  formatTemp: (celsius: number | null, useFahrenheit: boolean) => string;
  windUnit: WindUnit;
  useImperial: boolean;
}

function ForecastBlock({
  hourly,
  metricKey,
  formatWind,
  formatPercent,
  formatTemp,
  windUnit,
  useImperial,
}: ForecastBlockProps) {
  const indices = [0, 6, 12, 18, 24].filter((i) => i < hourly.length);
  if (indices.length === 0) return null;

  const isWind = metricKey === "wind";
  const items = indices.map((idx) => {
    const h = hourly[idx];
    const label = formatHourLabel(idx);
    let value: string;
    if (metricKey === "wind") {
      const speed = formatWind(h.windSpeedMps, windUnit);
      const gust =
        h.windGustMps != null ? formatWind(h.windGustMps, windUnit) : null;
      value = gust ? `${speed} / ${gust}` : speed;
    } else if (metricKey === "cloudCover") {
      value = formatPercent(h.cloudCoverPercent);
    } else if (metricKey === "precipitation") {
      value = formatPercent(h.precipitationChancePercent);
    } else if (metricKey === "weather") {
      value = formatTemp(h.temperatureCelsius, useImperial);
    } else {
      value = "—";
    }
    return { label, value };
  });

  return (
    <InfoList
      title="24h forecast"
      items={items}
      layout={isWind ? "wrap" : "row"}
    />
  );
}

/** Large weather condition box for the weather info modal (condition label + temps). */
function WeatherPreviewBlock({ data }: { data: WeatherPreviewData }) {
  return (
    <ConditionBox
      title={data.title}
      value={data.value}
      metricKey="weather"
      shape="wide"
      size="large"
      iconName={data.iconName}
      currentTemp={data.currentTemp}
      minTemp={data.minTemp}
      maxTemp={data.maxTemp}
      hideInfoIcon
    />
  );
}

export function InfoModal({
  visible,
  metricKey,
  onClose,
  conditionBreakdown,
  conditionPreview,
  weatherPreview,
  conditionStatus,
  formatSunTime,
  use24h = false,
  hourlyForecast,
  formatWind,
  formatPercent,
  formatTemp,
  degreesToCardinal,
  windUnit = "mph",
  useImperial = true,
}: InfoModalProps) {
  const info = metricKey ? getInfo(metricKey) : null;
  const showForecast =
    metricKey &&
    FORECAST_METRICS.includes(metricKey as (typeof FORECAST_METRICS)[number]) &&
    hourlyForecast &&
    hourlyForecast.length > 0 &&
    formatWind &&
    formatPercent &&
    formatTemp &&
    windUnit != null;
  const showBreakdown = metricKey === "flightConditions" && conditionBreakdown && conditionBreakdown.length > 0;
  const showConditionPreview =
    conditionPreview &&
    metricKey !== "map" &&
    metricKey !== "flightConditions";
  const showWeatherPreview = metricKey === "weather" && weatherPreview;
  const statusForMetric = metricKey && conditionStatus?.[metricKey];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-card border-t border-border rounded-t-3xl p-6 max-h-[85%]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-1 mb-2" />
          <View className="flex-row items-center justify-end -mt-2 mb-2">
            <Pressable
              onPress={onClose}
              className="p-2 -m-2 rounded-lg active:opacity-70"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </Pressable>
          </View>
          {info ? (
            <ScrollView className="pb-6" showsVerticalScrollIndicator={false}>
              {showWeatherPreview && weatherPreview && (
                <View className="mb-4">
                  <WeatherPreviewBlock data={weatherPreview} />
                </View>
              )}
              {showConditionPreview && conditionPreview && (
                <View className="mb-4">
                  <ConditionPreviewBlock
                    item={conditionPreview}
                    formatSunTime={formatSunTime}
                    use24h={use24h}
                  />
                </View>
              )}
              {statusForMetric && (
                <ConditionStatusRow status={statusForMetric} />
              )}
              <Text className="text-white text-2xl font-semibold">
                {info.title}
              </Text>
              <Text className="text-slate-300 text-base mt-3 mb-4 leading-7">
                {info.body}
              </Text>
              {showForecast && hourlyForecast && formatWind && formatPercent && formatTemp && (
                <ForecastBlock
                  hourly={hourlyForecast}
                  metricKey={metricKey}
                  formatWind={formatWind}
                  formatPercent={formatPercent}
                  formatTemp={formatTemp}
                  windUnit={windUnit}
                  useImperial={useImperial ?? true}
                />
              )}
              {showBreakdown && (
                <View className="mt-2">
                  <Text className="section-label text-base mb-2">Current conditions</Text>
                  {conditionBreakdown!.map((item) => (
                    <ConditionRow key={item.id} item={item} />
                  ))}
                </View>
              )}
            </ScrollView>
          ) : (
            <Text className="text-slate-400 text-base pb-6">
              No details for this metric.
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
