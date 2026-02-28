import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle } from "react-native-svg";
import { BOX_HEIGHT } from "./types";

const ICON_COLOR = "#94a3b8";
const ICON_SIZE = 18;
const ARC_WIDTH = 88;
const ARC_HEIGHT = 24;
const PADDING_X = 8;
const SUN_COLOR = "#e8a030";
const STROKE_COLOR = "#4a7c4a";
const CURVE_GREY = "#6b7280";
const END_DOT_R = 4;
const SVG_VIEW_WIDTH = ARC_WIDTH + 2 * PADDING_X;

export interface SunshineCurveCardProps {
  sunrise: string | null;
  sunset: string | null;
  formatTime: (iso: string, use24h: boolean) => string;
  use24h: boolean;
}

function sunPosition(t: number): { x: number; y: number } {
  const x = t * ARC_WIDTH;
  const y = ARC_HEIGHT * ((1 - t) * (1 - t) + t * t);
  return { x, y };
}

export function SunshineCurveCard({
  sunrise,
  sunset,
  formatTime,
  use24h,
}: SunshineCurveCardProps) {
  const { inSunTimeframe, sunX, sunY } = useMemo(() => {
    if (!sunrise || !sunset) {
      return { inSunTimeframe: false, sunX: ARC_WIDTH / 2, sunY: ARC_HEIGHT };
    }
    const now = Date.now();
    const rise = new Date(sunrise).getTime();
    const set = new Date(sunset).getTime();
    const t = (now - rise) / (set - rise);
    const inSunTimeframe = t >= 0 && t <= 1;
    const tClamped = Math.max(0, Math.min(1, t));
    const { x: sunX, y: sunY } = sunPosition(tClamped);
    return { inSunTimeframe, sunX, sunY };
  }, [sunrise, sunset]);

  const pathD = useMemo(
    () => `M ${PADDING_X} ${ARC_HEIGHT} Q ${PADDING_X + ARC_WIDTH / 2} 0 ${PADDING_X + ARC_WIDTH} ${ARC_HEIGHT}`,
    [],
  );

  const viewHeight = ARC_HEIGHT + 16;
  const sunXOffset = sunX + PADDING_X;
  const sunriseStr = sunrise ? formatTime(sunrise, use24h) : "—";
  const sunsetStr = sunset ? formatTime(sunset, use24h) : "—";

  return (
    <View
      className="condition-box flex-row items-center gap-2 py-2 px-2.5 rounded-xl border border-border bg-card"
      style={{ minHeight: BOX_HEIGHT }}
    >
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="sunny-outline" size={ICON_SIZE} color={ICON_COLOR} />
          <Text className="section-label">Sunrise</Text>
        </View>
        <Text className="text-white font-semibold text-sm mt-0.5">{sunriseStr}</Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Ionicons name="sunny-outline" size={ICON_SIZE} color={ICON_COLOR} />
          <Text className="section-label">Sunset</Text>
        </View>
        <Text className="text-white font-semibold text-sm mt-0.5">{sunsetStr}</Text>
      </View>
      <View
        className="items-center justify-center"
        style={{ width: SVG_VIEW_WIDTH, height: viewHeight }}
      >
        <Svg width={SVG_VIEW_WIDTH} height={viewHeight} viewBox={`0 0 ${SVG_VIEW_WIDTH} ${viewHeight}`}>
          <Path
            d={pathD}
            fill="none"
            stroke={inSunTimeframe ? STROKE_COLOR : CURVE_GREY}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Circle cx={PADDING_X} cy={ARC_HEIGHT} r={END_DOT_R} fill={inSunTimeframe ? STROKE_COLOR : CURVE_GREY} />
          <Circle cx={PADDING_X + ARC_WIDTH} cy={ARC_HEIGHT} r={END_DOT_R} fill={inSunTimeframe ? STROKE_COLOR : CURVE_GREY} />
          {inSunTimeframe && <Circle cx={sunXOffset} cy={sunY} r={6} fill={SUN_COLOR} />}
        </Svg>
      </View>
    </View>
  );
}
