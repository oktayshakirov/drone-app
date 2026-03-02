import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getInfo } from "../../constants/metricCopy";

interface InfoModalProps {
  visible: boolean;
  metricKey: string | null;
  onClose: () => void;
}

export function InfoModal({ visible, metricKey, onClose }: InfoModalProps) {
  const info = metricKey ? getInfo(metricKey) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-card border-t border-border rounded-t-3xl p-6"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-1 mb-2" />
          <View className="flex-row items-center justify-end -mt-2 mb-2">
            <Pressable
              onPress={onClose}
              className="p-2 -m-2 rounded-lg active:opacity-70"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </Pressable>
          </View>
          {info ? (
            <View className="pb-6">
              <Text className="text-white text-xl font-semibold">
                {info.title}
              </Text>
              <Text className="text-slate-300 mt-3 mb-4 leading-6">
                {info.body}
              </Text>
            </View>
          ) : (
            <Text className="text-slate-400 pb-6">
              No details for this metric.
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
