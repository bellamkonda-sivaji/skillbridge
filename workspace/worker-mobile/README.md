# JobOn — Worker app

The phone app for people looking for work: shop staff, drivers, cooks, cleaners,
helpers and masons around Tirupati.

Expo (SDK 57) / React Native. Standalone — it has its own API client, its own
translations and its own theme, and shares no code with the employer app or the
web front end.

## Running it

```bash
npm install
npm start          # then press a / i, or scan the QR code
npm run web        # renders through react-native-web, useful for quick checks
```

The backend must be running on port 8080 (`workspace/backend/run.sh`).

**Where it looks for the API.** A phone cannot reach `localhost` — that is the
phone itself — so in development the app takes the IP Expo is already serving
the bundle from, which is the same machine the API runs on. For a real build,
set `expo.extra.apiUrl` in `app.json`; anything that is not a non-empty string
is ignored.

## What is in it

| Flow | Screens |
|---|---|
| Getting in | Splash · Language · Account type · Create account · OTP · Log in |
| Profile setup | About you · What work you can do · Skills · Where you are |
| Finding work | Home · Find work · Filters · Map (list on web) · Job details · Business profile · Saved |
| Applying | My applications · Application progress · Take back an application |
| Talks | Talks and visits · Talk details (with reschedule and "I cannot come") |
| Offers | Offers · Offer details · Accepted · Before you go |
| Working | My work · Today's work (punch in and out) · Job details · My days |
| Corrections | Raise a correction on any day, and track what you have raised |
| Money | My money · Where to send my money (bank or UPI) |
| Account | Profile · Alerts · What people said · Settings |

Every screen in the worker web app has an equivalent here.

## Two decisions worth knowing

**The pay shown is always the take-home.** The employer posts a price and the
platform's commission comes out of it. `workerPay()` in `src/ui/format.js` reads
both the card shape and the full job record, so no screen can show a worker a
number they will not be paid.

**Language comes before the account.** Each option is written in its own script,
because the English word "Telugu" is exactly what a Telugu-only reader cannot
read. English, తెలుగు and हिन्दी are complete, including the tab bar.

## Layout

```
src/
  api/        one module per area, all through a single axios client
  i18n/       en / te / hi, plus the language picker list
  session/    token in AsyncStorage, 401 signs out
  ui/         the design system: Screen, Button, Card, Field, Chip, Steps…
  navigation/ a stack per tab
  screens/
```

`NearbyJobs.web.js` sits beside `NearbyJobs.js`: `react-native-maps` has no web
renderer, so on web the same jobs are listed nearest-first instead of showing an
empty grey box. The native build keeps the real map.
