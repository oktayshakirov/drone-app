/**
 * Camera presets for common aerial scenarios (normal video + built-in Hyperlapse mode:
 * interval-captured frames assembled to a sped-up clip—not long-exposure photo timelapse).
 * Aligned with:
 * - 180° shutter (shutter ≈ 2× frame rate): https://www.dronesloop.club/blog/nd-filters-101
 * - ND strength chart (ND4–ND64), WB, twilight ISO/shutter: https://rotatepilot.com/guides/drone-photography-guide
 * `access`: free = all users; pro = subscription.
 */

export type CameraPresetAccess = "free" | "pro";

export interface CameraPreset {
  id: string;
  title: string;
  emoji: string;
  access: CameraPresetAccess;
  iso?: string;
  shutter?: string;
  nd?: string;
  wb?: string;
  fps?: string;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: "night-hyperlapse",
    emoji: "🌙",
    title: "Night Hyperlapse",
    access: "free",
    fps: "24fps",
    iso: "800",
    shutter: "1/30",
    nd: "No ND",
    wb: "3200–4000K",
  },
  {
    id: "day-hyperlapse",
    emoji: "🎥",
    title: "Day Hyperlapse",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND16–ND32",
    wb: "5500K",
  },
  {
    id: "golden-hour-cinematic",
    emoji: "🌇",
    title: "Golden Hour Cinematic",
    access: "free",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND4–ND8",
    wb: "3200–4000K",
  },
  {
    id: "bright-sunny-day",
    emoji: "☀️",
    title: "Bright Sunny Day",
    access: "free",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND16–ND32",
    wb: "5500–5800K",
  },
  {
    id: "overcast-flat",
    emoji: "☁️",
    title: "Overcast / Flat Light",
    access: "pro",
    fps: "24fps",
    iso: "100–200",
    shutter: "1/50",
    nd: "ND8–ND16",
    wb: "6000–6500K",
  },
  {
    id: "snow-winter-bright",
    emoji: "❄️",
    title: "Snow / Bright Winter",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND32–ND64",
    wb: "6000–6500K",
  },
  {
    id: "blue-hour",
    emoji: "🌌",
    title: "Blue Hour",
    access: "pro",
    fps: "24fps",
    iso: "400–800",
    shutter: "1/30–1/60",
    nd: "ND4 / No ND",
    wb: "4500K",
  },
  {
    id: "city-flyover-day-night",
    emoji: "🌆",
    title: "City Flyover (Day → Night)",
    access: "pro",
    fps: "24fps",
    iso: "100–800",
    shutter: "1/50",
    nd: "ND16–ND32 / No ND",
    wb: "Manual",
  },
  {
    id: "real-estate",
    emoji: "🏡",
    title: "Real Estate",
    access: "pro",
    fps: "30fps",
    iso: "100",
    shutter: "1/60",
    nd: "ND8–ND16",
    wb: "5500–6500K",
  },
  {
    id: "landscape-epic-reveal",
    emoji: "🏔️",
    title: "Landscape / Reveal",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND8–ND32",
    wb: "5500K",
  },
  {
    id: "water-ocean",
    emoji: "🌊",
    title: "Water / Ocean",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND32–ND64",
    wb: "5500K",
  },
  {
    id: "fog-moody",
    emoji: "🌁",
    title: "Fog / Low Contrast",
    access: "pro",
    fps: "24fps",
    iso: "100–400",
    shutter: "1/50",
    nd: "No ND",
    wb: "5500–6000K",
  },
  {
    id: "tracking-cars-action",
    emoji: "🚗",
    title: "Tracking / Action",
    access: "pro",
    fps: "60fps",
    iso: "100–400",
    shutter: "1/120",
    nd: "ND8–ND32",
    wb: "5500K",
  },
  {
    id: "night-city-cinematic",
    emoji: "🌃",
    title: "Night City",
    access: "pro",
    fps: "24fps",
    iso: "800–1600",
    shutter: "1/30–1/60",
    nd: "No ND",
    wb: "3800–4500K",
  },
  {
    id: "sunset-silhouette",
    emoji: "🌅",
    title: "Sunset Silhouette",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/100–1/200",
    nd: "ND8–ND16",
    wb: "Manual",
  },
];

export function getCameraPresetById(id: string): CameraPreset | undefined {
  return CAMERA_PRESETS.find((p) => p.id === id);
}
