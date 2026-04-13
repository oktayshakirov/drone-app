import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import type { CameraPreset } from "../../constants/cameraPresets";
import { InfoList, type InfoListItem } from "../ui/InfoList";

/** Presentational preset detail (no Modal). Use inside `CameraPresetListModal` overlay or standalone. */
export function CameraPresetDetailContent({ preset }: { preset: CameraPreset }) {
  const infoItems = useMemo((): InfoListItem[] => {
    const rows: InfoListItem[] = [];
    if (preset.fps) rows.push({ label: "FPS", value: preset.fps });
    if (preset.iso) rows.push({ label: "ISO", value: preset.iso });
    if (preset.shutter) rows.push({ label: "Shutter", value: preset.shutter });
    if (preset.nd) rows.push({ label: "ND", value: preset.nd });
    if (preset.wb) rows.push({ label: "WB", value: preset.wb });
    return rows;
  }, [preset]);

  return (
    <ScrollView className="pb-6" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-start gap-3 mb-4">
        <Text className="text-4xl">{preset.emoji}</Text>
        <View className="flex-1 min-w-0">
          <Text className="text-white text-2xl font-semibold leading-tight">
            {preset.title}
          </Text>
        </View>
      </View>

      {infoItems.length > 0 ? (
        <InfoList title="Configuration" items={infoItems} layout="wrap" />
      ) : null}
    </ScrollView>
  );
}
