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
import { useDevPro, type SimulateProPlan } from "../../contexts/DevProContext";
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

const ICON_SIZE = 18;
const SELECTED_BG = "rgba(255, 198, 130, 0.2)";

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

const SIMULATE_PRO_OPTIONS: { id: SimulateProPlan; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "monthly", label: "Monthly" },
  { id: "lifetime", label: "Lifetime" },
];

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
  const devPro = useDevPro();
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

            {/* Dev: Simulate Pro (simulators / no RevenueCat) */}
            {__DEV__ && devPro && (
              <View className="mb-4 pt-4 border-t border-border/50">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons
                    name="construct-outline"
                    size={ICON_SIZE}
                    color="#64748b"
                  />
                  <Text className="section-label text-slate-500">
                    Development
                  </Text>
                </View>
                <View className="rounded-xl border border-border overflow-hidden">
                  <Text className="text-slate-400 text-xs px-4 pt-2 pb-1">
                    Simulate Pro (simulator)
                  </Text>
                  <View className="flex-row border-t border-border/50">
                    {SIMULATE_PRO_OPTIONS.map((opt) => {
                      const isSelected = devPro.simulatePro === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() => devPro.setSimulatePro(opt.id)}
                          style={[
                            { flex: 1 },
                            isSelected && { backgroundColor: SELECTED_BG },
                          ]}
                          className="py-3 items-center justify-center border-r border-border/50 last:border-r-0 bg-transparent"
                          activeOpacity={0.7}
                        >
                          <Text
                            className={
                              isSelected
                                ? "text-white font-medium text-sm"
                                : "text-slate-400 text-sm"
                            }
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

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
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
