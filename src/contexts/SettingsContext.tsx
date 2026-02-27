import React, { createContext, useContext, useState, useCallback } from "react";
import type { Settings, Units, WindUnit, TimeFormat } from "../types/settings";
import { DEFAULT_SETTINGS } from "../types/settings";

interface SettingsContextValue {
  settings: Settings;
  setUnits: (u: Units) => void;
  setWindUnit: (u: WindUnit) => void;
  setTimeFormat: (t: TimeFormat) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const setUnits = useCallback((units: Units) => {
    setSettings((s) => ({ ...s, units }));
  }, []);

  const setWindUnit = useCallback((windUnit: WindUnit) => {
    setSettings((s) => ({ ...s, windUnit }));
  }, []);

  const setTimeFormat = useCallback((timeFormat: TimeFormat) => {
    setSettings((s) => ({ ...s, timeFormat }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, setUnits, setWindUnit, setTimeFormat }}
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
