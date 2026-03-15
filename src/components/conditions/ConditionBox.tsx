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
import { StatusIndicatorDot } from "./StatusIndicatorDot";
import type { ConditionBoxShape } from "./types";
import { BOX_HEIGHT, BOX_HEIGHT_TABLET } from "./types";

const ICON_COLOR = "#94a3b8";
const SIZES = {
  default: { iconCube: 26, iconWide: 24, weatherIcon: 36, minHeight: BOX_HEIGHT },
  large: { iconCube: 38, iconWide: 30, weatherIcon: 42, minHeight: BOX_HEIGHT_TABLET },
} as const;

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
  /** Go/No-Go status: show small yellow/red dot on top-right when caution or no-go. */
  statusIndicator?: "yellow" | "red";
  /** Larger layout for info modal preview. */
  size?: "default" | "large";
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
  statusIndicator,
  size = "default",
}: ConditionBoxProps) {
  const isCube = shape === "cube";
  const iconName = (iconNameProp ??
    getConditionIcon(metricKey)) as React.ComponentProps<
    typeof Ionicons
  >["name"];
  const isPressable = typeof onPress === "function";
  const s = SIZES[size];
  const isLarge = size === "large";

  const content = (
    <>
      {isCube && imageSource ? (
        <View className="flex-1 items-center justify-center">
          <View className={isLarge ? "w-20 h-20 rounded-lg overflow-hidden" : "w-14 h-14 rounded-lg overflow-hidden"}>
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
              size={s.iconCube}
              color={ICON_COLOR}
            />
          </View>
          <Text className={isLarge ? "section-label text-sm" : "section-label text-xs"}>{title}</Text>
          <Text
            className={isLarge ? "text-white font-semibold mt-0.5 text-lg text-center" : "text-white font-semibold mt-0.5 text-base text-center"}
            numberOfLines={2}
          >
            {value}
          </Text>
        </View>
      ) : currentTemp != null && minTemp != null && maxTemp != null ? (
        <View className="flex-1 flex-row items-center justify-between gap-4">
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className={isLarge ? "w-14 h-14 rounded-xl bg-white/5 items-center justify-center flex-shrink-0" : "w-11 h-11 rounded-xl bg-white/5 items-center justify-center flex-shrink-0"}>
              <Ionicons
                name={iconName}
                size={s.weatherIcon}
                color={ICON_COLOR}
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-slate-400 text-xs uppercase tracking-wider font-medium">
                {title}
              </Text>
              <Text
                className="text-white font-medium mt-0.5 text-base"
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
            <View className={isLarge ? "w-14 h-14 rounded-xl bg-surface/80 items-center justify-center flex-shrink-0" : "w-10 h-10 rounded-lg bg-surface/80 items-center justify-center flex-shrink-0"}>
              <Ionicons
                name={iconName}
                size={s.iconWide}
                color={ICON_COLOR}
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className={isLarge ? "section-label text-base" : "section-label text-xs"}>{title}</Text>
              <Text
                className={isLarge ? "text-white font-semibold mt-0.5 text-xl" : "text-white font-semibold mt-0.5 text-lg"}
                numberOfLines={1}
              >
                {value}
              </Text>
            </View>
          </View>

          {!hideInfoIcon && metricKey !== "wind" && !isLarge && (
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
  const boxStyle = {
    minHeight: size === "default" ? BOX_HEIGHT : s.minHeight,
    ...(statusIndicator ? { position: "relative" as const } : {}),
  };

  if (isPressable) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress!(metricKey)}
        className={boxClass}
        style={boxStyle}
      >
        {content}
        {statusIndicator && <StatusIndicatorDot status={statusIndicator} />}
      </TouchableOpacity>
    );
  }
  return (
    <View className={boxClass} style={boxStyle}>
      {content}
      {statusIndicator && <StatusIndicatorDot status={statusIndicator} />}
    </View>
  );
}
