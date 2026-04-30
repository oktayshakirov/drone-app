# Drone Pal Weather Proxy (Cloudflare Workers)

This backend proxies Apple WeatherKit requests, adds cache/stale fallback, and prevents direct device traffic spikes to Apple.

## Endpoints

- `GET /health` -> liveness check
- `GET /weather?lat=..&lon=..&datasets=currentWeather,forecastHourly,forecastDaily`

`/weather` returns the app-ready weather shape used by `src/api/weatherKit.ts`.

## Local development

1. Install dependencies:
   - `cd backend`
   - `npm install`
2. Copy env template:
   - `cp .dev.vars.example .dev.vars`
3. Fill `.dev.vars` with your WeatherKit values.
4. Start worker:
   - `npm run dev`

## Cloudflare deployment

1. Install Wrangler globally (optional): `npm i -g wrangler`
2. Login:
   - `cd backend`
   - `npx wrangler login`
3. Create KV namespace:
   - `npx wrangler kv namespace create WEATHER_CACHE`
4. Copy returned namespace `id` into `wrangler.toml` at `kv_namespaces`.
5. Set production secrets:
   - `npx wrangler secret put WEATHERKIT_TEAM_ID`
   - `npx wrangler secret put WEATHERKIT_SERVICE_ID`
   - `npx wrangler secret put WEATHERKIT_KEY_ID`
   - `npx wrangler secret put WEATHERKIT_PRIVATE_KEY`
6. Deploy:
   - `npm run deploy`
7. Verify:
   - `https://<your-worker>.workers.dev/health`
   - `https://<your-worker>.workers.dev/weather?lat=40.7128&lon=-74.0060&datasets=currentWeather,forecastHourly,forecastDaily`

## App configuration after deploy

Set app env values:

- `WEATHER_PROXY_BASE_URL=https://<your-worker>.workers.dev/weather`
- `WEATHER_DIRECT_ENABLED=false`
- `WEATHER_DISABLED=false`
- `WEATHER_RETRY_MAX=3`
- `WEATHER_REQUEST_TIMEOUT_MS=15000`

Then publish OTA update to deliver fix to installed users.
