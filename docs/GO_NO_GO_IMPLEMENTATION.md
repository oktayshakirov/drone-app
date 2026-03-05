# Go/No-Go implementation plan and summary

## Overview

The first hero cube now shows an **overall flight condition** (Go / Caution / No Go) instead of the drone image. The logic uses the user’s **drone weight class** from Settings and the thresholds from `docs/DRONE_FLIGHT_CONDITIONS_REFERENCE.md`.

---

## 1. Weight class presets

**File:** `src/constants/droneThresholds.ts`

- **Weight classes:** Sub-250 g, 250 g–500 g, 500 g–1 kg, 1 kg+
- Each preset has:
  - **Wind gust (red):** No-go above this mph. Stricter for lighter (sub-250: 20 mph; 1 kg+: 35 mph).
  - **Visibility (red):** No-go below 1 km (1000 m) for all.
  - **Wind speed (yellow):** Caution above this mph (sub-250: 10 mph; 1 kg+: 20 mph).
  - **Precipitation (yellow):** Caution above 30% (sub-250/250–500) or 40% (500 g+).
- `getThresholdsForWeightClass(id)` returns the thresholds for a given weight class.

---

## 2. Settings and persistence

**Files:** `src/types/settings.ts`, `src/contexts/SettingsContext.tsx`

- **Settings:** New field `droneWeightClass: WeightClassId` (default `"sub250"`).
- **Context:** New `setDroneWeightClass(id)`; value is persisted with existing AsyncStorage logic.

---

## 3. Go/No-Go evaluation

**File:** `src/utils/goNoGo.ts` (unchanged)

- **Red:** Wind gust &gt; threshold **or** visibility &lt; 1 km.
- **Yellow:** Wind speed &gt; threshold **or** precipitation &gt; threshold (and not red).
- **Green:** Otherwise.

Thresholds passed in are from the selected weight class.

---

## 4. Hero summary component

**File:** `src/components/conditions/GoNoGoCard.tsx`

- Cube-sized card showing:
  - **Go** (green): checkmark, `safe-green` styling.
  - **Caution** (yellow): warning icon, `caution-yellow` styling.
  - **No Go** (red): close icon, `danger-red` styling.
- Optional `onPress` opens the info modal for the `flightConditions` metric.

---

## 5. Settings UI

**File:** `src/components/modals/SettingsModal.tsx`

- New **“Drone weight class”** section at the top with the four presets.
- Same list/selection pattern as Units and Wind speed.

---

## 6. App wiring

**File:** `App.tsx`

- `safetyStatus = useMemo(() => evaluateSafety(weather.current, getThresholdsForWeightClass(settings.droneWeightClass)), [weather, settings.droneWeightClass])`.
- First hero cube: `<GoNoGoCard status={safetyStatus} onPress={() => setInfoMetric("flightConditions")} />` (replaces drone image).
- `SettingsModal` receives `setDroneWeightClass`.

---

## 7. Info copy

**File:** `src/constants/metricCopy.ts`

- New key `flightConditions`: short explanation of Go/No-Go and that thresholds depend on the selected weight class in Settings.

---

## Reference

Thresholds and rationale follow **`docs/DRONE_FLIGHT_CONDITIONS_REFERENCE.md`** (wind, gusts, visibility, precipitation). Secondary factors (cloud, temperature, humidity, Kp) can be added later by extending `DroneClassThresholds` and `evaluateSafety`.
