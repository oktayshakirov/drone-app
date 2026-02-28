/**
 * Fetch current Kp index from NOAA Space Weather Prediction Center.
 * Kp is a global geomagnetic index (0–9). Apple WeatherKit does not provide it.
 */

const NOAA_KP_URL = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json";

interface NoaaKpEntry {
  time_tag: string;
  kp_index: number;
  estimated_kp?: number;
  kp?: string;
}

/**
 * Returns the latest Kp index (0–9) or null on failure.
 * Uses the most recent entry in the NOAA 1-minute data.
 */
export async function fetchCurrentKpIndex(): Promise<number | null> {
  try {
    const res = await fetch(NOAA_KP_URL);
    if (!res.ok) return null;
    const data = (await res.json()) as NoaaKpEntry[];
    if (!Array.isArray(data) || data.length === 0) return null;
    const latest = data[data.length - 1];
    const kp = latest?.kp_index;
    return typeof kp === "number" && kp >= 0 && kp <= 9 ? kp : null;
  } catch {
    return null;
  }
}
