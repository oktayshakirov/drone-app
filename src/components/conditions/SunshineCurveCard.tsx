import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle } from "react-native-svg";
import { BOX_HEIGHT, BOX_HEIGHT_TABLET } from "./types";

const ICON_COLOR = "#94a3b8";
const SUN_COLOR = "#e8a030";
const STROKE_COLOR = "#4a7c4a";
const CURVE_GREY = "#6b7280";

const SIZES = {
  default: {
    iconSize: 20,
    arcWidth: 88,
    arcHeight: 24,
    paddingX: 8,
    endDotR: 4,
    sunDotR: 6,
    strokeWidth: 2.5,
    minHeight: BOX_HEIGHT,
  },
  large: {
    iconSize: 26,
    arcWidth: 140,
    arcHeight: 38,
    paddingX: 12,
    endDotR: 6,
    sunDotR: 8,
    strokeWidth: 3,
    minHeight: BOX_HEIGHT_TABLET,
  },
} as const;

export interface SunshineCurveCardProps {
  sunrise: string | null;
  sunset: string | null;
  formatTime: (iso: string, use24h: boolean) => string;
  use24h: boolean;
  /** Larger layout for info modal preview. */
  size?: "default" | "large";
  /** When set, card is pressable and opens info modal. */
  onPress?: () => void;
}

function sunPosition(t: number, arcWidth: number, arcHeight: number): { x: number; y: number } {
  const x = t * arcWidth;
  const y = arcHeight * ((1 - t) * (1 - t) + t * t);
  return { x, y };
}

export function SunshineCurveCard({
  sunrise,
  sunset,
  formatTime,
  use24h,
  size = "default",
  onPress,
}: SunshineCurveCardProps) {
  const s = SIZES[size];
  const svgViewWidth = s.arcWidth + 2 * s.paddingX;
  const viewHeight = s.arcHeight + 16;

  const { inSunTimeframe, sunX, sunY } = useMemo(() => {
    if (!sunrise || !sunset) {
      return { inSunTimeframe: false, sunX: s.arcWidth / 2, sunY: s.arcHeight };
    }
    const now = Date.now();
    const rise = new Date(sunrise).getTime();
    const set = new Date(sunset).getTime();
    const t = (now - rise) / (set - rise);
    const inSunTimeframe = t >= 0 && t <= 1;
    const tClamped = Math.max(0, Math.min(1, t));
    const { x: sunX, y: sunY } = sunPosition(tClamped, s.arcWidth, s.arcHeight);
    return { inSunTimeframe, sunX, sunY };
  }, [sunrise, sunset, size]);

  const pathD = useMemo(
    () =>
      `M ${s.paddingX} ${s.arcHeight} Q ${s.paddingX + s.arcWidth / 2} 0 ${s.paddingX + s.arcWidth} ${s.arcHeight}`,
    [s.paddingX, s.arcWidth, s.arcHeight],
  );

  const sunXOffset = sunX + s.paddingX;
  const sunriseStr = sunrise ? formatTime(sunrise, use24h) : "—";
  const sunsetStr = sunset ? formatTime(sunset, use24h) : "—";

  const content = (
    <>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="sunny-outline" size={s.iconSize} color={ICON_COLOR} />
          <Text className={size === "large" ? "section-label text-base" : "section-label text-xs"}>Sunrise</Text>
        </View>
        <Text className={size === "large" ? "text-white font-semibold text-lg mt-0.5" : "text-white font-semibold text-base mt-0.5"}>
          {sunriseStr}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Ionicons name="sunny-outline" size={s.iconSize} color={ICON_COLOR} />
          <Text className={size === "large" ? "section-label text-base" : "section-label text-xs"}>Sunset</Text>
        </View>
        <Text className={size === "large" ? "text-white font-semibold text-lg mt-0.5" : "text-white font-semibold text-base mt-0.5"}>
          {sunsetStr}
        </Text>
      </View>
      <View
        className="items-center justify-center"
        style={{ width: svgViewWidth, height: viewHeight }}
      >
        <Svg
          width={svgViewWidth}
          height={viewHeight}
          viewBox={`0 0 ${svgViewWidth} ${viewHeight}`}
        >
          <Path
            d={pathD}
            fill="none"
            stroke={inSunTimeframe ? STROKE_COLOR : CURVE_GREY}
            strokeWidth={s.strokeWidth}
            strokeLinecap="round"
          />
          <Circle
            cx={s.paddingX}
            cy={s.arcHeight}
            r={s.endDotR}
            fill={inSunTimeframe ? STROKE_COLOR : CURVE_GREY}
          />
          <Circle
            cx={s.paddingX + s.arcWidth}
            cy={s.arcHeight}
            r={s.endDotR}
            fill={inSunTimeframe ? STROKE_COLOR : CURVE_GREY}
          />
          {inSunTimeframe && (
            <Circle cx={sunXOffset} cy={sunY} r={s.sunDotR} fill={SUN_COLOR} />
          )}
        </Svg>
      </View>
    </>
  );

  const style = { minHeight: size === "default" ? BOX_HEIGHT : s.minHeight };
  const className = "condition-box flex-row items-center gap-2 py-2 px-2.5 rounded-xl border border-border bg-card";

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className={className}
        style={style}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return (
    <View className={className} style={style}>
      {content}
    </View>
  );
}
