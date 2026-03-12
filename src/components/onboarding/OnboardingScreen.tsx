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

const ACCENT = "#f3e8db";
const SELECTED_BG = "#f3e8db";
const SELECTED_TEXT = "#1e293b";

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
      return "checkmark-done-circle";
    case "forecast-map":
      return "map";
    case "weight":
      return "fitness";
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
  const { settings, setUnits, setWindUnit, setTimeFormat, setDroneWeightClass } =
    useSettings();

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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!isSettingsStep && (
            <View style={styles.iconContainer}>
              {stepData.id === "welcome" ? (
                <Image
                  source={require("../../../assets/splash-icon.png")}
                  style={styles.splashIcon}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.iconCircle}>
                  <Ionicons
                    name={getStepIcon(stepData.id)}
                    size={56}
                    color="#ffffff"
                  />
                </View>
              )}
            </View>
          )}

          <Text style={styles.title}>{stepData.title}</Text>
          <Text style={styles.description}>{stepData.description}</Text>

          {stepData.type === "weightClass" && (
            <View style={styles.pickerBlock}>
              {WEIGHT_CLASS_OPTIONS.map((opt) => {
                const isSelected = settings.droneWeightClass === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setDroneWeightClass(opt.id as WeightClassId)}
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {stepData.type === "preferences" && (
            <View style={styles.preferencesBlock}>
              <Text style={styles.preferencesLabel}>Units</Text>
              <View style={styles.pickerRow}>
                {UNITS_OPTIONS.map((opt) => {
                  const isSelected = settings.units === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setUnits(opt.id)}
                      style={[
                        styles.optionBox,
                        isSelected && styles.optionBoxSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionBoxText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.preferencesLabel}>Wind speed</Text>
              <View style={styles.pickerRow}>
                {WIND_OPTIONS.map((opt) => {
                  const isSelected = settings.windUnit === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setWindUnit(opt.id)}
                      style={[
                        styles.optionBoxSmall,
                        isSelected && styles.optionBoxSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionBoxText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.preferencesLabel}>Time format</Text>
              <View style={styles.pickerRow}>
                {TIME_OPTIONS.map((opt) => {
                  const isSelected = settings.timeFormat === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setTimeFormat(opt.id)}
                      style={[
                        styles.optionBox,
                        isSelected && styles.optionBoxSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionBoxText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(243, 232, 219, 0.25)",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
    paddingHorizontal: 4,
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
    gap: 10,
    marginBottom: 24,
  },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
  },
  optionRowSelected: {
    backgroundColor: SELECTED_BG,
    borderColor: SELECTED_BG,
  },
  optionText: {
    fontSize: 16,
    color: "#e2e8f0",
  },
  optionTextSelected: {
    color: SELECTED_TEXT,
    fontWeight: "600",
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
    justifyContent: "center",
  },
  optionBox: {
    minWidth: "45%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    alignItems: "center",
  },
  optionBoxSmall: {
    minWidth: "22%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    alignItems: "center",
  },
  optionBoxSelected: {
    backgroundColor: SELECTED_BG,
    borderColor: SELECTED_BG,
  },
  optionBoxText: {
    fontSize: 15,
    color: "#e2e8f0",
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
