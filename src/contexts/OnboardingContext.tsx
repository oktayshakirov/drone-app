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
      "Drone Pal is your preflight companion. Get an instant Go or No Go for any drone, using live weather and safety data.",
  },
  {
    id: "go-n-go",
    type: "feature",
    title: "One Glance. One Decision.",
    description:
      "We turn wind, gusts, visibility, and rain into a single status. Green means safe to fly. Yellow means use caution. Red means stay grounded. All tuned to your drone’s weight.",
  },
  {
    id: "forecast-map",
    type: "feature",
    title: "No Fly Zone Map",
    description:
      "See airports, heliports, and caution zones at a glance. A simple reference so you stay compliant and fly safe.",
  },
  {
    id: "weight",
    type: "weightClass",
    title: "Pick Your Weight Class",
    description:
      "Not all drones handle wind the same. Under 250g to 1kg plus: we'll set your safety thresholds so alerts match your rig.",
  },
  {
    id: "preferences",
    type: "preferences",
    title: "Your way",
    description: "",
  },
  {
    id: "done",
    type: "feature",
    title: "You’re All Set",
    description:
      "Try Drone Pal Pro for extra features, or fly free. Tap Get Started and fly safe.",
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
