# Drone flight conditions – safe vs. critical ranges

Reference list of all conditions shown in the app and suggested ranges for **safe** vs. **not safe** (or caution) for flying a drone. Use this when implementing or tuning Go/No-Go logic. Ranges are general guidance; actual limits depend on drone size, pilot skill, and local rules.

---

## 1. Wind (sustained speed)

| Condition   | Range (safe)        | Range (caution)     | Range (no-go / critical) | Notes |
|------------|---------------------|---------------------|---------------------------|--------|
| **Wind**   | &lt; ~5.4 m/s (12 mph, ~10 kt) | ~5.4–8.9 m/s (12–20 mph, 10–17 kt) | &gt; ~8.9 m/s (20 mph, 17 kt) | Light drones (&lt;250 g): stay at low end of safe. Heavier drones can tolerate more. |

- **Safe:** Generally &lt; 10–12 mph sustained; small drones often &lt; 10 mph.
- **Caution:** 12–20 mph; fly with care, avoid high altitude and long range.
- **No-go:** &gt; 20 mph sustained for most consumer drones; &gt; 25–35 mph for larger rigs.

*App shows:* Wind speed in user-selected unit (mph, km/h, m/s, knots).

---

## 2. Gusts

| Condition | Range (safe)     | Range (caution)  | Range (no-go)     | Notes |
|-----------|------------------|------------------|-------------------|--------|
| **Gust**  | &lt; ~8.9 m/s (20 mph) | ~8.9–13.4 m/s (20–30 mph) | &gt; ~13.4 m/s (30 mph) | Gusts matter more than sustained for stability. Sub-250 g: often no-go above ~20 mph gusts. |

- **Safe:** Gusts &lt; 20 mph (typical for small drones).
- **Caution:** 20–30 mph gusts; possible but risky.
- **No-go:** Gusts &gt; 30 mph for most; &gt; 20 mph for very light drones.

*App shows:* Gust speed in user-selected unit (or — if no gust data).

---

## 3. Wind direction

| Condition        | Safe / critical range | Notes |
|------------------|------------------------|--------|
| **Wind direction** | No strict safe/unsafe band | Informational. Helps with take-off/landing heading and FPV. Crosswind and tailwind affect stability more than headwind. |

*App shows:* Cardinal (e.g. NW) and/or compass; used for orientation, not Go/No-Go.

---

## 4. Visibility

| Condition    | Range (safe)     | Range (caution)   | Range (no-go)   | Notes |
|--------------|------------------|-------------------|-----------------|--------|
| **Visibility** | &gt; 5 km (3.1 mi) | 1–5 km (0.6–3.1 mi) | &lt; 1 km (0.6 mi) | VLOS required in most countries. 5 km+ is comfortable; &lt; 1 km is illegal / unsafe in many places. |

- **Safe:** &gt; 5 km (often 10 km+ in clear weather).
- **Caution:** 1–5 km; keep close, ensure VLOS.
- **No-go:** &lt; 1 km; do not fly (VLOS and obstacle avoidance compromised).

*App shows:* Visibility in mi (imperial) or km (metric). *Internal:* meters.

---

## 5. Sunshine time (sunrise / sunset)

| Condition         | Safe / critical range | Notes |
|-------------------|------------------------|--------|
| **Sunshine time** | No single safe band    | Fly in daylight when possible. Civil twilight often legal; night flight needs authorization and lights. Low sun = glare and long shadows. |

*App shows:* Sunrise and sunset times (and sun curve). Used for planning, not a direct Go/No-Go threshold.

---

## 6. Precipitation chance

| Condition       | Range (safe) | Range (caution) | Range (no-go) | Notes |
|-----------------|--------------|-----------------|---------------|--------|
| **Precipitation** | 0–20%      | 20–40%          | &gt; 40%      | Rain can damage electronics and motors. Even 30% often treated as “don’t fly”. |

- **Safe:** 0–20% chance.
- **Caution:** 20–40%; high risk of rain during flight.
- **No-go:** &gt; 40% (or conservatively &gt; 30%).

*App shows:* Precipitation chance in %.

---

## 7. Cloud cover

| Condition     | Range (safe) | Range (caution) | Range (no-go) | Notes |
|---------------|--------------|-----------------|---------------|--------|
| **Cloud cover** | 0–50%      | 50–80%          | &gt; 80%      | Low ceiling and poor visibility. IMC not allowed for typical VLOS drones. |

- **Safe:** Clear to partly cloudy (e.g. 0–50%).
- **Caution:** 50–80%; ceiling and visibility may be marginal.
- **No-go:** &gt; 80%; high risk of low ceiling, reduced visibility, and possible rain.

*App shows:* Cloud cover in %.

---

## 8. Temperature

| Condition    | Range (safe)      | Range (caution)     | Range (no-go)  | Notes |
|--------------|-------------------|----------------------|----------------|--------|
| **Temperature** | ~−10 °C to ~35 °C (14 °F to 95 °F) | −10 to −20 °C or 35–40 °C | &lt; −20 °C or &gt; 40 °C | Batteries and motors have operating limits. Cold reduces flight time; heat risks overload. |

- **Safe:** Roughly −10 °C to 35 °C (14 °F to 95 °F) for many consumer drones.
- **Caution:** Near limits; shorter flights, avoid high load.
- **No-go:** Extreme cold (&lt; −20 °C) or extreme heat (&gt; 40 °C) unless drone is rated for it.

*App shows:* Temperature in °C or °F.

---

## 9. Humidity

| Condition  | Range (safe) | Range (caution) | Range (no-go) | Notes |
|------------|--------------|-----------------|---------------|--------|
| **Humidity** | 0–80%     | 80–95%          | &gt; 95%      | High humidity increases risk of condensation on electronics and sensors. Often combined with rain. |

- **Safe:** &lt; 80%.
- **Caution:** 80–95%; avoid long exposure, dry drone after.
- **No-go:** &gt; 95% (fog, drizzle, or rain likely).

*App shows:* Humidity in %.

---

## 10. UV index

| Condition   | Range (safe) | Range (caution) | Range (no-go) | Notes |
|-------------|-------------|-----------------|---------------|--------|
| **UV index** | 0–7        | 8–10            | 11+           | No direct flight limit. High UV = strong sun, glare, and pilot comfort. Optional for planning. |

- **Safe:** 0–7 (no flight restriction).
- **Caution:** 8–10; sun protection, possible glare.
- **No-go:** No strict no-go; 11+ is “extreme” for skin/sun, not for the drone itself.

*App shows:* UV index (0–11+). Informational only for flight safety.

---

## 11. Kp index (geomagnetic)

| Condition  | Range (safe) | Range (caution) | Range (no-go) | Notes |
|------------|-------------|-----------------|---------------|--------|
| **Kp index** | 0–4       | 5–6             | 7–9           | High Kp can affect GPS and compass. Storm-time flying not recommended at high Kp. |

- **Safe:** Kp ≤ 4 (quiet to unsettled).
- **Caution:** Kp 5–6; possible GPS/compass issues, fly with care.
- **No-go:** Kp ≥ 7; avoid flying (navigation and RTH reliability at risk).

*App shows:* Kp index 0–9 (from NOAA SWPC).

---

## 12. Map

| Condition | Safe / critical range | Notes |
|-----------|------------------------|--------|
| **Map**   | N/A                    | Shows location for airspace and obstacles, not a numeric condition. |

*App shows:* Map with current location. No safe/unsafe band.

---

## Summary table (all conditions)

| #  | Condition      | Unit / type   | Safe range              | Caution range        | No-go / critical      |
|----|----------------|---------------|--------------------------|----------------------|------------------------|
| 1  | Wind           | Speed (m/s, mph, etc.) | &lt; ~5.4 m/s (12 mph) | ~5.4–8.9 m/s (12–20 mph) | &gt; ~8.9 m/s (20 mph) |
| 2  | Gust           | Speed         | &lt; ~8.9 m/s (20 mph)   | ~8.9–13.4 m/s (20–30 mph) | &gt; ~13.4 m/s (30 mph) |
| 3  | Wind direction | Degrees/cardinal | Informational only  | —                    | —                      |
| 4  | Visibility     | m → km / mi   | &gt; 5 km                | 1–5 km               | &lt; 1 km               |
| 5  | Sunshine time  | Sunrise/sunset | Planning only        | —                    | —                      |
| 6  | Precipitation  | %             | 0–20%                   | 20–40%               | &gt; 40%                |
| 7  | Cloud cover    | %             | 0–50%                   | 50–80%               | &gt; 80%                |
| 8  | Temperature    | °C / °F       | −10 °C to 35 °C         | Near limits          | &lt; −20 °C or &gt; 40 °C |
| 9  | Humidity       | %             | 0–80%                   | 80–95%               | &gt; 95%                |
| 10 | UV index       | 0–11+         | 0–7                     | 8–10                 | No hard no-go          |
| 11 | Kp index       | 0–9           | 0–4                     | 5–6                  | 7–9                    |
| 12 | Map            | —             | N/A                     | —                    | —                      |

---

## Notes for implementation

- **Primary Go/No-Go drivers** in many apps: **wind (and gusts)**, **visibility**, **precipitation**. Your existing `DroneClassThresholds` (wind gust, visibility, precipitation chance) align with this.
- **Secondary:** cloud cover, temperature, humidity, Kp — can be used for extra caution or warnings.
- **Informational only:** wind direction, sunshine time, UV index, map.
- Ranges can be converted to the same units your app uses (e.g. m/s for wind, meters for visibility) when you add or change logic later.
