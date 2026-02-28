import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Svg, { Circle, Line, G, Text as SvgText } from "react-native-svg";
import { useDeviceHeading } from "../../hooks/useDeviceHeading";
import { useSettings } from "../../contexts/SettingsContext";
import { BOX_HEIGHT } from "./types";

const SIZE = 32;
const CENTER = SIZE / 2;
const NEEDLE_LENGTH = 10;
const RING_R = CENTER - 2;
const STROKE_COLOR = "#94a3b8";
const COMPASS_RING_STROKE = 1.5;
const CARDINAL_FONT_SIZE = 7;
const TICK_LENGTH = 2;

export interface WindDirectionCardProps {
  title: string;
  value: string;
  directionDegrees: number | null;
  onPress: () => void;
}

/**
 * Cube-sized condition box with a compass that rotates with the device.
 * Rose (N,E,S,W) follows device heading; wind arrow points where wind is from.
 * Same dimensions as other cubes. iOS and Android.
 */
export function WindDirectionCard({
  title,
  value,
  directionDegrees,
  onPress,
}: WindDirectionCardProps) {
  const { settings } = useSettings();
  const deviceHeading = useDeviceHeading(settings.compassEnabled);
  const windDir = directionDegrees != null ? directionDegrees : 0;

  const useCompass = settings.compassEnabled;
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const roseRotation =
    useCompass && isNative && deviceHeading != null ? -deviceHeading : 0;
  const arrowRotation =
    useCompass && isNative && deviceHeading != null
      ? windDir - deviceHeading
      : windDir;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="condition-box flex-1 min-h-0 min-w-0 rounded-xl border border-border bg-card p-3"
      style={{ minHeight: BOX_HEIGHT }}
    >
      <View className="flex-1 items-center justify-center">
        <View className="mb-1">
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <G transform={`rotate(${roseRotation} ${CENTER} ${CENTER})`}>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RING_R}
                fill="none"
                stroke={STROKE_COLOR}
                strokeWidth={COMPASS_RING_STROKE}
              />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
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
              <Line
                x1={CENTER}
                y1={CENTER}
                x2={CENTER}
                y2={CENTER - NEEDLE_LENGTH}
                stroke={STROKE_COLOR}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </G>
          </Svg>
        </View>
        <Text className="section-label text-[10px]">{title}</Text>
        <Text
          className="text-white font-semibold mt-0.5 text-sm text-center"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </TouchableOpacity>
  );
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
