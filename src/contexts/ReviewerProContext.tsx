import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REVIEWER_PRO_KEY = "@dronepal/reviewerProUnlockedAt";
const DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ReviewerProContextValue {
  isReviewerPro: boolean;
  unlockReviewerPro: () => Promise<void>;
}

const ReviewerProContext = createContext<ReviewerProContextValue | null>(null);

export function ReviewerProProvider({ children }: { children: React.ReactNode }) {
  const [unlockedAt, setUnlockedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(REVIEWER_PRO_KEY)
      .then((raw) => {
        const ts = raw ? parseInt(raw, 10) : NaN;
        if (!Number.isNaN(ts)) setUnlockedAt(ts);
      })
      .finally(() => setHydrated(true));
  }, []);

  const isReviewerPro =
    hydrated &&
    unlockedAt != null &&
    Date.now() - unlockedAt < DURATION_MS;

  const unlockReviewerPro = useCallback(async () => {
    const now = Date.now();
    setUnlockedAt(now);
    await AsyncStorage.setItem(REVIEWER_PRO_KEY, String(now));
  }, []);

  return (
    <ReviewerProContext.Provider value={{ isReviewerPro, unlockReviewerPro }}>
      {children}
    </ReviewerProContext.Provider>
  );
}

export function useReviewerPro(): ReviewerProContextValue | null {
  return useContext(ReviewerProContext);
}
