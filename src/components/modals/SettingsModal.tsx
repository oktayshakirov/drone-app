import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type {
  Settings,
  Units,
  WindUnit,
  TimeFormat,
} from "../../types/settings";
import type { WeightClassId } from "../../constants/droneThresholds";
import { WEIGHT_CLASS_OPTIONS } from "../../constants/droneThresholds";
import { OptionList } from "../ui/OptionList";

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

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: Settings;
  setUnits: (u: Units) => void;
  setWindUnit: (u: WindUnit) => void;
  setTimeFormat: (t: TimeFormat) => void;
  setCompassEnabled: (enabled: boolean) => void;
  setDroneWeightClass: (id: WeightClassId) => void;
  showDevProToggle?: boolean;
  devProEnabled?: boolean;
  setDevProEnabled?: (enabled: boolean) => void;
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
  showDevProToggle = false,
  devProEnabled = false,
  setDevProEnabled,
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
              <OptionList
                options={WEIGHT_CLASS_OPTIONS}
                value={settings.droneWeightClass}
                onSelect={setDroneWeightClass}
                getKey={(id) => id}
              />
            </View>

            {/* Units, Wind, Time, Compass – horizontal OptionList */}
            <View className="mt-2 pt-4 border-t border-border/50">
              <OptionList
                layout="horizontal"
                label="Units"
                iconName="thermometer-outline"
                options={UNITS_OPTIONS}
                value={settings.units}
                onSelect={setUnits}
                getKey={(id) => id}
              />
              <OptionList
                layout="horizontal"
                label="Wind unit"
                iconName="flag-outline"
                options={WIND_OPTIONS}
                value={settings.windUnit}
                onSelect={setWindUnit}
                getKey={(id) => id}
              />
              <OptionList
                layout="horizontal"
                label="Time format"
                iconName="time-outline"
                options={TIME_OPTIONS}
                value={settings.timeFormat}
                onSelect={setTimeFormat}
                getKey={(id) => id}
              />
              <OptionList
                layout="horizontal"
                label="Compass"
                iconName="compass-outline"
                options={COMPASS_OPTIONS}
                value={settings.compassEnabled}
                onSelect={setCompassEnabled}
                getKey={(id) => (id ? "on" : "off")}
              />
              {showDevProToggle && setDevProEnabled ? (
                <OptionList
                  layout="horizontal"
                  label="Pro plan (dev)"
                  iconName="flask-outline"
                  options={COMPASS_OPTIONS}
                  value={devProEnabled}
                  onSelect={setDevProEnabled}
                  getKey={(id) => (id ? "on" : "off")}
                />
              ) : null}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
