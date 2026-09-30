# JobOn — Employer app

The phone app for the businesses doing the hiring: supermarkets, restaurants,
medical shops, warehouses and building sites around Tirupati.

Expo (SDK 57) / React Native. Standalone — its own API client, translations and
theme, sharing no code with the worker app or the web front end.

## Running it

```bash
npm install
npm start          # then press a / i, or scan the QR code
npm run web
```

The backend must be running on port 8080. API resolution works the same way as
the worker app: the Expo host IP in development, `expo.extra.apiUrl` in a build.

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
