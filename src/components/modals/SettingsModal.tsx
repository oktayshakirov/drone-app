import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  Alert,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as MailComposer from "expo-mail-composer";
import * as StoreReview from "expo-store-review";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import type { CustomerInfo } from "react-native-purchases";
import type {
  Settings,
  Units,
  WindUnit,
  TimeFormat,
} from "../../types/settings";
import type { WeightClassId } from "../../constants/droneThresholds";
import { WEIGHT_CLASS_OPTIONS } from "../../constants/droneThresholds";
import { ENTITLEMENT_PRO } from "../../constants/revenueCat";
import { OptionList } from "../ui/OptionList";

function getPlanLabel(customerInfo: CustomerInfo | null): string {
  if (!customerInfo?.entitlements?.active) return "Pro";
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PRO];
  if (!entitlement) return "Pro";
  const id = (entitlement as { productIdentifier?: string }).productIdentifier;
  if (id === "lifetime") return "Lifetime";
  if (id === "monthly") return "Monthly";
  return "Pro";
}

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

const APP_STORE_ID = "6760303630";
const ANDROID_PACKAGE = "com.shadev.dronepal";
const RATED_FLAG_KEY = "dronepal_hasRequestedReview";

/** Opens the public store listing where the user can read or leave a review. */
function openStoreListing() {
  const url =
    Platform.OS === "ios"
      ? `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
      : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
  Linking.openURL(url).catch(() => undefined);
}

interface MailOption {
  name: string;
  open: () => Promise<void>;
}

/** Opens the user's default mail handler (or, on Android, the system chooser). */
function openMailto(subject: string, body: string): Promise<void> {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
  return Linking.openURL(mailto);
}

/** Last resort when no mail app exists: let the user copy our address. */
function showCopyAddressFallback() {
  Alert.alert(
    "No email app found",
    `Copy our address and send your message from any email app:\n\n${CONTACT_EMAIL}`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Copy address",
        onPress: () => {
          Clipboard.setStringAsync(CONTACT_EMAIL).catch(() => undefined);
        },
      },
    ],
  );
}

async function sendMail(subject: string, body: string) {
  // Android resolves mailto: to its own app chooser (incl. Gmail), so there's
  // nothing to detect — just open it.
  if (Platform.OS !== "ios") {
    try {
      await openMailto(subject, body);
    } catch {
      showCopyAddressFallback();
    }
    return;
  }

  // iOS: detect installed mail apps, with Gmail prioritized first.
  const enc = (s: string) => encodeURIComponent(s);
  const options: MailOption[] = [];

  // Gmail — note the three-slash "/co" compose path required by the app.
  const gmailUrl = `googlegmail:///co?to=${CONTACT_EMAIL}&subject=${enc(
    subject,
  )}&body=${enc(body)}`;
  try {
    if (await Linking.canOpenURL(gmailUrl)) {
      options.push({ name: "Gmail", open: () => Linking.openURL(gmailUrl) });
    }
  } catch {
    // Ignore detection failure.
  }

  // Outlook
  const outlookUrl = `ms-outlook://compose?to=${CONTACT_EMAIL}&subject=${enc(
    subject,
  )}&body=${enc(body)}`;
  try {
    if (await Linking.canOpenURL(outlookUrl)) {
      options.push({ name: "Outlook", open: () => Linking.openURL(outlookUrl) });
    }
  } catch {
    // Ignore detection failure.
  }

  // Apple Mail — only when an account is configured (so Send actually works).
  try {
    if (await MailComposer.isAvailableAsync()) {
      options.push({
        name: "Apple Mail",
        open: async () => {
          await MailComposer.composeAsync({
            recipients: [CONTACT_EMAIL],
            subject,
            body,
          });
        },
      });
    }
  } catch {
    // Ignore detection failure.
  }

  // No mail app detected: try the default handler, then copy-address fallback.
  if (options.length === 0) {
    try {
      await openMailto(subject, body);
    } catch {
      showCopyAddressFallback();
    }
    return;
  }

  // Exactly one app: open it directly, no need to ask.
  if (options.length === 1) {
    await options[0].open();
    return;
  }

  // Several apps: ask the user which one to use (Gmail listed first).
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: "Send feedback with",
      options: [...options.map((o) => o.name), "Cancel"],
      cancelButtonIndex: options.length,
    },
    (index) => {
      if (index < options.length) {
        options[index].open().catch(() => showCopyAddressFallback());
      }
    },
  );
}

function handleBugReport() {
  sendMail(
    `[Bug Report] DronePal`,
    `Describe the bug:\n\n\nSteps to reproduce:\n1.\n2.\n3.`,
  );
}

function handleFeatureRequest() {
  sendMail(
    `[Feature Request] DronePal`,
    `What feature would you like to see?\n\n\nWhy would this be useful?\n\n`,
  );
}

function handlePartnership() {
  sendMail(
    "[Partnership] DronePal",
    `Hi DronePal team,\n\nI'd like to explore a partnership opportunity.\n\nCompany / Name:\nWebsite:\nProposal:\n\n`,
  );
}

async function handleRateApp() {
  // The native in-app review prompt is silent and rate-limited by the OS: it
  // resolves successfully even when nothing is shown (e.g. the user already
  // rated or the yearly cap is hit), and there is no API to detect that.
  // So we only use it the first time, then fall back to the store listing,
  // which always works and shows the user their existing review if any.
  let alreadyRequested = false;
  try {
    alreadyRequested = (await AsyncStorage.getItem(RATED_FLAG_KEY)) === "1";
  } catch {
    // Treat storage failure as "not requested yet".
  }

  const canPrompt = !alreadyRequested && (await StoreReview.isAvailableAsync());

  if (canPrompt) {
    try {
      await StoreReview.requestReview();
      await AsyncStorage.setItem(RATED_FLAG_KEY, "1");
    } catch {
      openStoreListing();
    }
    return;
  }

  // Already prompted before (or native prompt unavailable): give clear feedback
  // and a reliable way to reach the listing.
  Alert.alert(
    "Thanks for your support! 💛",
    "If you've already rated DronePal, you're awesome. Want to update your review or leave one now?",
    [
      { text: "Not now", style: "cancel" },
      { text: "Open store", onPress: openStoreListing },
    ],
  );
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
  isPro?: boolean;
  revenueCatAvailable?: boolean;
  customerInfo?: CustomerInfo | null;
  onManageInStore?: () => Promise<void>;
  onUpgrade?: () => void;
}

type Tab = "settings" | "connect" | "plan";

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
  isPro = false,
  revenueCatAvailable = false,
  customerInfo = null,
  onManageInStore,
  onUpgrade,
}: SettingsModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<Tab>("settings");

  // Always start on the Settings tab each time the modal opens.
  React.useEffect(() => {
    if (visible) setActiveTab("settings");
  }, [visible]);

  const showPlanTab = revenueCatAvailable;
  const effectiveTab: Tab =
    activeTab === "plan" && !showPlanTab ? "settings" : activeTab;
  const planLabel = getPlanLabel(customerInfo);

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
                {effectiveTab === "settings"
                  ? "Settings"
                  : effectiveTab === "connect"
                    ? "Connect"
                    : "Plan"}
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
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${effectiveTab === "settings" ? "bg-card" : ""}`}
              >
                <Ionicons
                  name="settings-outline"
                  size={15}
                  color={effectiveTab === "settings" ? "#fff" : "#64748b"}
                />
                <Text
                  className={`text-sm font-medium ${effectiveTab === "settings" ? "text-white" : "text-slate-500"}`}
                >
                  Settings
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("connect")}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${effectiveTab === "connect" ? "bg-card" : ""}`}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={15}
                  color={effectiveTab === "connect" ? "#fff" : "#64748b"}
                />
                <Text
                  className={`text-sm font-medium ${effectiveTab === "connect" ? "text-white" : "text-slate-500"}`}
                >
                  Connect
                </Text>
              </Pressable>
              {showPlanTab && (
                <Pressable
                  onPress={() => setActiveTab("plan")}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${effectiveTab === "plan" ? "bg-card" : ""}`}
                >
                  <Ionicons
                    name="card-outline"
                    size={15}
                    color={effectiveTab === "plan" ? "#fff" : "#64748b"}
                  />
                  <Text
                    className={`text-sm font-medium ${effectiveTab === "plan" ? "text-white" : "text-slate-500"}`}
                  >
                    Plan
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Settings tab */}
            {effectiveTab === "settings" && (
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
            {effectiveTab === "connect" && (
              <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
                <View className="mb-6">
                  <Text className="text-slate-500 text-xs mb-3 uppercase tracking-widest font-medium">
                    Feedback
                  </Text>
                  <Pressable
                    onPress={handleBugReport}
                    className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 mb-2 active:opacity-70"
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons name="bug-outline" size={20} color="#f87171" />
                      <Text className="text-white text-sm font-medium">
                        Report a Bug
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#475569"
                    />
                  </Pressable>

                  <Pressable
                    onPress={handleFeatureRequest}
                    className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 active:opacity-70"
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons name="bulb-outline" size={20} color="#facc15" />
                      <Text className="text-white text-sm font-medium">
                        Suggest a Feature
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#475569"
                    />
                  </Pressable>
                </View>

                <View className="mb-6">
                  <Text className="text-slate-500 text-xs mb-3 uppercase tracking-widest font-medium">
                    Community
                  </Text>
                  <Pressable
                    onPress={handleRateApp}
                    className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 mb-2 active:opacity-70"
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons name="star-outline" size={20} color="#fb923c" />
                      <Text className="text-white text-sm font-medium">
                        Rate DronePal
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#475569"
                    />
                  </Pressable>

                  <Pressable
                    onPress={handleTikTok}
                    className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 active:opacity-70"
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons name="logo-tiktok" size={20} color="#94a3b8" />
                      <Text className="text-white text-sm font-medium">
                        Follow us on TikTok
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color="#475569" />
                  </Pressable>
                </View>

                <View className="mb-6">
                  <Text className="text-slate-500 text-xs mb-3 uppercase tracking-widest font-medium">
                    Business
                  </Text>
                  <Pressable
                    onPress={handlePartnership}
                    className="flex-row items-center justify-between bg-muted/40 rounded-xl px-4 py-3 active:opacity-70"
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name="rocket-outline"
                        size={20}
                        color="#818cf8"
                      />
                      <Text className="text-white text-sm font-medium">
                        Work with Us
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#475569"
                    />
                  </Pressable>
                </View>
              </ScrollView>
            )}

            {/* Plan tab */}
            {effectiveTab === "plan" && (
              <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
                <View className="mb-4 py-3 px-4 rounded-xl bg-muted/40 border border-border">
                  <Text className="text-slate-400 text-sm">Current plan</Text>
                  <Text className="text-white font-semibold text-lg mt-0.5">
                    {isPro ? planLabel : "Free"}
                  </Text>
                </View>

                {isPro ? (
                  <>
                    <Pressable
                      onPress={async () => {
                        onClose();
                        await onManageInStore?.();
                      }}
                      className="flex-row items-center gap-3 py-3 px-4 rounded-xl bg-muted/40 border border-border active:opacity-80 mb-6"
                    >
                      <Ionicons name="card-outline" size={22} color="#94a3b8" />
                      <View className="flex-1">
                        <Text className="text-white font-medium">
                          Manage in{" "}
                          {Platform.OS === "ios" ? "App Store" : "Play Store"}
                        </Text>
                        <Text className="text-slate-400 text-sm mt-0.5">
                          Cancel, update payment, or change plan
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#94a3b8"
                      />
                    </Pressable>

                    {planLabel === "Monthly" && (
                      <View className="mb-6 p-4 rounded-xl bg-safe-green/10 border border-safe-green/30">
                        <Text className="text-safe-green font-semibold mb-1">
                          Tip: Save money with Pro Lifetime
                        </Text>
                        <Text className="text-slate-300 text-sm">
                          Pay once and never worry about renewals. Upgrade to
                          Pro Lifetime to lock in your Pro benefits forever.
                        </Text>
                      </View>
                    )}

                    {planLabel === "Lifetime" && (
                      <View className="mb-6 p-4 rounded-xl bg-safe-green/10 border border-safe-green/30">
                        <Text className="text-safe-green font-semibold mb-1">
                          Thank you for supporting DronePal
                        </Text>
                        <Text className="text-slate-300 text-sm">
                          Your Lifetime purchase unlocks Pro benefits forever.
                          You'll also receive any future features and
                          improvements we add to the app at no extra cost.
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onUpgrade?.();
                    }}
                    className="flex-row items-center gap-3 py-3 px-4 rounded-xl bg-muted/40 border border-border active:opacity-80 mb-6"
                  >
                    <Ionicons name="rocket-outline" size={22} color="#FFC682" />
                    <View className="flex-1">
                      <Text className="text-white font-medium">
                        Upgrade to Pro
                      </Text>
                      <Text className="text-slate-400 text-sm mt-0.5">
                        Unlock the full DronePal experience
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#94a3b8"
                    />
                  </Pressable>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </SafeAreaProvider>
    </Modal>
  );
}
