import React from "react";
import { Modal, View, Text, Pressable, ScrollView, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as MailComposer from "expo-mail-composer";
import * as StoreReview from "expo-store-review";
import Constants from "expo-constants";
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

const CONTACT_EMAIL = "drone-pal@oktayshakirov.com";
const TIKTOK_URL = "https://www.tiktok.com/@drone.pal";
const APP_VERSION = Constants.expoConfig?.version ?? "—";

async function sendMail(subject: string, body: string) {
  const available = await MailComposer.isAvailableAsync();
  if (!available) {
    Alert.alert(
      "No mail app found",
      `Please email us at ${CONTACT_EMAIL}`,
      [{ text: "OK" }]
    );
    return;
  }
  await MailComposer.composeAsync({ recipients: [CONTACT_EMAIL], subject, body });
}

function handleBugReport() {
  sendMail(
    `[Bug Report] DronePal v${APP_VERSION}`,
    `Describe the bug:\n\n\nSteps to reproduce:\n1.\n2.\n3.\n\nExpected behavior:\n\nActual behavior:\n\n--- App info ---\nVersion: ${APP_VERSION}\n`
  );
}

function handleFeatureRequest() {
  sendMail(
    `[Feature Request] DronePal v${APP_VERSION}`,
    `What feature would you like to see?\n\n\nWhy would this be useful?\n\n`
  );
}

function handlePartnership() {
  sendMail(
    "[Partnership] DronePal",
    `Hi DronePal team,\n\nI'd like to explore a partnership opportunity.\n\nCompany / Name:\nWebsite:\nProposal:\n\n`
  );
}

async function handleRateApp() {
  const available = await StoreReview.isAvailableAsync();
  if (available) {
    await StoreReview.requestReview();
  } else {
    Alert.alert("Rate DronePal", "Thanks for your support! Find us on the App Store or Google Play to leave a review.");
  }
}

function handleTikTok() {
  Linking.openURL(TIKTOK_URL);
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
  showDevProToggle?: boolean;
  devProEnabled?: boolean;
  setDevProEnabled?: (enabled: boolean) => void;
}

type Tab = "settings" | "connect";

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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<Tab>("settings");

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-card border-t border-border rounded-t-3xl max-h-[85%]"
          style={{ paddingBottom: insets.bottom }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View className="w-12 h-1 bg-slate-600 rounded-full self-center mt-3 mb-1" />

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
            <Text className="text-white text-lg font-semibold">
              {activeTab === "settings" ? "Settings" : "Connect"}
            </Text>
            <Pressable
              onPress={onClose}
              className="p-2 -m-2 rounded-lg active:opacity-70"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Tab bar */}
          <View className="flex-row mx-4 mb-4 bg-muted/40 rounded-xl p-1">
            <Pressable
              onPress={() => setActiveTab("settings")}
              className={`flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg ${activeTab === "settings" ? "bg-card" : ""}`}
            >
              <Ionicons name="settings-outline" size={15} color={activeTab === "settings" ? "#fff" : "#64748b"} />
              <Text className={`text-sm font-medium ${activeTab === "settings" ? "text-white" : "text-slate-500"}`}>
                Settings
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("connect")}
              className={`flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg ${activeTab === "connect" ? "bg-card" : ""}`}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={activeTab === "connect" ? "#fff" : "#64748b"} />
              <Text className={`text-sm font-medium ${activeTab === "connect" ? "text-white" : "text-slate-500"}`}>
                Connect
              </Text>
            </Pressable>
          </View>

          {/* Settings tab */}
          {activeTab === "settings" && (
            <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
              <View className="mb-6">
                <OptionList
                  layout="horizontal"
                  label="Drone weight class"
                  iconName="airplane-outline"
                  options={WEIGHT_CLASS_OPTIONS}
                  value={settings.droneWeightClass}
                  onSelect={setDroneWeightClass}
                  getKey={(id) => id}
                />
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
          )}

          {/* Connect tab */}
          {activeTab === "connect" && (
            <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
              <View className="mb-6">
                <Text className="text-slate-500 text-xs mb-3 uppercase tracking-widest font-medium">Feedback</Text>
                <Pressable
                  onPress={handleBugReport}
                  className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 mb-2 active:opacity-70"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="bug-outline" size={20} color="#f87171" />
                    <Text className="text-white text-sm font-medium">Report a Bug</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </Pressable>

                <Pressable
                  onPress={handleFeatureRequest}
                  className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 active:opacity-70"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="bulb-outline" size={20} color="#facc15" />
                    <Text className="text-white text-sm font-medium">Suggest a Feature</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </Pressable>
              </View>

              <View className="mb-6">
                <Text className="text-slate-500 text-xs mb-3 uppercase tracking-widest font-medium">Community</Text>
                <Pressable
                  onPress={handleRateApp}
                  className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 mb-2 active:opacity-70"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="star-outline" size={20} color="#fb923c" />
                    <Text className="text-white text-sm font-medium">Rate DronePal</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </Pressable>

                <Pressable
                  onPress={handleTikTok}
                  className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 active:opacity-70"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="logo-tiktok" size={20} color="#94a3b8" />
                    <Text className="text-white text-sm font-medium">Follow us on TikTok</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color="#475569" />
                </Pressable>
              </View>

              <View className="mb-6">
                <Text className="text-slate-500 text-xs mb-3 uppercase tracking-widest font-medium">Business</Text>
                <Pressable
                  onPress={handlePartnership}
                  className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 active:opacity-70"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="rocket-outline" size={20} color="#818cf8" />
                    <Text className="text-white text-sm font-medium">Work with Us</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </Pressable>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
      </SafeAreaProvider>
    </Modal>
  );
}
