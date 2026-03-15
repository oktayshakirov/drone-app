import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useSettings } from "../../contexts/SettingsContext";
import { WEIGHT_CLASS_OPTIONS } from "../../constants/droneThresholds";
import type { Units, WindUnit, TimeFormat } from "../../types/settings";
import type { WeightClassId } from "../../constants/droneThresholds";
import { OptionList } from "../ui/OptionList";

const ACCENT = "#FFC682";
const STATUS_GREEN_COLOR = "#22c55e";
const STATUS_YELLOW_COLOR = "#eab308";
const STATUS_RED_COLOR = "#ef4444";

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

function getStepIcon(stepId: string): keyof typeof Ionicons.glyphMap {
  switch (stepId) {
    case "go-n-go":
      return "flag-outline";
    case "forecast-map":
      return "map";
    case "weight":
      return "scale-outline";
    case "preferences":
      return "options-outline";
    case "done":
      return "rocket-outline";
    default:
      return "airplane";
  }
}

export function OnboardingScreen() {
  const {
    isOnboardingActive,
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    getCurrentStepData,
  } = useOnboarding();
  const {
    settings,
    setUnits,
    setWindUnit,
    setTimeFormat,
    setDroneWeightClass,
  } = useSettings();

  const stepData = getCurrentStepData();

  if (!isOnboardingActive || !stepData) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isSettingsStep = stepData.type !== "feature";

  const handleNext = () => {
    if (isLastStep) completeOnboarding();
    else nextStep();
  };

  return (
    <View style={styles.overlay}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={skipOnboarding}
            style={styles.skipButton}
            hitSlop={12}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            stepData.id === "done" && styles.scrollContentCentered,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {stepData.type !== "preferences" && (
            <View style={styles.iconContainer}>
              {stepData.id === "welcome" ? (
                <Image
                  source={require("../../../assets/splash-icon.png")}
                  style={styles.splashIcon}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons
                  name={getStepIcon(stepData.id)}
                  size={80}
                  color={ACCENT}
                />
              )}
            </View>
          )}

          <Text style={styles.title}>{stepData.title}</Text>
          {stepData.description ? (
            <Text style={styles.description}>{stepData.description}</Text>
          ) : null}

          {stepData.id === "go-n-go" && (
            <View style={styles.statusIndicators}>
              <View style={styles.statusIndicatorItem}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_GREEN_COLOR },
                  ]}
                />
                <Text style={styles.statusLabel}>Go</Text>
                <Text style={styles.statusSublabel}>Safe to fly</Text>
              </View>
              <View style={styles.statusIndicatorItem}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_YELLOW_COLOR },
                  ]}
                />
                <Text style={styles.statusLabel}>Caution</Text>
                <Text style={styles.statusSublabel}>Check first</Text>
              </View>
              <View style={styles.statusIndicatorItem}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_RED_COLOR },
                  ]}
                />
                <Text style={styles.statusLabel}>No go</Text>
                <Text style={styles.statusSublabel}>Do not fly</Text>
              </View>
            </View>
          )}

          {stepData.id === "forecast-map" && (
            <View style={styles.noFlyVisual}>
              <View style={styles.noFlyZoneItem}>
                <View
                  style={[
                    styles.noFlyBubble,
                    { backgroundColor: "rgba(239, 68, 68, 0.35)" },
                  ]}
                >
                  <Text style={styles.noFlyEmoji}>✈️</Text>
                </View>
                <Text style={styles.noFlyZoneLabel}>Airports</Text>
                <Text style={styles.noFlyZoneSublabel}>Restricted</Text>
              </View>
              <View style={styles.noFlyZoneItem}>
                <View
                  style={[
                    styles.noFlyBubble,
                    { backgroundColor: "rgba(236, 72, 153, 0.35)" },
                  ]}
                >
                  <Text style={styles.noFlyEmoji}>🚁</Text>
                </View>
                <Text style={styles.noFlyZoneLabel}>Heliports</Text>
                <Text style={styles.noFlyZoneSublabel}>Restricted</Text>
              </View>
              <View style={styles.noFlyZoneItem}>
                <View
                  style={[
                    styles.noFlyBubble,
                    { backgroundColor: "rgba(234, 179, 8, 0.35)" },
                  ]}
                >
                  <Text style={styles.noFlyEmoji}>⚠️</Text>
                </View>
                <Text style={styles.noFlyZoneLabel}>Caution</Text>
                <Text style={styles.noFlyZoneSublabel}>Check rules</Text>
              </View>
            </View>
          )}

          {stepData.type === "weightClass" && (
            <View style={styles.pickerBlock}>
              <OptionList
                options={WEIGHT_CLASS_OPTIONS}
                value={settings.droneWeightClass}
                onSelect={(id) => setDroneWeightClass(id as WeightClassId)}
                getKey={(id) => id}
              />
            </View>
          )}

          {stepData.type === "preferences" && (
            <View style={styles.preferencesBlock}>
              <Text style={styles.preferencesLabel}>Units</Text>
              <OptionList
                options={UNITS_OPTIONS}
                value={settings.units}
                onSelect={setUnits}
                getKey={(id) => id}
              />
              <Text style={styles.preferencesLabel}>Wind speed</Text>
              <OptionList
                options={WIND_OPTIONS}
                value={settings.windUnit}
                onSelect={setWindUnit}
                getKey={(id) => id}
              />
              <Text style={styles.preferencesLabel}>Time format</Text>
              <OptionList
                options={TIME_OPTIONS}
                value={settings.timeFormat}
                onSelect={setTimeFormat}
                getKey={(id) => id}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.dots}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          {!isFirstStep && (
            <TouchableOpacity
              onPress={previousStep}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={24} color="#94a3b8" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.primaryButton,
              isFirstStep && styles.primaryButtonFull,
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isLastStep ? "Get Started" : "Next"}
            </Text>
            {!isLastStep && (
              <Ionicons name="chevron-forward" size={20} color="#000" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.stepCounter}>
          {currentStep + 1} of {totalSteps}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 10000,
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  splashIcon: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  description: {
    fontSize: 18,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 27,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  statusIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  statusIndicatorItem: {
    flex: 1,
    alignItems: "center",
    maxWidth: 100,
  },
  statusDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 2,
  },
  statusSublabel: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  noFlyVisual: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  noFlyZoneItem: {
    flex: 1,
    alignItems: "center",
    maxWidth: 100,
  },
  noFlyBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  noFlyEmoji: {
    fontSize: 26,
  },
  noFlyZoneLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 2,
    textAlign: "center",
  },
  noFlyZoneSublabel: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
  },
  preferencesBlock: {
    marginBottom: 24,
    gap: 16,
  },
  preferencesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 6,
    marginTop: 4,
  },
  pickerBlock: {
    marginBottom: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#334155",
  },
  dotActive: {
    width: 24,
    backgroundColor: ACCENT,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 4,
  },
  backText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "500",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: ACCENT,
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "600",
  },
  stepCounter: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 13,
    marginBottom: 16,
  },
});
