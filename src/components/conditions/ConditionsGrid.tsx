import React from "react";
import { View, Text } from "react-native";
import { ConditionBox } from "./ConditionBox";
import { SunshineCurveCard } from "./SunshineCurveCard";
import { MapCard } from "../map";
import { WindCard } from "./WindCard";
import type { GridItem } from "./types";
import { CUBE_FLEX, WIDE_FLEX } from "./types";

export type { GridItem } from "./types";

const CUBES_PER_ROW = 3;

export interface ConditionsGridProps {
  items: GridItem[];
  onMetricPress: (metricKey: string) => void;
  formatSunTime?: (iso: string, use24h: boolean) => string;
  use24h?: boolean;
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
}: ConditionsGridProps) {
  const rows = React.useMemo(() => buildRows(items), [items]);

  return (
    <View className="gap-2">
      <Text className="section-label mb-0.5">Conditions</Text>
      <View className="gap-2">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-2">
            {row.map((item, cellIndex) => {
              const isWidePlusCube =
                row.length === 2 && row[0].shape === "wide";
              const isCubePlusWide =
                row.length === 2 && row[1].shape === "wide";
              const flex = isWidePlusCube
                ? cellIndex === 0
                  ? WIDE_FLEX
                  : CUBE_FLEX
                : isCubePlusWide
                  ? cellIndex === 0
                    ? CUBE_FLEX
                    : WIDE_FLEX
                  : CUBE_FLEX;

              return (
                <View key={item.metricKey} className="min-w-0" style={{ flex }}>
                  {item.metricKey === "map" ? (
                    <MapCard
                      onPress={() => onMetricPress("map")}
                      latitude={item.latitude}
                      longitude={item.longitude}
                    />
                  ) : item.metricKey === "wind" && item.windSpeedFormatted != null ? (
                    <WindCard
                      windSpeed={item.windSpeedFormatted}
                      windGust={item.windGustFormatted ?? "—"}
                      directionCardinal={item.windDirectionCardinal ?? "—"}
                      directionDegrees={item.directionDegrees ?? null}
                      onPress={() => onMetricPress("wind")}
                    />
                  ) : isSunshineItem(item, formatSunTime) ? (
                    <SunshineCurveCard
                      sunrise={item.sunrise!}
                      sunset={item.sunset!}
                      formatTime={formatSunTime!}
                      use24h={use24h}
                    />
                  ) : (
                    <ConditionBox
                      title={item.title}
                      value={item.value}
                      metricKey={item.metricKey}
                      shape={item.shape}
                      onPress={onMetricPress}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
