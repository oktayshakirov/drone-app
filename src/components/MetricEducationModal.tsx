import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { getMetricEducation } from "../constants/metricCopy";

interface MetricEducationModalProps {
  visible: boolean;
  metricKey: string | null;
  onClose: () => void;
}

export function MetricEducationModal({
  visible,
  metricKey,
  onClose,
}: MetricEducationModalProps) {
  const education = metricKey ? getMetricEducation(metricKey) : null;

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
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mb-4" />
          {education ? (
            <>
              <Text className="text-white text-xl font-semibold">
                {education.title}
              </Text>
              <Text className="text-slate-300 mt-3 leading-6">
                {education.body}
              </Text>
            </>
          ) : (
            <Text className="text-slate-400">No details for this metric.</Text>
          )}
          <TouchableOpacity
            onPress={onClose}
            className="mt-6 py-3 bg-slate-600 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-medium">Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
