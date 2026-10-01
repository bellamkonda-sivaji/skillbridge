# JobOn — Employer app

The phone app for the businesses doing the hiring: supermarkets, restaurants,
medical shops, warehouses and building sites around Tirupati.

Expo (SDK 57) / React Native. Standalone — its own API client, translations and
theme, sharing no code with the worker app or the web front end.

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
| Business setup | Business details · Verification · Plan and fees · All set |
| Posting | An 8-step wizard: who · how long · the work · when · pay · requirements · how you choose · check — then Job is live |
| Managing | Dashboard · My jobs · Job management (counters, pay, details) |
| Hiring | Applications · Applicants for a job · Worker profile with work history · Suggested workers · Find workers · Compare · Shortlisted people · What do you want to do? |
| Talking | Arrange a call or visit · Calendar · After the talk (results) |
| Offers | Make an offer · Check the offer · Offer sent · Offer status · One offer's status in full · Confirm they joined, through to Work completed |
| Money | Pay · Put money behind a job |
| Running the team | My team · Attendance (day view and change requests) |
| Account | Business profile · Alerts · What workers said · Settings |

Every screen in the employer web app has an equivalent here.

## Three decisions worth knowing

**The commission is never a surprise.** It is on the plan screen before anything
is posted, recalculated live on the pay step as the amount is typed, repeated on
the offer screen, and shown again on the job. The employer pays exactly what
they type; the fee comes out of it and the worker sees what reaches them.

**The dashboard leads with jobs that are not filling**, above the counters. A
dashboard that opens with totals hides the one thing the owner can act on today,
and acting on it is usually a phone call or a price change — both one tap away.

**The posting wizard keeps its draft in one screen**, not spread across
navigator routes, so going back never loses what was typed. That is the fastest
way to make someone abandon a form on a phone.

## Layout

```
src/
  api/        one module per area, all through a single axios client
  i18n/       en / te / hi
  session/    token in AsyncStorage, 401 signs out
  ui/         the design system, plus catalog.js — the fixed lists and fee slabs
  navigation/ a stack per tab; hiring screens are carried by each stack
  screens/
```

`ui/catalog.js` mirrors the server's commission slabs so the wizard can show a
split as the employer types. The server recalculates on save and is the
authority: if the two ever drift, the job carries the server's figure.

## Pictures

Most records carry no photograph. Rather than a wall of identical grey icons -
which makes every job look the same, the one thing a list of jobs must not do -
each kind of work has its own flat illustration in `assets/work/`. They are
drawings, not photographs: they give a card weight without pretending to show
a real person or a real shop.

A real photo always wins. `Photo` falls back photo → drawing → icon, and the
drawing is chosen from the job's category, or from its title when an older
record has none.
