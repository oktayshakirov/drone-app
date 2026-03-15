import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SafetyStatus } from "../../types/weather";
import { BOX_HEIGHT, BOX_HEIGHT_TABLET } from "./types";

const STATUS_CONFIG: Record<
  SafetyStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; text: string; iconColor: string }
> = {
  green: {
    label: "Go",
    icon: "checkmark-circle",
    bg: "bg-safe-green/20",
    text: "text-safe-green",
    iconColor: "#22c55e",
  },
  yellow: {
    label: "Caution",
    icon: "warning",
    bg: "bg-caution-yellow/20",
    text: "text-caution-yellow",
    iconColor: "#eab308",
  },
  red: {
    label: "No Go",
    icon: "close-circle",
    bg: "bg-danger-red/20",
    text: "text-danger-red",
    iconColor: "#ef4444",
  },
};

export interface GoNoGoCardProps {
  status: SafetyStatus;
  onPress?: () => void;
  /** Larger min height on tablet (same layout). */
  size?: "default" | "large";
}

/**
 * Hero cube showing overall flight condition: Go (green), Caution (yellow), or No Go (red).
 * Replaces the drone image in the first hero slot when Go/No-Go is enabled.
 */
export function GoNoGoCard({ status, onPress, size = "default" }: GoNoGoCardProps) {
  const config = STATUS_CONFIG[status];
  const minHeight = size === "large" ? BOX_HEIGHT_TABLET : BOX_HEIGHT;
  const content = (
    <View
      className={`condition-box flex-1 min-h-0 min-w-0 rounded-xl border border-border p-3 ${config.bg}`}
      style={{ minHeight }}
    >
      <View className="flex-1 items-center justify-center">
        <Ionicons
          name={config.icon}
          size={size === "large" ? 38 : 32}
          color={config.iconColor}
        />
        <Text className={`font-bold mt-1 ${config.text} ${size === "large" ? "text-lg" : "text-base"}`}>
          {config.label}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="min-w-0 flex-1">
        {content}
      </Pressable>
    );
  }
  return content;
}
