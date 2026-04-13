import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CAMERA_PRESETS,
  type CameraPreset,
} from "../../constants/cameraPresets";
import { CameraPresetDetailContent } from "./CameraPresetDetailModal";

export interface CameraPresetListModalProps {
  visible: boolean;
  onClose: () => void;
  /** When set, detail sheet is shown above the list inside the same Modal. */
  selectedPreset: CameraPreset | null;
  onCloseDetail: () => void;
  /** Pro subscribers: no lock on preset rows. */
  isPro: boolean;
  /** Called when user selects a preset (parent applies Free/Pro gating). */
  onSelectPreset: (preset: CameraPreset) => void;
}

export function CameraPresetListModal({
  visible,
  onClose,
  selectedPreset,
  onCloseDetail,
  isPro,
  onSelectPreset,
}: CameraPresetListModalProps) {
  if (!visible) return null;

  const handleBackdropPress = () => {
    if (selectedPreset) onCloseDetail();
    else onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (selectedPreset) onCloseDetail();
        else onClose();
      }}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={handleBackdropPress}
        />

        <Pressable
          className="bg-card border-t border-border rounded-t-3xl max-h-[85%] z-[1]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-1" />
          <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
            <View className="flex-1 min-w-0 pr-2">
              <Text className="text-white text-lg font-semibold">
                Camera settings
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Presets for pro-style configuration
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="p-2 -m-2 rounded-lg active:opacity-70"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView
            className="px-4 pb-8"
            showsVerticalScrollIndicator={false}
          >
            {CAMERA_PRESETS.map((preset) => {
              const isProPreset = preset.access === "pro";
              const showLock = isProPreset && !isPro;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => onSelectPreset(preset)}
                  className="flex-row items-center gap-3 py-3 px-3 mb-2 rounded-xl border border-border bg-[#141414] active:opacity-80"
                >
                  <Text className="text-2xl">{preset.emoji}</Text>
                  <View className="flex-1 min-w-0">
                    <Text
                      className="text-white font-medium text-base"
                      numberOfLines={2}
                    >
                      {preset.title}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 flex-shrink-0">
                    {showLock ? (
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color="#94a3b8"
                      />
                    ) : null}
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#64748b"
                    />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>

        {selectedPreset ? (
          <View
            className="absolute inset-0 z-[10] justify-end"
            pointerEvents="box-none"
            style={{ elevation: 24 }}
          >
            <Pressable
              className="absolute inset-0 bg-black/50"
              onPress={onCloseDetail}
            />
            <Pressable
              className="w-full bg-card border-t border-border rounded-t-3xl p-6 max-h-[85%] z-[11]"
              onPress={(e) => e.stopPropagation()}
              style={{ elevation: 26 }}
            >
              <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-1 mb-2" />
              <View className="flex-row items-center justify-end -mt-2 mb-2">
                <Pressable
                  onPress={onCloseDetail}
                  className="p-2 -m-2 rounded-lg active:opacity-70"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </Pressable>
              </View>
              <CameraPresetDetailContent preset={selectedPreset} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
