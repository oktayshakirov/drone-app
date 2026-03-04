import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getConditionIcon } from "../../constants/conditionIcons";
import type { ConditionBoxShape } from "./types";
import { BOX_HEIGHT } from "./types";

const ICON_SIZE_CUBE = 22;
const ICON_SIZE_WIDE = 20;
const ICON_COLOR = "#94a3b8";
const WEATHER_ICON_SIZE = 32;

export interface ConditionBoxProps {
  title: string;
  value: string;
  metricKey: string;
  shape: ConditionBoxShape;
  onPress?: (metricKey: string) => void;
  /** Cube only: show this image instead of icon + title + value (e.g. hero drone). */
  imageSource?: ImageSourcePropType;
  /** Override icon (e.g. weather condition icon from conditionCode). */
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  /** Wide only: show current + min/max temps on the right (hero weather layout). */
  currentTemp?: string;
  minTemp?: string;
  maxTemp?: string;
  /** Hide the info icon on wide layout. */
  hideInfoIcon?: boolean;
}

/**
 * Reusable condition box. Two layouts:
 * - cube: centered icon, label, value (or image when imageSource set).
 * - wide: horizontal layout, icon + text (optional temp column when currentTemp set).
 */
export function ConditionBox({
  title,
  value,
  metricKey,
  shape,
  onPress,
  imageSource,
  iconName: iconNameProp,
  currentTemp,
  minTemp,
  maxTemp,
  hideInfoIcon,
}: ConditionBoxProps) {
  const isCube = shape === "cube";
  const iconName = (iconNameProp ??
    getConditionIcon(metricKey)) as React.ComponentProps<
    typeof Ionicons
  >["name"];
  const isPressable = typeof onPress === "function";

  const content = (
    <>
      {isCube && imageSource ? (
        <View className="flex-1 items-center justify-center">
          <View className="w-14 h-14 rounded-lg overflow-hidden">
            <Image
              source={imageSource}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
        </View>
      ) : isCube ? (
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
      ) : currentTemp != null && minTemp != null && maxTemp != null ? (
        <View className="flex-1 flex-row items-center justify-between gap-4">
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className="w-12 h-12 rounded-xl bg-white/5 items-center justify-center flex-shrink-0">
              <Ionicons
                name={iconName}
                size={WEATHER_ICON_SIZE}
                color={ICON_COLOR}
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-slate-400 text-[10px] uppercase tracking-wider font-medium">
                {title}
              </Text>
              <Text
                className="text-white font-medium mt-0.5 text-sm"
                numberOfLines={1}
              >
                {value}
              </Text>
            </View>
          </View>
          <View className="items-end flex-shrink-0">
            <Text className="text-white font-bold text-2xl tracking-tight">
              {currentTemp}
            </Text>
            <View className="mt-1.5 gap-0.5 items-end">
              <Text className="text-slate-400 text-xs">Min {minTemp}</Text>
              <Text className="text-slate-400 text-xs">Max {maxTemp}</Text>
            </View>
          </View>
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

          {!hideInfoIcon && metricKey !== "wind" && (
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={ICON_COLOR}
              style={{ flexShrink: 0 }}
            />
          )}
        </View>
      )}
    </>
  );

  const boxClass =
    "condition-box flex-1 min-h-0 min-w-0 rounded-xl border border-border bg-card p-3";
  const boxStyle = { minHeight: BOX_HEIGHT };

  if (isPressable) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress!(metricKey)}
        className={boxClass}
        style={boxStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return (
    <View className={boxClass} style={boxStyle}>
      {content}
    </View>
  );
}
