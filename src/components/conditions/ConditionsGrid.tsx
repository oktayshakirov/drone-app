import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConditionBox } from "./ConditionBox";
import { SunshineCurveCard } from "./SunshineCurveCard";
import { MapCard } from "../map";
import { WindCard } from "./WindCard";
import type { GridItem } from "./types";
import { CUBE_FLEX, WIDE_FLEX, TABLET_BREAKPOINT_WIDTH } from "./types";
import type { SafetyStatus } from "../../types/weather";

export type { GridItem } from "./types";

const CUBES_PER_ROW = 3;

function toStatusIndicator(status: SafetyStatus | undefined): "yellow" | "red" | undefined {
  return status === "yellow" ? "yellow" : status === "red" ? "red" : undefined;
}

export interface ConditionsGridProps {
  items: GridItem[];
  onMetricPress: (metricKey: string) => void;
  formatSunTime?: (iso: string, use24h: boolean) => string;
  use24h?: boolean;
  /** Status per metricKey for Go/No-Go; show small dot on top-right when set. */
  conditionStatus?: Record<string, SafetyStatus> | null;
  /** Drone weight class label (e.g. "Sub-250 g"); shown on the right of the "Conditions" title. */
  droneWeightClassLabel?: string | null;
}

/**
 * Builds rows using flexbox rules:
 * - One row fits 3 cubes (flex 1 each) OR 1 wide (flex 2) + 1 cube (flex 1).
 * - All boxes share the same height.
 */
function buildRows(items: GridItem[]): GridItem[][] {
  const rows: GridItem[][] = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];
    if (item.shape === "wide") {
      if (i + 1 < items.length && items[i + 1].shape === "cube") {
        rows.push([item, items[i + 1]]);
        i += 2;
      } else {
        rows.push([item]);
        i += 1;
      }
    } else {
      const row: GridItem[] = [];
      while (
        row.length < CUBES_PER_ROW &&
        i < items.length &&
        items[i].shape === "cube"
      ) {
        row.push(items[i]);
        i += 1;
      }
      if (i < items.length && items[i].shape === "wide" && row.length > 0) {
        row.push(items[i]);
        i += 1;
      }
      rows.push(row);
    }
  }

  return rows;
}

function isSunshineItem(
  item: GridItem,
  formatSunTime: ((iso: string, use24h: boolean) => string) | undefined,
): boolean {
  return (
    item.metricKey === "sunriseSunset" &&
    item.sunrise != null &&
    item.sunset != null &&
    formatSunTime != null
  );
}

export function ConditionsGrid({
  items,
  onMetricPress,
  formatSunTime,
  use24h = false,
  conditionStatus,
  droneWeightClassLabel,
}: ConditionsGridProps) {
  const { width } = useWindowDimensions();
  const boxSize = width >= TABLET_BREAKPOINT_WIDTH ? "large" : "default";
  const rows = React.useMemo(() => buildRows(items), [items]);

  const renderCell = (item: GridItem) => {
    const statusIndicator = toStatusIndicator(conditionStatus?.[item.metricKey]);

    if (item.metricKey === "map") {
      return (
        <MapCard
          onPress={() => onMetricPress("map")}
          latitude={item.latitude}
          longitude={item.longitude}
          size={boxSize}
        />
      );
    }
    if (item.metricKey === "wind" && item.windSpeedFormatted != null) {
      return (
        <WindCard
          windSpeed={item.windSpeedFormatted}
          windGust={item.windGustFormatted ?? "—"}
          directionCardinal={item.windDirectionCardinal ?? "—"}
          directionDegrees={item.directionDegrees ?? null}
          onPress={() => onMetricPress("wind")}
          statusIndicator={statusIndicator}
          size={boxSize}
        />
      );
    }
    if (isSunshineItem(item, formatSunTime)) {
      return (
        <SunshineCurveCard
          sunrise={item.sunrise!}
          sunset={item.sunset!}
          formatTime={formatSunTime!}
          use24h={use24h}
          onPress={() => onMetricPress("sunriseSunset")}
          size={boxSize}
        />
      );
    }
    return (
      <ConditionBox
        title={item.title}
        value={item.value}
        metricKey={item.metricKey}
        shape={item.shape}
        onPress={onMetricPress}
        statusIndicator={statusIndicator}
        size={boxSize}
      />
    );
  };

  const gapClass = boxSize === "large" ? "gap-3" : "gap-2";
  return (
    <View className={gapClass} style={{ width: "100%" }}>
      <View className="flex-row items-center justify-between mb-0.5">
        <Text className="section-label">Conditions</Text>
        {droneWeightClassLabel ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="airplane-outline" size={12} color="#64748b" />
            <Text className="text-slate-500 text-xs">{droneWeightClassLabel}</Text>
          </View>
        ) : null}
      </View>
      <View className={gapClass} style={{ width: "100%" }}>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            className={`flex-row ${gapClass}`}
            style={{ width: "100%", flexWrap: "nowrap" }}
          >
            {row.map((item, cellIndex) => {
              const isWidePlusCube =
                row.length === 2 && row[0].shape === "wide";
              const isCubePlusWide =
                row.length === 2 && row[1].shape === "wide";
              const flexGrow = isWidePlusCube
                ? cellIndex === 0
                  ? WIDE_FLEX
                  : CUBE_FLEX
                : isCubePlusWide
                  ? cellIndex === 0
                    ? CUBE_FLEX
                    : WIDE_FLEX
                  : CUBE_FLEX;

              return (
                <View
                  key={item.metricKey}
                  className="min-w-0"
                  style={{
                    flexGrow,
                    flexShrink: 1,
                    flexBasis: 0,
                  }}
                >
                  {renderCell(item)}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
