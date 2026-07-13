import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import type { SafetyStatus, WeatherData } from "../types/weather";
import type { WeightClassId } from "../constants/droneThresholds";
import { getThresholdsForWeightClass } from "../constants/droneThresholds";
import { findNextGoTime } from "../utils/goNoGo";
import { formatSunTime } from "../utils/conversions";

const STORAGE_KEY = "dronepal_goNotifyRequest";
const ANDROID_CHANNEL_ID = "go-alerts";

interface StoredRequest {
  notificationId: string | null;
  /** Epoch ms the notification is scheduled for (null = no Go window found yet). */
  scheduledAt: number | null;
}

// Show Go alerts as banners when the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.granted) return true;
  }
  Alert.alert(
    "Notifications disabled",
    "To get a Go alert, allow notifications for DronePal in your device settings.",
  );
  return false;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Go alerts",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function cancelScheduled(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already fired or removed.
  }
}

/** Schedule the Go notification for the next forecast green hour. Returns what was stored. */
async function scheduleGoNotification(
  weather: WeatherData,
  weightClass: WeightClassId,
): Promise<StoredRequest> {
  const thresholds = getThresholdsForWeightClass(weightClass);
  const next = findNextGoTime(weather.hourly, thresholds);
  if (!next) return { notificationId: null, scheduledAt: null };
  await ensureAndroidChannel();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "It's a Go ✅",
      body: "Forecast looks good for flying around this time. Open DronePal to confirm current conditions.",
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: next,
    },
  });
  return { notificationId, scheduledAt: next.getTime() };
}

interface UseGoNotificationArgs {
  weather: WeatherData | null;
  status: SafetyStatus;
  droneWeightClass: WeightClassId;
  use24h: boolean;
}

/**
 * "Notify me when it's Go": user arms a one-shot local notification while
 * conditions are yellow/red; we schedule it for the next forecast green hour
 * and reschedule whenever the weather refreshes. Permission is requested
 * lazily on first use (not during onboarding).
 */
export function useGoNotification({
  weather,
  status,
  droneWeightClass,
  use24h,
}: UseGoNotificationArgs) {
  const [notifyArmed, setNotifyArmed] = useState(false);
  const storedRef = useRef<StoredRequest>({ notificationId: null, scheduledAt: null });
  const loadedRef = useRef(false);

  const persist = useCallback(async (armed: boolean, stored: StoredRequest) => {
    storedRef.current = stored;
    try {
      if (armed) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Persistence is best-effort.
    }
  }, []);

  const disarm = useCallback(async () => {
    setNotifyArmed(false);
    await cancelScheduled(storedRef.current.notificationId);
    await persist(false, { notificationId: null, scheduledAt: null });
  }, [persist]);

  // Restore a pending request on mount; treat an elapsed schedule as delivered.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        loadedRef.current = true;
        if (!raw || cancelled) return;
        const stored = JSON.parse(raw) as StoredRequest;
        if (stored.scheduledAt != null && stored.scheduledAt <= Date.now()) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }
        storedRef.current = stored;
        setNotifyArmed(true);
      } catch {
        loadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The one-shot fired while the app is open: request fulfilled.
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      if (notifyArmed) void disarm();
    });
    return () => sub.remove();
  }, [notifyArmed, disarm]);

  // Conditions turned green while the user is looking at the app: request fulfilled.
  useEffect(() => {
    if (notifyArmed && status === "green" && weather) {
      void disarm();
    }
  }, [notifyArmed, status, weather, disarm]);

  // Reschedule silently whenever the forecast or drone class changes.
  useEffect(() => {
    if (!notifyArmed || !weather || !loadedRef.current) return;
    let cancelled = false;
    (async () => {
      await cancelScheduled(storedRef.current.notificationId);
      const stored = await scheduleGoNotification(weather, droneWeightClass);
      if (!cancelled) await persist(true, stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [notifyArmed, weather, droneWeightClass, persist]);

  const toggleGoNotification = useCallback(async () => {
    if (notifyArmed) {
      await disarm();
      return;
    }
    if (!weather) return;
    const granted = await ensurePermission();
    if (!granted) return;
    const stored = await scheduleGoNotification(weather, droneWeightClass);
    setNotifyArmed(true);
    await persist(true, stored);
    if (stored.scheduledAt != null) {
      Alert.alert(
        "Go alert set",
        `Forecast turns Go around ${formatSunTime(new Date(stored.scheduledAt).toISOString(), use24h)}. We'll notify you then.`,
      );
    } else {
      Alert.alert(
        "Go alert set",
        "No Go window in the next 24 h forecast yet. We'll keep watching and update the alert when conditions refresh.",
      );
    }
  }, [notifyArmed, weather, droneWeightClass, use24h, disarm, persist]);

  return { notifyArmed, toggleGoNotification };
}
