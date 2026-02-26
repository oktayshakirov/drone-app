import Constants from "expo-constants";
import type { WeatherKitEnv } from "../api/weatherKit";

/**
 * Read WeatherKit env from app config (app.config.js extra). Set WEATHERKIT_* in .env and load via dotenv in app.config.js if needed.
 */
export function getWeatherKitEnv(): WeatherKitEnv | null {
  const extra = (
    Constants.expoConfig as { extra?: Record<string, string | undefined> }
  )?.extra;
  const teamId = extra?.weatherKitTeamId ?? "";
  const serviceId = extra?.weatherKitServiceId ?? "";
  const keyId = extra?.weatherKitKeyId ?? "";
  const privateKeyPem = extra?.weatherKitPrivateKey ?? "";

  if (!teamId || !serviceId || !keyId || !privateKeyPem) return null;
  // In .env, newlines in the key are often stored as literal \n; normalize to real newlines.
  const normalizedKey = privateKeyPem.replace(/\\n/g, "\n");
  return { teamId, serviceId, keyId, privateKeyPem: normalizedKey };
}
