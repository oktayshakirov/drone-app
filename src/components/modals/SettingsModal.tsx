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
import type {
  Settings,
  Units,
  WindUnit,
  TimeFormat,
} from "../../types/settings";
import type { WeightClassId } from "../../constants/droneThresholds";
import { WEIGHT_CLASS_OPTIONS } from "../../constants/droneThresholds";

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
  { id: "12h", label: "12h" },
  { id: "24h", label: "24h" },
];

const COMPASS_OPTIONS: { id: boolean; label: string }[] = [
  { id: true, label: "On" },
  { id: false, label: "Off" },
];

const ICON_COLOR = "#94a3b8";
const ICON_SIZE = 18;

function OptionBar<T extends string | boolean>({
  label,
  iconName,
  options,
  value,
  onSelect,
  getKey,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  options: { id: T; label: string }[];
  value: T;
  onSelect: (id: T) => void;
  getKey: (id: T) => string;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name={iconName} size={ICON_SIZE} color={ICON_COLOR} />
        <Text className="section-label">{label}</Text>
      </View>
      <View className="flex-row rounded-xl border border-border overflow-hidden bg-card">
        {options.map((opt, index) => {
          const isSelected = value === opt.id;
          const isLast = index === options.length - 1;
          return (
            <TouchableOpacity
              key={getKey(opt.id)}
              onPress={() => onSelect(opt.id)}
              style={{ flex: 1 }}
              className={`py-3 items-center justify-center ${
                !isLast ? "border-r border-border" : ""
              } ${isSelected ? "bg-slate-600" : "bg-transparent"}`}
              activeOpacity={0.7}
            >
              <Text
                className={
                  isSelected
                    ? "text-white font-medium text-sm"
                    : "text-slate-400 text-sm"
                }
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: Settings;
  setUnits: (u: Units) => void;
  setWindUnit: (u: WindUnit) => void;
  setTimeFormat: (t: TimeFormat) => void;
  setCompassEnabled: (enabled: boolean) => void;
  setDroneWeightClass: (id: WeightClassId) => void;
}

export function SettingsModal({
  visible,
  onClose,
  settings,
  setUnits,
  setWindUnit,
  setTimeFormat,
  setCompassEnabled,
  setDroneWeightClass,
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
            {/* Drone weight class */}
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="airplane-outline" size={20} color="#94a3b8" />
                <Text className="section-label">Drone weight class</Text>
              </View>
              <View className="rounded-xl border border-border overflow-hidden">
                {WEIGHT_CLASS_OPTIONS.map((opt) => {
                  const isSelected = settings.droneWeightClass === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setDroneWeightClass(opt.id)}
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

            {/* Units, Wind, Time, Compass – horizontal bars with label above */}
            <View className="mt-2 pt-4 border-t border-border/50">
              <OptionBar
                label="Units"
                iconName="thermometer-outline"
                options={UNITS_OPTIONS}
                value={settings.units}
                onSelect={setUnits}
                getKey={(id) => id}
              />
              <OptionBar
                label="Wind unit"
                iconName="flag-outline"
                options={WIND_OPTIONS}
                value={settings.windUnit}
                onSelect={setWindUnit}
                getKey={(id) => id}
              />
              <OptionBar
                label="Time format"
                iconName="time-outline"
                options={TIME_OPTIONS}
                value={settings.timeFormat}
                onSelect={setTimeFormat}
                getKey={(id) => id}
              />
              <OptionBar
                label="Compass"
                iconName="compass-outline"
                options={COMPASS_OPTIONS}
                value={settings.compassEnabled}
                onSelect={setCompassEnabled}
                getKey={(id) => (id ? "on" : "off")}
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
