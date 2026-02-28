import { useState, useEffect } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

/**
 * Subscribes to device compass heading (0–360°, 0 = North).
 * Uses trueHeading when available (iOS), else magHeading. Works on iOS and Android.
 * Pass enabled: false to avoid subscribing (e.g. when setting is off). Returns null on web or when disabled.
 */
export function useDeviceHeading(enabled = true): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (
      (Platform.OS !== "ios" && Platform.OS !== "android") ||
      !enabled
    ) {
      if (!enabled) setHeading(null);
      return;
    }

    let subscription: { remove: () => void } | null = null;

    const startWatching = async () => {
      try {
        const sub = await Location.watchHeadingAsync((data) => {
          const h =
            data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
          setHeading(h);
        });
        subscription = sub;
      } catch {
        setHeading(null);
      }
    };

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, [enabled]);

  return enabled ? heading : null;
}
