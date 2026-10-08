# jobon-employer

JobOn employer app — Expo / React Native.

```bash
npm install
npm run dev:apk   # once: builds the debug app → install it on the phone
npm run dev       # every time: start the dev server, edit, save
```

## Two builds, two jobs

| | Debug app (`npm run dev:apk`) | Release APK (`npm run apk`) |
|---|---|---|
| For | Developing: changes appear as you save | Sharing: the link people download |
| Code | Loaded from this computer over Wi-Fi | Packed inside the APK |
| Needs this computer | Yes, on the same Wi-Fi | No |
| File | `android/app/build/outputs/apk/debug/app-debug.apk` | `android/app/build/outputs/apk/release/app-release.apk` |

Same package name, so installing one replaces the other on a phone.

## Live editing — changes show as you save

The debug app holds no code of its own: it loads the JavaScript from Metro on
this computer, and Metro pushes each saved file to the phone in a second or
two. **Nothing is rebuilt**, so there is no eight-minute wait to see a change.

1. **Once:** `npm run dev:apk`, then install `app-debug.apk` on the phone.
2. Phone on the **same Wi-Fi** as this computer.
3. `npm run dev`, then open the app.
4. Edit anything under `src/` and save. The screen updates.

Shake the phone for the developer menu; `r` in the terminal reloads fully.

**Rebuild the debug app only for native changes** — a library with native
code, or an edit to `app.json`, the icons, permissions or
`google-services.json`. Everything else is live.

## This app owns port 8082

The two JobOn apps use different Metro ports on purpose: worker-mobile (8081)
uses the other one. Sharing a port makes the wrong bundle load — the symptom
is this app opening with the other app's screens, which looks like a baffling
bug and is not one. It cost us twice before the ports were split.

## Building the APK people download

```bash
npm run apk
```

Published at `https://jobon.mindsyncos.com/dl/jobon-employer.apk`. Live editing never
reaches anyone who installed that: they get changes from a new APK.

`npm run apk:fast` builds in about 30 seconds instead of 8 minutes, but for
arm64 phones only — fine for your own testing, **not** for the download page,
where an older handset would answer "app not installed".

## Where the API is

`app.json` names it (`extra.apiUrl`): the production server, so a debug
build reads and writes real data. `npm run dev:local` points it at a backend
running on this computer instead.
