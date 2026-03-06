import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TRACKING_CONSENT_KEY = "trackingConsent";

/** Reads stored consent; until a consent UI exists, ads use non-personalized by default. */
export function useAdConsent() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(TRACKING_CONSENT_KEY).then((stored) => {
      setConsent((stored as "granted" | "denied" | null) ?? null);
    });
  }, []);

  return {
    consent,
    requestNonPersonalizedAdsOnly: consent !== "granted",
  };
}
