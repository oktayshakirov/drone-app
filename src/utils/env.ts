import Constants from "expo-constants";
import type { WeatherKitEnv } from "../api/weatherKit";

/**
 * Read WeatherKit env from app config (app.config.js extra). Set WEATHERKIT_* in .env and load via dotenv in app.config.js if needed.
 */
export function getWeatherKitEnv(): WeatherKitEnv | null {
  const extra = (
    Constants.expoConfig as { extra?: Record<string, string | undefined> }
  )?.extra;
  const teamId = extra?.weatherKitTeamId?.trim() ?? "";
  const serviceId = extra?.weatherKitServiceId?.trim() ?? "";
  const keyId = extra?.weatherKitKeyId?.trim() ?? "";
  const privateKeyPem = extra?.weatherKitPrivateKey ?? "";
  const proxyBaseUrl = extra?.weatherProxyBaseUrl?.trim() ?? "";
  const directEnabled =
    (extra?.weatherDirectEnabled ?? "true").toLowerCase() !== "false";
  const weatherDisabled =
    (extra?.weatherDisabled ?? "false").toLowerCase() === "true";
  const retryMax = Number.parseInt(extra?.weatherRetryMax ?? "3", 10);
  const requestTimeoutMs = Number.parseInt(
    extra?.weatherRequestTimeoutMs ?? "15000",
    10,
  );

  const hasDirectCreds = Boolean(teamId && serviceId && keyId && privateKeyPem);
  const hasProxy = Boolean(proxyBaseUrl);
  if (!hasDirectCreds && !hasProxy) return null;

  // In .env, newlines in the key are often stored as literal \n; normalize to real newlines.
  const normalizedKey = privateKeyPem ? privateKeyPem.replace(/\\n/g, "\n") : "";
  return {
    teamId: hasDirectCreds ? teamId : undefined,
    serviceId: hasDirectCreds ? serviceId : undefined,
    keyId: hasDirectCreds ? keyId : undefined,
    privateKeyPem: hasDirectCreds ? normalizedKey : undefined,
    proxyBaseUrl: hasProxy ? proxyBaseUrl : undefined,
    directEnabled,
    weatherDisabled,
    retryMax: Number.isFinite(retryMax) ? Math.max(0, retryMax) : 3,
    requestTimeoutMs: Number.isFinite(requestTimeoutMs)
      ? Math.max(3000, requestTimeoutMs)
      : 15000,
  };
}
