# Drone weight classes and flight condition thresholds – research summary

This document summarizes research used to set Go/No-Go thresholds per weight class. Values are **general estimates** for consumer/hobby drones; actual limits depend on manufacturer specs, pilot skill, and local rules.

---

## 1. Weight class definitions

We use four classes aligned with common and regulatory practice:

| Class ID    | Label        | Typical use / reference                    |
|------------|--------------|--------------------------------------------|
| **sub250** | Sub-250 g    | EASA C0, FAA “micro”; e.g. DJI Mini 2/3, Mini 3 Pro |
| **250_500**| 250 g – 500 g| Between C0 and C1; light consumer          |
| **500_1000**| 500 g – 1 kg | EASA C1 (≤900 g); e.g. DJI Air 3, Mavic 3 Pro (~958 g) |
| **1000_plus**| 1 kg+      | EASA C2 (up to 4 kg); larger consumer/prosumer |

*Sources: EASA Open Category (C0 &lt;250 g, C1 ≤900 g, C2 ≤4 kg); FAA/country rules; common market segments.*

---

## 2. Wind speed (sustained) – caution threshold

- **Sub-250 g:** Manufacturer max ~10 m/s (22–24 mph), Beaufort 5. Conservative “safe” guidance for Mini series: stay below ~15 mph. **Caution above 10 mph** keeps a clear margin.
- **250–500 g:** Between Mini and C1. **Caution above 12 mph.**
- **500 g–1 kg:** Models like Mavic 3 Pro rated ~12 m/s (27 mph). **Caution above 15 mph** for margin.
- **1 kg+:** Larger rigs often 12–15 m/s+. **Caution above 20 mph.**

*Sources: DJI Mini 2/3/3 Pro specs (Level 5, ~10–10.7 m/s); DJI Mavic 3 Pro 12 m/s; “Drone Pilot’s Guide to Wind Speed” (15–20 mph recreational &lt;1 kg); Beaufort 5 = 19–24 mph.*

---

## 3. Wind gusts – no-go threshold

Gusts are more dangerous than sustained wind; limits are set lower than “max wind” specs.

- **Sub-250 g:** Very sensitive. **No-go above 18–20 mph** gusts (common guidance for very light).
- **250–500 g:** **No-go above 24 mph** gusts.
- **500 g–1 kg:** **No-go above 28–30 mph** gusts (reference doc “most” consumer drones).
- **1 kg+:** **No-go above 33–35 mph** gusts for larger rigs.

*Sources: Reference doc (sub-250 often no-go above ~20 mph gusts; most &gt;30 mph); “Defying the Gusts” (gusts can exceed drone limits even when sustained wind seems ok).*

---

## 4. Visibility – no-go threshold

- **All classes:** **No-go below 1 km (1000 m).** VLOS is hard beyond ~1 mile; many jurisdictions treat &lt;1 km as unsafe. EU guidance often references 5 km ground visibility for planning; 1 km is a strict no-go floor.

*Sources: FAA VLOS (no fixed distance; “difficult beyond 1 mile”); EU VLOS guidance (e.g. 5 km visibility); reference doc (&lt;1 km no-go).*

---

## 5. Precipitation chance – caution threshold

- **Sub-250 g & 250–500 g:** **Caution above 30%** chance. Most consumer drones have no IP rating; even light rain risk.
- **500 g–1 kg & 1 kg+:** **Caution above 40%** (reference doc); heavier models may have slightly better sealing but still not rainproof.

*Sources: Reference doc (no-go &gt;40%, caution 20–40%); “Can you fly a drone in the rain?” (most consumer drones not designed for rain; no IP rating).*

---

## 6. Values used in app (summary)

| Class     | Wind speed yellow (mph) | Gust red (mph) | Visibility red (m) | Precip yellow (%) |
|----------|---------------------------|----------------|--------------------|--------------------|
| Sub-250 g| 10                        | 18             | 1000               | 30                 |
| 250–500 g| 12                        | 24             | 1000               | 30                 |
| 500 g–1 kg| 15                       | 30             | 1000               | 40                 |
| 1 kg+    | 20                        | 34             | 1000               | 40                 |

These are used in `src/constants/droneThresholds.ts`. Logic: **Red** = gust &gt; limit OR visibility &lt; 1 km; **Yellow** = wind speed &gt; limit OR precip &gt; limit (and not red); **Green** = otherwise.
