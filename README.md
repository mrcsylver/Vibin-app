# Vibin

A proximity-based music discovery app for iOS and Android. Open it and you see a
radar of everyone within **300 feet** and what they are playing on Spotify right
now — their track, their album art, their status line — placed by real distance
and compass bearing. Tap someone to nudge them.

Built with Expo SDK 57 and React Native. The backend is a single Supabase
project: PostGIS for the proximity query, Realtime for nudges, and nothing else.
There is no server to run.

**Status:** complete MVP. Shipped to Apple and accepted — version 1.0.0 (build 2)
was delivered to App Store Connect and distributed through TestFlight.

---

## Contents

- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [What works today](#what-works-today)
- [Setup](#setup)
- [Project layout](#project-layout)
- [Privacy and security model](#privacy-and-security-model)
- [Roadmap — what is left to build](#roadmap--what-is-left-to-build)
- [Known limitations](#known-limitations)

---

## How it works

Once a minute, each device does one round trip:

1. Ask Spotify what is playing (`/me/player/currently-playing`).
2. Read the device's GPS position.
3. Call `upsert_presence()` on Supabase with the track, the coordinates, and a
   **SHA-256 hash** of the Spotify user id — never the raw id.
4. Call `nearby_users()`, which runs a PostGIS `ST_DWithin` query at 91.44 m
   (300 ft) and returns, for each neighbour, their track and their
   **distance and bearing only**. Coordinates never come back.

The app draws those polar coordinates onto a procedurally generated 16-bit
overworld map. Presence rows are deleted after 15 minutes of silence, by both a
write-time trigger and a `pg_cron` job.

```
┌────────────┐   currently-playing    ┌──────────────┐
│   Device   │ ─────────────────────▶ │ Spotify Web  │
│            │ ◀───────────────────── │     API      │
│  Expo RN   │                        └──────────────┘
│            │   upsert_presence()    ┌──────────────┐
│            │ ─────────────────────▶ │   Supabase   │
│            │   nearby_users()       │  Postgres +  │
│            │ ◀───────────────────── │   PostGIS    │
│            │   distance + bearing   │              │
│            │ ◀─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │   Realtime   │
└────────────┘   nudge broadcast      └──────────────┘
```

## Tech stack

**App**

| | |
| --- | --- |
| Framework | Expo SDK 57.0.19 (managed / CNG), React Native 0.86.3, React 19.2.3 |
| Architecture | New Architecture (Fabric + TurboModules) enabled |
| Language | TypeScript 6.0 in `strict` mode — the whole codebase typechecks clean |
| Navigation | None. A single `<Gate>` in `App.tsx` swaps onboarding for the radar |
| State | One React context (`context/SessionContext.tsx`) — no Redux, no Zustand |
| Graphics | `react-native-svg` for the radar and the tile map |
| Animation | `react-native-reanimated` 4 + `react-native-worklets`, `react-native-gesture-handler` for the pannable map |
| UI | `@gorhom/bottom-sheet`, `expo-blur`, `expo-linear-gradient`, `expo-haptics` |
| Storage | `expo-secure-store` (Keychain / Keystore) for tokens and profile |
| Share card | `react-native-view-shot` → `expo-sharing` |

**Backend** — `schema.sql`, one file, idempotent, paste into the Supabase SQL editor.

| | |
| --- | --- |
| Database | Supabase Postgres with the **PostGIS** extension |
| Proximity | `geography(Point, 4326)`, GiST index, `ST_DWithin` + `ST_Azimuth` |
| Expiry | Statement trigger on every write, plus a one-minute `pg_cron` job |
| Nudges | Supabase Realtime **broadcast** from inside the insert function |
| Access | Three tables, all RLS-locked with no policies; six `SECURITY DEFINER` RPCs are the only surface the anon key can reach |

**Third-party services**

| Service | Used for | Cost |
| --- | --- | --- |
| Spotify Web API | OAuth (PKCE) and now-playing | Free |
| Supabase | Database, PostGIS, Realtime | Free tier is enough for a pilot |
| DiceBear | Avatar images (`api.dicebear.com`) | Free, no key |
| Apple Developer | TestFlight and App Store | $99/year |

Notifications are **local** (`expo-notifications`), triggered by a Realtime
message. There is no push provider, no FCM/APNs server key, and no device token
stored anywhere.

## What works today

Everything listed here is implemented and was exercised on real devices.

- **Spotify login** — full PKCE authorization-code flow via `expo-auth-session`.
  No client secret in the app. Tokens are kept in the Keychain and refreshed one
  minute before expiry.
- **300 ft radar** — live pins at true distance and bearing, three range rings at
  100 / 200 / 300 ft, tap-to-nudge, pull-up sheet listing everyone nearby.
- **Procedural 16-bit map** — terrain generated from the device's own
  coordinates, so the ground moves as you walk. Roughly 1,200 tiles are merged
  into ~22 SVG paths per frame to keep it cheap.
- **Pannable world** — drag the map with a spring-back; the radar HUD stays put.
- **Compass heading** — a facing cone driven by `watchHeadingAsync`, falling back
  to magnetic north until iOS has a true-north fix.
- **Non-Spotify fallback** — six distinct playback states (`playing`, `podcast`,
  `paused`, `idle`, `unlinked`, `unavailable`). Someone on Apple Music or a
  record player still appears on the radar with their status line rather than
  being dropped or mislabelled "nothing playing".
- **Status composer** — free text (80 chars) plus five one-tap presets.
- **Nudges and All-Time Likes** — lifetime sent/received tallies that survive the
  15-minute sweep, plus a local notification on the receiving device.
- **Share My Vibe** — renders a stylised card (album art, track, avatar, radar
  background) to PNG and opens the system share sheet, so Instagram Stories,
  Messages and Save Image all work through one code path.
- **Onboarding** — avatar picker (4 DiceBear styles), username, permission
  requests with a graceful denial path that still lets the app run.
- **Account deletion** — in-app, wipes presence, both sides of the like history
  and the lifetime tallies. Required by App Store guideline 5.1.1(v).
- **Background presence** — `expo-task-manager` keeps the pin fresh while
  backgrounded, with the iOS background-location mode declared.
- **App Store compliance** — privacy manifest, all `NS*UsageDescription` strings,
  `ITSAppUsesNonExemptEncryption`, and a correct `aps-environment` for each build
  profile. This build passed Apple's processing.

## Setup

### Requirements

- Node.js 20+ (developed on 22.22.2) and npm
- A Mac with Xcode for iOS builds; Android Studio for Android
- Free accounts: [Supabase](https://supabase.com), [Spotify for Developers](https://developer.spotify.com)

### 1. Install

```bash
git clone <your-fork-url> vibin
cd vibin
npm install
```

### 2. Create the database

1. Create a Supabase project.
2. Open **SQL Editor** → **New query**.
3. Paste the entire contents of [`schema.sql`](./schema.sql) and run it.

It is safe to run more than once. It creates three tables, six RPCs, the PostGIS
index, the expiry trigger and the cron job, then locks the tables.

> If `pg_cron` is not available on your plan, the script says so and carries on —
> the write-time trigger still expires rows.

### 3. Create the Spotify app

1. In the Spotify Developer Dashboard, create an app.
2. **Settings → Edit → Redirect URIs**, add exactly:
   ```
   vibin://spotify-auth
   ```
   (If you change `scheme` in `app.json`, change this to match.)
3. Copy the **Client ID**. You do not need the client secret — the app uses PKCE.
4. Spotify apps start in *development mode*: only accounts you add under
   **User Management** can log in, up to 25. Request a quota extension to go
   beyond that.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in the three values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=...
```

`EXPO_PUBLIC_SUPABASE_URL` must be the **project URL**, not an API key. The app
validates its shape on startup and shows a specific message if it is wrong.

> **Note for release builds.** `.env` is gitignored, so EAS Build never sees it.
> Push the values to EAS once per profile:
> ```bash
> eas env:push production --path .env
> eas env:push preview    --path .env
> eas env:push development --path .env
> ```

### 5. Make it yours

Before building under your own account, change these in `app.json`:

| Field | Why |
| --- | --- |
| `ios.bundleIdentifier` / `android.package` | Must be unique to your Apple/Google account |
| `extra.eas.projectId` | Points at the original EAS project. Delete it and run `eas init` |
| `name`, `slug`, `scheme` | If you rebrand. Changing `scheme` means updating the Spotify redirect URI |

Optionally set your Terms and Privacy URLs in [`utils/legal.ts`](./utils/legal.ts).
While they are blank the buttons stay visible and open an in-app notice instead
of a dead link.

### 6. Run it

This app **cannot run in Expo Go** — it uses native modules (secure store,
background location, view-shot). You need a development build:

```bash
npx expo run:ios      # or: npx expo run:android
```

That runs `expo prebuild` and compiles. Afterwards, `npx expo start` is enough
for day-to-day work.

Location and Spotify playback both need a **physical device**. The simulator has
no Spotify app and a fake GPS.

```bash
npx tsc --noEmit      # typecheck
```

For TestFlight, see [`DEPLOY_TESTFLIGHT.md`](./DEPLOY_TESTFLIGHT.md), a
step-by-step guide covering both EAS Build and a local Xcode archive.

## Project layout

```
App.tsx                   Font loading + the onboarding/radar gate
index.ts                  Entry point; registers the background location task
schema.sql                The entire backend, one idempotent file

screens/
  OnboardingScreen.tsx    Avatar, username, permissions
  RadarScreen.tsx         Map, radar, sheet, modals

components/               RadarCanvas, RetroMap, NearbySheet, VibeCard,
                          ShareVibeModal, ProfileModal, StatusComposer, …

context/SessionContext.tsx  All app state: profile, track, nearby, permissions,
                            heartbeat, likes, compass

services/
  spotify.ts              PKCE auth, token refresh, now-playing
  supabase.ts             Anon client
  presence.ts             upsert_presence / nearby_users / insert_like RPCs
  likes.ts                All-time tallies
  notifications.ts        Local notifications + Realtime nudge subscription
  locationEngine.ts       Position + heartbeat
  backgroundLocationTask.ts
  permissions.ts          One place that owns permission state
  storage.ts              Keychain-backed profile and tokens
  shareVibe.ts            Card → PNG → share sheet
  config.ts               Env reading and validation

utils/
  nowPlaying.ts           Pure Spotify-response parser (the tricky bit)
  tiles.ts                Procedural terrain generation
  geo.ts                  Polar → canvas projection
  constants.ts            Radius, colours, fonts, presets
```

About 4,900 lines of TypeScript across 37 files, plus 400 lines of SQL.

## Privacy and security model

This was designed for a campus pilot, where getting it wrong matters.

- **No raw Spotify ids leave the device.** Identity is `SHA-256("vibin:" + id)`.
- **No coordinates are ever returned to a client.** `nearby_users()` returns
  distance and bearing; the raw point stays in Postgres.
- **All three tables have RLS enabled with no policies and no grants to `anon`.**
  Every operation goes through a `SECURITY DEFINER` RPC that returns only what it
  should. Reading the tables with the anon key returns nothing.
- **Presence is ephemeral.** Rows are deleted 15 minutes after the last
  heartbeat, by a trigger and a cron job.
- **No client secret ships in the app.** Spotify uses PKCE; tokens live in the
  Keychain/Keystore via `expo-secure-store`.
- **No tracking, no analytics, no ad SDK.** The privacy manifest declares
  `NSPrivacyTracking: false` with an empty tracking-domains list.
- **No push provider.** Nudges arrive over Realtime and are raised as local
  notifications, so no device tokens exist to leak.

The Supabase anon key ships inside the app bundle. That is by design — it is a
public key, and it is protected by the RLS lock above.

## Roadmap — what is left to build

Honest list. None of these block running or shipping the app as it stands.

**Product**

- **Apple Music support.** The playback layer is already abstracted behind
  `NowPlaying` with an explicit `unlinked` state, so a second provider slots in
  beside `services/spotify.ts` without touching the UI. This is the single
  highest-value addition — it roughly doubles the addressable user base.
- **Friends / follows.** Everything today is anonymous and proximity-only. There
  is no social graph, so no way to keep a connection after you walk away.
- **Chat.** Nudges are the only interaction.
- **Listening history.** Nothing is retained; presence is wiped after 15 minutes
  by design.
- **Venue or campus modes.** The 300 ft radius is a constant (`RADIUS_FT` in
  `utils/constants.ts`) — a stadium or a festival would want a different one.
- **Android release.** The manifest, permissions and adaptive icons are all in
  place and the code is cross-platform, but only iOS has been through a real
  store submission.

**Technical**

- **Background polling costs battery.** A one-minute foreground heartbeat plus
  background location is a deliberate MVP simplification. Significant-change
  location monitoring, or backing off when the user is stationary, would cut
  drain noticeably.
- **No automated tests.** `utils/nowPlaying.ts` was developed against a table of
  25 hand-checked cases but no runner is wired up. It is a pure function and the
  easiest place to start.
- **Spotify quota.** The app is in Spotify development mode (25 users). A
  production quota extension needs a submission to Spotify.
- **Scaling `nearby_users`.** The GiST index makes this fine into the thousands
  of concurrent users. Past that, geohash bucketing would be the next step.
- **No rate limiting on the RPCs.** Anyone holding the anon key can write
  presence rows. A campus pilot does not care; a public launch would want a
  check.
- **No moderation.** Usernames and status lines are length-capped but not
  filtered.

## Known limitations

- **Spotify only** for now (see roadmap). Other listeners appear with their
  status line but no track.
- **Requires a physical device** — location and playback do not work in a
  simulator.
- **Requires two people to be useful.** The share card exists partly to give a
  single user something to do; see the two-phone checklist in
  `MARKETPLACE_LISTING.md` for how to demo it alone.
- **iOS-proven, Android-untested in store.** Builds and runs; never submitted.
- **Spotify does not report playback from every device** — a Spotify Connect
  speaker sometimes reports nothing. The app handles this as `idle` rather than
  as an error.

---

## License

`LICENSE` in this repository is the MIT license that ships with the Expo
starter template and still carries Expo's copyright line. It applies to the
template scaffolding, not to the application code. Replace it with your own
terms after acquiring the project.
