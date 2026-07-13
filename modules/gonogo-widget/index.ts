import { requireOptionalNativeModule } from "expo-modules-core";
import type { SafetyStatus } from "../../src/types/weather";

interface GoNoGoWidgetNativeModule {
  update(status: string, label: string, isPro: boolean): void;
}

const nativeModule =
  requireOptionalNativeModule<GoNoGoWidgetNativeModule>("GoNoGoWidget");

/**
 * Push the current Go/No-Go status to the home screen widget
 * (iOS App Group + WidgetKit reload / Android SharedPreferences + AppWidget update).
 * The widget is a Pro feature: when `isPro` is false the widget shows an
 * "Upgrade to Pro" placeholder instead of the status.
 * No-op when the native module isn't available (e.g. Expo Go).
 */
export function updateGoNoGoWidget(
  status: SafetyStatus,
  label: string,
  isPro: boolean,
): void {
  try {
    nativeModule?.update(status, label, isPro);
  } catch {
    // Widget updates are best-effort; never break the app over them.
  }
}
