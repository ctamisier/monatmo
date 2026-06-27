# MonAtmo

> A smart home dashboard for Netatmo devices with outdoor weather data.

**Live app:** https://monatmo.clement-tamisier.workers.dev/

---

## What it does

MonAtmo lets you control and monitor your Netatmo smart home devices from a single web interface. It connects to the Netatmo API via OAuth 2.0 and displays your homes, rooms, and modules in a dark, space-themed dashboard.

### Temperature & Thermostats

- View all rooms equipped with a thermostat, showing the current measured temperature and the configured setpoint.
- Adjust the setpoint temperature with +/- 0.5 degree buttons.
- Select rooms to display their temperature history on an interactive Chart.js graph with three time scales (30 min, 1 hour, 24 hours).
- Drag-to-zoom on the chart to focus on a specific time range.
- An outdoor temperature overlay from Open-Meteo is drawn alongside indoor data for comparison.
- Valve (radiator) battery status is shown per room.

### Lights

- Toggle Netatmo lights (NLFN modules) on and off with a single tap.
- Visual glow effect indicates which lights are currently on.

### Roller Shutters

- Control roller shutters (NLV, NLLV, BNAS, BNAB, BNMS) with Open, Close, and Stop buttons.
- A vertical slider allows precise position control (0-100%).
- Real-time position polling after sending a command.

### Weather

- Current outdoor temperature and humidity are displayed in the top bar (via browser geolocation) and on each home card (via home coordinates).
- Data is sourced from the closest Netatmo public weather station using the Haversine distance formula.
- Historical outdoor temperature is overlaid on the chart using the Open-Meteo forecast API (recent data) with automatic fallback to the archive API for older periods.

### Internationalization

15 languages are supported: French, English, Spanish, German, Italian, Portuguese, Dutch, Polish, Turkish, Japanese, Korean, Chinese (Simplified), Chinese (Traditional - Taiwan), Chinese (Traditional - Hong Kong), and Arabic. The locale is auto-detected from the browser and persisted in local storage.

---

## Architecture

The app is a Vue 3 single-page application deployed as a **Cloudflare Worker**. The worker serves the static frontend assets and proxies three backend endpoints for the OAuth flow, keeping the Netatmo client secret server-side.

### Auth flow

OAuth 2.0 with PKCE (S256). The frontend generates a code verifier and challenge, redirects the user to Netatmo for authorization, and exchanges the returned code for tokens via the Cloudflare Worker. Tokens are stored in local storage and refreshed proactively before expiry. A 401 response automatically triggers a token refresh and retry.

### Weather data

Two data sources are combined:

| Source | Use case |
|---|---|
| **Netatmo public stations** | Real-time outdoor temperature and humidity (closest station via Haversine) |
| **Open-Meteo forecast API** | Hourly outdoor temperature for the chart (up to 92 days back) |
| **Open-Meteo archive API** | Fallback for historical data older than the forecast range |

### Device types handled

| Type | Category |
|---|---|
| NRV | Smart Valves (thermostat) |
| NLFN | Dimmer with Neutral (light) |
| NLV, NLLV | Roller Shutter Switch |
| BNAS, BNAB, BNMS | Bticino shutter / blind / shade |
| NLG, BNS, BNMH | Gateway (bridge for commands) |

---

## Project structure

```
src/
├── components/        # Vue SFCs (UI)
├── composables/       # Reusable logic (useWeatherData)
├── constants/         # Chart scale limits, module types
├── i18n/              # vue-i18n setup
├── locales/           # 15 translation JSON files
├── services/          # API clients (auth, netatmo, openmeteo)
├── stores/            # Pinia stores (auth, home, temperature, light, shutter)
├── types/             # TypeScript types
├── utils/             # Haversine, station finder
├── App.vue            # Root component
├── main.ts            # Entry point
└── worker.ts          # Cloudflare Worker (OAuth proxy)
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A Netatmo developer account with OAuth credentials
- A Cloudflare account (for deployment)

### Setup

```bash
npm install
```

Create a `.dev.vars` file for local development:

```
NETATMO_CLIENT_ID=your_client_id
NETATMO_CLIENT_SECRET=your_client_secret
NETATMO_REDIRECT_URI=http://localhost:5173
NETATMO_SCOPE=read_thermostat write_thermostat read_magellan write_magellan
```

### Commands

```bash
npm run dev        # Start local dev server
npm run build      # Type-check and build
npm run lint       # Run ESLint
npm run preview    # Build and preview as Cloudflare Worker
npm run deploy     # Build and deploy to Cloudflare
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript 6 |
| State | Pinia 3 |
| UI | Tailwind CSS v4, DaisyUI 5 |
| i18n | vue-i18n 11 |
| Chart | Chart.js 4 (with date-fns adapter) |
| Build | Vite 8 |
| Platform | Cloudflare Workers (`@cloudflare/vite-plugin`) |
| APIs | Netatmo API (OAuth 2.0 PKCE), Open-Meteo (forecast + archive) |
