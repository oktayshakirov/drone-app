import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getConditionIcon } from "../../constants/conditionIcons";
import type { ConditionBoxShape } from "./types";
import { BOX_HEIGHT } from "./types";

const ICON_SIZE_CUBE = 22;
const ICON_SIZE_WIDE = 20;
const ICON_COLOR = "#94a3b8";

export interface ConditionBoxProps {
  title: string;
  value: string;
  metricKey: string;
  shape: ConditionBoxShape;
  onPress: (metricKey: string) => void;
}

/**
 * Reusable condition box. Two layouts:
 * - cube: centered icon, label, value (same height as wide).
 * - wide: horizontal layout, icon + text (width = 2 cubes).
 */
export function ConditionBox({
  title,
  value,
  metricKey,
  shape,
  onPress,
}: ConditionBoxProps) {
  const isCube = shape === "cube";
  const iconName = getConditionIcon(metricKey) as React.ComponentProps<
    typeof Ionicons
  >["name"];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(metricKey)}
      className="condition-box flex-1 min-h-0 min-w-0 rounded-xl border border-border bg-card p-3"
      style={{ minHeight: BOX_HEIGHT }}
    >
      {isCube ? (
        <View className="flex-1 items-center justify-center">
          <View className="mb-1">
            <Ionicons
              name={iconName}
              size={ICON_SIZE_CUBE}
              color={ICON_COLOR}
            />
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
        <View className="flex-1 flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className="w-9 h-9 rounded-lg bg-surface/80 items-center justify-center flex-shrink-0">
              <Ionicons
                name={iconName}
                size={ICON_SIZE_WIDE}
                color={ICON_COLOR}
              />
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

          {metricKey !== "wind" && (
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={ICON_COLOR}
              style={{ flexShrink: 0 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
