import { requireOptionalNativeModule } from "expo-modules-core";
import type { SafetyStatus } from "../../src/types/weather";

interface GoNoGoWidgetNativeModule {
  update(status: string, label: string): void;
}

const nativeModule =
  requireOptionalNativeModule<GoNoGoWidgetNativeModule>("GoNoGoWidget");

/**
 * Push the current Go/No-Go status to the home screen widget
 * (iOS App Group + WidgetKit reload / Android SharedPreferences + AppWidget update).
 * No-op when the native module isn't available (e.g. Expo Go).
 */
export function updateGoNoGoWidget(status: SafetyStatus, label: string): void {
  try {
    nativeModule?.update(status, label);
  } catch {
    // Widget updates are best-effort; never break the app over them.
  }
}
