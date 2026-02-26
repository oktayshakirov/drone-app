# DronePal

Weather app for drone pilots — Go/No-Go flight conditions, weather metrics, and weight-class-based thresholds.

## Stack

- **Expo** (SDK 54) + **TypeScript**
- **NativeWind** (Tailwind) for styling — dark, high-contrast theme
- **expo-location** for GPS
- **Apple WeatherKit** REST API for weather (JWT auth)
- **RevenueCat** ready (Pro + 7-day trial; all features unlocked for now)

## Run

```bash
npm install
npm start
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

## Environment (WeatherKit)

Copy `.env.example` to `.env` and set the four WeatherKit values. **How to get them:** see **[docs/WEATHERKIT_SETUP.md](docs/WEATHERKIT_SETUP.md)** for step-by-step instructions (Team ID, Services ID, Key ID, and `.p8` private key from Apple Developer).

- `WEATHERKIT_TEAM_ID` — from Apple Developer → Membership
- `WEATHERKIT_SERVICE_ID` — from Identifiers → Services IDs (e.g. `com.yourcompany.dronepal.weather`)
- `WEATHERKIT_KEY_ID` — from Keys → create a key with WeatherKit enabled
- `WEATHERKIT_PRIVATE_KEY` — contents of the downloaded `.p8` file (in quotes, use `\n` for newlines)

The project already uses `dotenv` in `app.config.js`, so `.env` is loaded automatically. Without valid credentials, the app uses **mock weather** so you can run and test the UI.

## Project structure

- `src/api` — WeatherKit client, mock weather
- `src/components` — Safety Gauge, Weather Cards, Weight Class selector, Metric education modal, placeholders
- `src/constants` — Drone weight classes & thresholds, metric education copy
- `src/hooks` — useLocation, useWeather
- `src/types` — Weather & safety types
- `src/utils` — JWT (WeatherKit), conversions, Go/No-Go evaluation, env
