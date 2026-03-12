import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type OnboardingStepType = "feature" | "weightClass" | "preferences";

export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title: string;
  description: string;
}

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => void;
  getCurrentStepData: () => OnboardingStep | null;
  isFirstTime: boolean;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

interface OnboardingProviderProps {
  children: React.ReactNode;
  /** Called when user completes onboarding (e.g. to show paywall). */
  onComplete?: () => void | Promise<void>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    type: "feature",
    title: "Welcome to Drone Pal",
    description:
      "Your weather and safety companion for drone flying. Get Go/No-Go conditions, forecasts, and no-fly zones at a glance.",
  },
  {
    id: "go-n-go",
    type: "feature",
    title: "Go / No-Go at a Glance",
    description:
      "We combine wind, gusts, visibility, and precipitation into a simple green, yellow, or red status—tailored to your drone’s weight class.",
  },
  {
    id: "forecast-map",
    type: "feature",
    title: "Forecast & No-Fly Map",
    description:
      "See 24h forecasts for wind, cloud cover, and precipitation. Check the map for airports and caution zones before you fly.",
  },
  {
    id: "weight",
    type: "weightClass",
    title: "Your Drone Weight Class",
    description:
      "Lighter drones need stricter limits. This sets your Go/No-Go thresholds.",
  },
  {
    id: "preferences",
    type: "preferences",
    title: "Your Preferences",
    description:
      "Choose units, wind speed, and time format for how conditions are displayed.",
  },
  {
    id: "done",
    type: "feature",
    title: "You’re All Set",
    description:
      "Drone Pal Pro includes many useful features - give it a try if you’d like, or use the app for free. Tap Get Started to continue. Safe flight!",
  },
];

const ONBOARDING_KEY = "@dronepal/onboarding_completed";

export function OnboardingProvider({
  children,
  onComplete,
}: OnboardingProviderProps) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const totalSteps = ONBOARDING_STEPS.length;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((completed) => {
        if (cancelled) return;
        if (!completed || completed !== "true") {
          setIsFirstTime(true);
          setIsOnboardingActive(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsOnboardingActive(false);
      setCurrentStep(0);
      setIsFirstTime(false);
      await onComplete?.();
    } catch {
      setIsOnboardingActive(false);
    }
  }, [onComplete]);

  const skipOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsOnboardingActive(false);
      setCurrentStep(0);
      setIsFirstTime(false);
    } catch {
      setIsOnboardingActive(false);
    }
  }, []);

  const getCurrentStepData = useCallback((): OnboardingStep | null => {
    return ONBOARDING_STEPS[currentStep] ?? null;
  }, [currentStep]);

  const value: OnboardingContextType = {
    isOnboardingActive,
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    getCurrentStepData,
    isFirstTime,
    isLoading,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
