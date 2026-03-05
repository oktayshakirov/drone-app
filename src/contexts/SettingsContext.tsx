import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Settings,
  Units,
  WindUnit,
  TimeFormat,
  MapType,
} from "../types/settings";
import type { WeightClassId } from "../constants/droneThresholds";
import { DEFAULT_SETTINGS } from "../types/settings";

const SETTINGS_STORAGE_KEY = "@dronepal/settings";

interface SettingsContextValue {
  settings: Settings;
  setUnits: (u: Units) => void;
  setWindUnit: (u: WindUnit) => void;
  setTimeFormat: (t: TimeFormat) => void;
  setCompassEnabled: (enabled: boolean) => void;
  setMapType: (mapType: MapType) => void;
  setDroneWeightClass: (id: WeightClassId) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function mergeWithDefaults(loaded: Partial<Settings> | null): Settings {
  if (!loaded || typeof loaded !== "object") return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...loaded };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      .then((raw) => {
        try {
          const loaded = raw ? (JSON.parse(raw) as Partial<Settings>) : null;
          setSettings(mergeWithDefaults(loaded));
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  const setUnits = useCallback((units: Units) => {
    setSettings((s) => ({ ...s, units }));
  }, []);

  const setWindUnit = useCallback((windUnit: WindUnit) => {
    setSettings((s) => ({ ...s, windUnit }));
  }, []);

  const setTimeFormat = useCallback((timeFormat: TimeFormat) => {
    setSettings((s) => ({ ...s, timeFormat }));
  }, []);

  const setCompassEnabled = useCallback((compassEnabled: boolean) => {
    setSettings((s) => ({ ...s, compassEnabled }));
  }, []);

  const setMapType = useCallback((mapType: MapType) => {
    setSettings((s) => ({ ...s, mapType }));
  }, []);

  const setDroneWeightClass = useCallback((droneWeightClass: WeightClassId) => {
    setSettings((s) => ({ ...s, droneWeightClass }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setUnits,
        setWindUnit,
        setTimeFormat,
        setCompassEnabled,
        setMapType,
        setDroneWeightClass,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
