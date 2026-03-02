import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Settings, Units, WindUnit, TimeFormat } from "../../types/settings";

const UNITS_OPTIONS: { id: Units; label: string }[] = [
  { id: "imperial", label: "Imperial (°F, mi)" },
  { id: "metric", label: "Metric (°C, km)" },
];

const WIND_OPTIONS: { id: WindUnit; label: string }[] = [
  { id: "mph", label: "mph" },
  { id: "kmh", label: "km/h" },
  { id: "ms", label: "m/s" },
  { id: "knots", label: "knots" },
];

const TIME_OPTIONS: { id: TimeFormat; label: string }[] = [
  { id: "12h", label: "12-hour" },
  { id: "24h", label: "24-hour" },
];

const COMPASS_OPTIONS: { id: boolean; label: string }[] = [
  { id: true, label: "On" },
  { id: false, label: "Off" },
];

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: Settings;
  setUnits: (u: Units) => void;
  setWindUnit: (u: WindUnit) => void;
  setTimeFormat: (t: TimeFormat) => void;
  setCompassEnabled: (enabled: boolean) => void;
}

export function SettingsModal({
  visible,
  onClose,
  settings,
  setUnits,
  setWindUnit,
  setTimeFormat,
  setCompassEnabled,
}: SettingsModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-card border-t border-border rounded-t-3xl max-h-[85%]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-1" />
          <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
            <Text className="text-white text-lg font-semibold">Settings</Text>
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
            {/* General units */}
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons
                  name="thermometer-outline"
                  size={20}
                  color="#94a3b8"
                />
                <Text className="section-label">Units</Text>
              </View>
              <View className="rounded-xl border border-border overflow-hidden">
                {UNITS_OPTIONS.map((opt) => {
                  const isSelected = settings.units === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setUnits(opt.id)}
                      className={`py-3 px-4 border-b border-border/50 last:border-b-0 ${
                        isSelected ? "bg-slate-600" : ""
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={
                          isSelected
                            ? "text-white font-medium"
                            : "text-slate-300"
                        }
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Wind speed */}
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="flag-outline" size={20} color="#94a3b8" />
                <Text className="section-label">Wind speed</Text>
              </View>
              <View className="rounded-xl border border-border overflow-hidden">
                {WIND_OPTIONS.map((opt) => {
                  const isSelected = settings.windUnit === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setWindUnit(opt.id)}
                      className={`py-3 px-4 border-b border-border/50 last:border-b-0 ${
                        isSelected ? "bg-slate-600" : ""
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={
                          isSelected
                            ? "text-white font-medium"
                            : "text-slate-300"
                        }
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time format */}
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="time-outline" size={20} color="#94a3b8" />
                <Text className="section-label">Time format</Text>
              </View>
              <View className="rounded-xl border border-border overflow-hidden">
                {TIME_OPTIONS.map((opt) => {
                  const isSelected = settings.timeFormat === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setTimeFormat(opt.id)}
                      className={`py-3 px-4 border-b border-border/50 last:border-b-0 ${
                        isSelected ? "bg-slate-600" : ""
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={
                          isSelected
                            ? "text-white font-medium"
                            : "text-slate-300"
                        }
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Compass heading */}
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="compass-outline" size={20} color="#94a3b8" />
                <Text className="section-label">Compass heading</Text>
              </View>
              <View className="rounded-xl border border-border overflow-hidden">
                {COMPASS_OPTIONS.map((opt) => {
                  const isSelected = settings.compassEnabled === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id ? "on" : "off"}
                      onPress={() => setCompassEnabled(opt.id)}
                      className={`py-3 px-4 border-b border-border/50 last:border-b-0 ${
                        isSelected ? "bg-slate-600" : ""
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={
                          isSelected
                            ? "text-white font-medium"
                            : "text-slate-300"
                        }
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
