import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Svg, { Line, Path, G, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useDeviceHeading } from "../../hooks/useDeviceHeading";
import { useSettings } from "../../contexts/SettingsContext";
import { StatusIndicatorDot } from "./StatusIndicatorDot";
import { BOX_HEIGHT, BOX_HEIGHT_TABLET } from "./types";

const ICON_COLOR = "#94a3b8";
const STROKE_COLOR = "#94a3b8";

const SIZES = {
  default: {
    compassSize: 72,
    iconSize: 20,
    compassViewWidth: 88,
    cardinalFontSize: 11,
    tickLength: 3,
    arrowLength: 16,
    arrowStemTop: 8,
    arrowStemWidth: 1.5,
    arrowHeadWidth: 5,
    minHeight: BOX_HEIGHT,
  },
  large: {
    compassSize: 112,
    iconSize: 26,
    compassViewWidth: 132,
    cardinalFontSize: 14,
    tickLength: 4,
    arrowLength: 24,
    arrowStemTop: 12,
    arrowStemWidth: 2,
    arrowHeadWidth: 7,
    minHeight: BOX_HEIGHT_TABLET,
  },
} as const;

export interface WindCardProps {
  windSpeed: string;
  windGust: string;
  directionCardinal: string;
  directionDegrees: number | null;
  onPress?: () => void;
  /** Go/No-Go status: show small yellow/red dot on top-right when caution or no-go. */
  statusIndicator?: "yellow" | "red";
  /** Larger layout for info modal preview. */
  size?: "default" | "large";
}

function Tick({
  degrees,
  center,
  ringR,
  tickLength,
}: {
  degrees: number;
  center: number;
  ringR: number;
  tickLength: number;
}) {
  const rad = (degrees * Math.PI) / 180;
  const innerR = ringR - tickLength;
  const outerR = ringR;
  const isCardinal = degrees % 90 === 0;
  const x1 = center + innerR * Math.sin(rad);
  const y1 = center - innerR * Math.cos(rad);
  const x2 = center + outerR * Math.sin(rad);
  const y2 = center - outerR * Math.cos(rad);
  return (
    <Line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={STROKE_COLOR}
      strokeWidth={isCardinal ? 1.5 : 1}
    />
  );
}

/**
 * Wide condition card (same width as SunshineCurveCard): Wind and Gust on the left,
 * wind direction compass on the right. Layout mirrors SunshineCurveCard.
 */
export function WindCard({
  windSpeed,
  windGust,
  directionCardinal,
  directionDegrees,
  onPress,
  statusIndicator,
  size = "default",
}: WindCardProps) {
  const { settings } = useSettings();
  const deviceHeading = useDeviceHeading(settings.compassEnabled);
  const windDir = directionDegrees != null ? directionDegrees : 0;
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const useCompass = settings.compassEnabled && isNative && deviceHeading != null;
  const roseRotation = useCompass ? -deviceHeading! : 0;
  const arrowRotation = useCompass ? windDir - deviceHeading! : windDir;

  const s = SIZES[size];
  const center = s.compassSize / 2;
  const ringR = center - 3;
  const arrowHalf = s.arrowLength / 2;
  const arrowPath = `M ${center - s.arrowStemWidth} ${center + arrowHalf} L ${center + s.arrowStemWidth} ${center + arrowHalf} L ${center + s.arrowStemWidth} ${center + arrowHalf - s.arrowStemTop} L ${center + s.arrowHeadWidth} ${center + arrowHalf - s.arrowStemTop} L ${center} ${center - arrowHalf} L ${center - s.arrowHeadWidth} ${center + arrowHalf - s.arrowStemTop} L ${center - s.arrowStemWidth} ${center + arrowHalf - s.arrowStemTop} Z`;

  const content = (
    <>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="leaf-outline" size={s.iconSize} color={ICON_COLOR} />
          <Text className={size === "large" ? "section-label text-base" : "section-label text-xs"}>Wind</Text>
        </View>
        <Text className={size === "large" ? "text-white font-semibold text-lg mt-0.5" : "text-white font-semibold text-base mt-0.5"}>{windSpeed}</Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Ionicons name="flag-outline" size={s.iconSize} color={ICON_COLOR} />
          <Text className={size === "large" ? "section-label text-base" : "section-label text-xs"}>Gust</Text>
        </View>
        <Text className={size === "large" ? "text-white font-semibold text-lg mt-0.5" : "text-white font-semibold text-base mt-0.5"}>{windGust}</Text>
      </View>
      <View
        className="items-center justify-center"
        style={{ width: s.compassViewWidth }}
      >
        <Text className={size === "large" ? "section-label text-xs mb-1" : "section-label text-[9px] mb-1"}>Direction</Text>
        <Svg width={s.compassSize} height={s.compassSize} viewBox={`0 0 ${s.compassSize} ${s.compassSize}`}>
          <G transform={`rotate(${roseRotation} ${center} ${center})`}>
            {[45, 135, 225, 315].map((deg) => (
              <Tick key={deg} degrees={deg} center={center} ringR={ringR} tickLength={s.tickLength} />
            ))}
            <SvgText
              x={center}
              y={center - ringR + s.cardinalFontSize}
              textAnchor="middle"
              fill={STROKE_COLOR}
              fontSize={s.cardinalFontSize}
            >
              N
            </SvgText>
            <SvgText
              x={center + ringR - 1}
              y={center + s.cardinalFontSize / 2}
              textAnchor="middle"
              fill={STROKE_COLOR}
              fontSize={s.cardinalFontSize}
            >
              E
            </SvgText>
            <SvgText
              x={center}
              y={center + ringR - 1}
              textAnchor="middle"
              fill={STROKE_COLOR}
              fontSize={s.cardinalFontSize}
            >
              S
            </SvgText>
            <SvgText
              x={center - ringR + 1}
              y={center + s.cardinalFontSize / 2}
              textAnchor="middle"
              fill={STROKE_COLOR}
              fontSize={s.cardinalFontSize}
            >
              W
            </SvgText>
          </G>
          <G transform={`rotate(${arrowRotation} ${center} ${center})`}>
            <Path d={arrowPath} fill={STROKE_COLOR} />
          </G>
        </Svg>
      </View>
      {statusIndicator && <StatusIndicatorDot status={statusIndicator} />}
    </>
  );

  const style = {
    minHeight: size === "large" ? s.minHeight : BOX_HEIGHT,
    ...(statusIndicator ? { position: "relative" as const } : {}),
  };

  if (onPress == null) {
    return (
      <View
        className="condition-box flex-row items-center gap-2 py-2 px-2.5 rounded-xl border border-border bg-card"
        style={style}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="condition-box flex-row items-center gap-2 py-2 px-2.5 rounded-xl border border-border bg-card"
      style={style}
    >
      {content}
    </TouchableOpacity>
  );
}
