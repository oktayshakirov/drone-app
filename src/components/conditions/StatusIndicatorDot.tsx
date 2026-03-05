import React from "react";
import { View } from "react-native";

const COLOR = { yellow: "#eab308", red: "#ef4444" } as const;

export interface StatusIndicatorDotProps {
  status: "yellow" | "red";
  top?: number;
  right?: number;
}

/**
 * Small dot for Go/No-Go status (caution or no-go). Render inside a parent with position: "relative".
 */
export function StatusIndicatorDot({
  status,
  top = 8,
  right = 10,
}: StatusIndicatorDotProps) {
  return (
    <View
      style={{
        position: "absolute",
        top,
        right,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLOR[status],
      }}
    />
  );
}
