# JobOn — Worker app

The phone app for people looking for work: shop staff, drivers, cooks, cleaners,
helpers and masons around Tirupati.

Expo (SDK 57) / React Native. Standalone — it has its own API client, its own
translations and its own theme, and shares no code with the employer app or the
web front end.

## Running it on a phone

```bash
npm install
npx expo run:android      # builds the native app and installs it
npx expo run:ios          # needs Xcode, not just the command line tools
npm run web               # react-native-web, handy for a quick look
```

Both apps have been built and run on a real Android build (SDK 57, NDK 27,
new architecture). `npx expo-doctor` passes 21/21.

**The map needs a Google Maps key.** Put it in `app.json` under
`expo.android.config.googleMaps.apiKey`. Without one the app does not crash -
the nearby screen lists the same jobs nearest-first and says why. Google Maps
on Android throws from inside the native view when the key is missing, which
React Native turns into a red screen, so the key is checked before a MapView
is ever mounted.

**The emulator reaches the backend** at `10.0.2.2:8080`, which the app falls
back to automatically. On a real phone, either set `expo.extra.apiUrl` or let
it use the IP Expo is already serving the bundle from.

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

## Pictures

Most records carry no photograph. Rather than a wall of identical grey icons -
which makes every job look the same, the one thing a list of jobs must not do -
each kind of work has its own flat illustration in `assets/work/`. They are
drawings, not photographs: they give a card weight without pretending to show
a real person or a real shop.

A real photo always wins. `Photo` falls back photo → drawing → icon, and the
drawing is chosen from the job's category, or from its title when an older
record has none.
