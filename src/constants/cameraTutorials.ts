import type { ImageSourcePropType } from "react-native";

/**
 * Camera tutorials for common aerial scenarios (normal video + built-in Hyperlapse mode:
 * interval-captured frames assembled to a sped-up clip—not long-exposure photo timelapse).
 * Aligned with:
 * - 180° shutter (shutter ≈ 2× frame rate): https://www.dronesloop.club/blog/nd-filters-101
 * - ND strength chart (ND4–ND64), twilight ISO/shutter: https://rotatepilot.com/guides/drone-photography-guide
 * `access`: free = all users; pro = subscription.
 */

export type CameraTutorialAccess = "free" | "pro";

export interface CameraTutorial {
  id: string;
  title: string;
  iconName: string;
  access: CameraTutorialAccess;
  description?: string;
  iso?: string;
  shutter?: string;
  nd?: string;
  fps?: string;
  exampleImage?: ImageSourcePropType;
}

export const CAMERA_TUTORIALS: CameraTutorial[] = [
  {
    id: "night-hyperlapse",
    iconName: "moon-outline",
    title: "Night Hyperlapse",
    description:
      "Create a smooth, dramatic night motion feel with clean light trails. The goal is a stable, low-light hyperlapse that feels cinematic.",
    access: "free",
    fps: "24fps",
    iso: "600",
    shutter: "1/20",
    nd: "No ND",
    exampleImage: require("../../assets/tutorial-demos/night-hyperlapse.jpg"),
  },
  {
    id: "day-hyperlapse",
    iconName: "videocam-outline",
    title: "Day Hyperlapse",
    description:
      "Compress daytime movement into a fast, energetic sequence. The goal is a clean, flicker-free hyperlapse with natural motion blur.",
    access: "free",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND16–ND32",
    exampleImage: require("../../assets/tutorial-demos/day-hyperlapse.png"),
  },
  {
    id: "golden-hour",
    iconName: "partly-sunny-outline",
    title: "Golden Hour",
    description:
      "Capture warm, soft light with balanced contrast and rich color. The goal is polished cinematic footage with maximum visual depth.",
    access: "free",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND4–ND8",
    exampleImage: require("../../assets/tutorial-demos/golden-hour.jpg"),
  },
  {
    id: "bright-sunny-day",
    iconName: "sunny-outline",
    title: "Bright Sunny Day",
    description:
      "Keep harsh daylight controlled while preserving natural motion blur. The goal is crisp cinematic footage without blown highlights.",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND16–ND32",
    exampleImage: require("../../assets/tutorial-demos/bright-sunny-day.jpg"),
  },
  {
    id: "overcast-light",
    iconName: "cloud-outline",
    title: "Overcast Light",
    description:
      "Use even cloud light for clean exposure and consistent tones. The goal is neutral, usable footage that grades easily.",
    access: "pro",
    fps: "24fps",
    iso: "100–200",
    shutter: "1/50",
    nd: "ND8–ND16",
    exampleImage: require("../../assets/tutorial-demos/overcast-light.jpg"),
  },
  {
    id: "winter-snow",
    iconName: "snow-outline",
    title: "Winter Snow",
    description:
      "Control extreme winter brightness and reflective surfaces. The goal is detailed footage with preserved snow texture and no clipping.",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND32–ND64",
    exampleImage: require("../../assets/tutorial-demos/winter-snow.jpg"),
  },
  {
    id: "blue-hour",
    iconName: "moon-outline",
    title: "Blue Hour",
    description:
      "Capture twilight atmosphere before full night with controlled noise. The goal is moody footage with smooth gradients and city glow.",
    access: "pro",
    fps: "24fps",
    iso: "400–800",
    shutter: "1/30–1/60",
    nd: "ND4 / No ND",
    exampleImage: require("../../assets/tutorial-demos/blue-hour.jpg"),
  },
  {
    id: "city-day-night",
    iconName: "business-outline",
    title: "City Day → Night",
    description:
      "Hold visual consistency through a changing day-to-night scene. The goal is a seamless transition shot without color or exposure jumps.",
    access: "pro",
    fps: "24fps",
    iso: "100–800",
    shutter: "1/50",
    nd: "ND16–ND32 / No ND",
    exampleImage: require("../../assets/tutorial-demos/city-day-night.png"),
  },
  {
    id: "real-estate",
    iconName: "home-outline",
    title: "Real Estate",
    description:
      "Present property shape, layout, and surroundings clearly and professionally. The goal is clean, trustworthy footage that sells the location.",
    access: "pro",
    fps: "30fps",
    iso: "100",
    shutter: "1/60",
    nd: "ND8–ND16",
    exampleImage: require("../../assets/tutorial-demos/real-estate.jpg"),
  },
  {
    id: "landscape-reveal",
    iconName: "triangle-outline",
    title: "Landscape Reveal",
    description:
      "Build scale and drama during a slow reveal movement. The goal is expansive cinematic footage with strong depth and detail.",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND8–ND32",
    exampleImage: require("../../assets/tutorial-demos/landscape-reveal.jpg"),
  },
  {
    id: "water-ocean",
    iconName: "water-outline",
    title: "Water / Ocean",
    description:
      "Render water motion with a premium cinematic look and controlled glare. The goal is smooth, textured footage with clean highlights.",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/50",
    nd: "ND32–ND64",
    exampleImage: require("../../assets/tutorial-demos/water-ocean.jpg"),
  },
  {
    id: "fog-mood",
    iconName: "cloudy-outline",
    title: "Fog Mood",
    description:
      "Preserve atmosphere and soft tonal separation in low-contrast light. The goal is moody footage that stays clear and readable.",
    access: "pro",
    fps: "24fps",
    iso: "100–400",
    shutter: "1/50",
    nd: "No ND",
    exampleImage: require("../../assets/tutorial-demos/fog-mood.jpg"),
  },
  {
    id: "tracking-cars-action",
    iconName: "car-sport-outline",
    title: "Tracking / Action",
    description:
      "Follow fast subjects with clear direction and controlled motion blur. The goal is dynamic action footage that still feels cinematic.",
    access: "pro",
    fps: "60fps",
    iso: "100–400",
    shutter: "1/120",
    nd: "ND8–ND32",
    exampleImage: require("../../assets/tutorial-demos/tracking-cars-action.jpg"),
  },
  {
    id: "night-city-cinematic",
    iconName: "business-outline",
    title: "Night City",
    description:
      "Capture city lights at night while keeping noise under control. The goal is sharp, atmospheric footage with strong light contrast.",
    access: "pro",
    fps: "24fps",
    iso: "800–1600",
    shutter: "1/30–1/60",
    nd: "No ND",
    exampleImage: require("../../assets/tutorial-demos/night-city-cinematic.jpg"),
  },
  {
    id: "sunset-silhouette",
    iconName: "sunny-outline",
    title: "Sunset Silhouette",
    description:
      "Emphasize subject shape against a dramatic sky while protecting highlights. The goal is bold silhouette footage with a strong final frame.",
    access: "pro",
    fps: "24fps",
    iso: "100",
    shutter: "1/100–1/200",
    nd: "ND8–ND16",
    exampleImage: require("../../assets/tutorial-demos/sunset-silhouette.jpg"),
  },
];

export function getCameraTutorialById(id: string): CameraTutorial | undefined {
  return CAMERA_TUTORIALS.find((p) => p.id === id);
}
