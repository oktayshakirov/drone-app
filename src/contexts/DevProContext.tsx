import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEV_SIMULATE_PRO_KEY = "@dronepal/devSimulatePro";

export type SimulateProPlan = "off" | "monthly" | "lifetime";

interface DevProContextValue {
  simulatePro: SimulateProPlan;
  setSimulatePro: (plan: SimulateProPlan) => void;
}

const DevProContext = createContext<DevProContextValue | null>(null);

export function DevProProvider({ children }: { children: React.ReactNode }) {
  const [simulatePro, setSimulateProState] = useState<SimulateProPlan>("off");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DEV_SIMULATE_PRO_KEY)
      .then((raw) => {
        if (raw === "monthly" || raw === "lifetime" || raw === "off") {
          setSimulateProState(raw);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(DEV_SIMULATE_PRO_KEY, simulatePro);
  }, [hydrated, simulatePro]);

  const setSimulatePro = useCallback((plan: SimulateProPlan) => {
    setSimulateProState(plan);
  }, []);

  return (
    <DevProContext.Provider value={{ simulatePro, setSimulatePro }}>
      {children}
    </DevProContext.Provider>
  );
}

export function useDevPro(): DevProContextValue | null {
  return useContext(DevProContext);
}
