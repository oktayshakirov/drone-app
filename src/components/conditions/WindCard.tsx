import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Svg, { Line, Path, G, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useDeviceHeading } from "../../hooks/useDeviceHeading";
import { useSettings } from "../../contexts/SettingsContext";
import { BOX_HEIGHT } from "./types";

const ICON_COLOR = "#94a3b8";
const ICON_SIZE = 18;
const COMPASS_SIZE = 72;
const CENTER = COMPASS_SIZE / 2;
const ARROW_LENGTH = 16;
const ARROW_HALF = ARROW_LENGTH / 2;
const ARROW_STEM_TOP = 8;
const ARROW_STEM_WIDTH = 1.5;
const ARROW_HEAD_WIDTH = 5;
const RING_R = CENTER - 3;
const STROKE_COLOR = "#94a3b8";
const CARDINAL_FONT_SIZE = 10;
const TICK_LENGTH = 3;
const COMPASS_VIEW_WIDTH = 88;

export interface WindCardProps {
  windSpeed: string;
  windGust: string;
  directionCardinal: string;
  directionDegrees: number | null;
  onPress: () => void;
}

function Tick({ degrees }: { degrees: number }) {
  const rad = (degrees * Math.PI) / 180;
  const innerR = RING_R - TICK_LENGTH;
  const outerR = RING_R;
  const isCardinal = degrees % 90 === 0;
  const x1 = CENTER + innerR * Math.sin(rad);
  const y1 = CENTER - innerR * Math.cos(rad);
  const x2 = CENTER + outerR * Math.sin(rad);
  const y2 = CENTER - outerR * Math.cos(rad);
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
}: WindCardProps) {
  const { settings } = useSettings();
  const deviceHeading = useDeviceHeading(settings.compassEnabled);
  const windDir = directionDegrees != null ? directionDegrees : 0;
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const useCompass = settings.compassEnabled && isNative && deviceHeading != null;
  const roseRotation = useCompass ? -deviceHeading! : 0;
  const arrowRotation = useCompass ? windDir - deviceHeading! : windDir;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="condition-box flex-row items-center gap-2 py-2 px-2.5 rounded-xl border border-border bg-card"
      style={{ minHeight: BOX_HEIGHT }}
    >
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="leaf-outline" size={ICON_SIZE} color={ICON_COLOR} />
          <Text className="section-label">Wind</Text>
        </View>
        <Text className="text-white font-semibold text-sm mt-0.5">{windSpeed}</Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Ionicons name="flag-outline" size={ICON_SIZE} color={ICON_COLOR} />
          <Text className="section-label">Gust</Text>
        </View>
        <Text className="text-white font-semibold text-sm mt-0.5">{windGust}</Text>
      </View>
      <View
        className="items-center justify-center"
        style={{ width: COMPASS_VIEW_WIDTH }}
      >
        <Text className="section-label text-[7px] mb-1">Direction</Text>
        <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
          <G transform={`rotate(${roseRotation} ${CENTER} ${CENTER})`}>
            {[45, 135, 225, 315].map((deg) => (
              <Tick key={deg} degrees={deg} />
            ))}
            <SvgText
              x={CENTER}
              y={CENTER - RING_R + CARDINAL_FONT_SIZE}
              textAnchor="middle"
              fill={STROKE_COLOR}
              fontSize={CARDINAL_FONT_SIZE}
            >
              N
            </SvgText>
            <SvgText
              x={CENTER + RING_R - 1}
              y={CENTER + CARDINAL_FONT_SIZE / 2}
              textAnchor="middle"
              fill={STROKE_COLOR}
              fontSize={CARDINAL_FONT_SIZE}
            >
              E
            </SvgText>
            <SvgText
              x={CENTER}
              y={CENTER + RING_R - 1}
              textAnchor="middle"
              fill={STROKE_COLOR}
              fontSize={CARDINAL_FONT_SIZE}
            >
              S
            </SvgText>
            <SvgText
              x={CENTER - RING_R + 1}
              y={CENTER + CARDINAL_FONT_SIZE / 2}
              textAnchor="middle"
              fill={STROKE_COLOR}
              fontSize={CARDINAL_FONT_SIZE}
            >
              W
            </SvgText>
          </G>
          <G transform={`rotate(${arrowRotation} ${CENTER} ${CENTER})`}>
            <Path
              d={`M ${CENTER - ARROW_STEM_WIDTH} ${CENTER + ARROW_HALF} L ${CENTER + ARROW_STEM_WIDTH} ${CENTER + ARROW_HALF} L ${CENTER + ARROW_STEM_WIDTH} ${CENTER + ARROW_HALF - ARROW_STEM_TOP} L ${CENTER + ARROW_HEAD_WIDTH} ${CENTER + ARROW_HALF - ARROW_STEM_TOP} L ${CENTER} ${CENTER - ARROW_HALF} L ${CENTER - ARROW_HEAD_WIDTH} ${CENTER + ARROW_HALF - ARROW_STEM_TOP} L ${CENTER - ARROW_STEM_WIDTH} ${CENTER + ARROW_HALF - ARROW_STEM_TOP} Z`}
              fill={STROKE_COLOR}
            />
          </G>
        </Svg>
      </View>
    </TouchableOpacity>
  );
}
