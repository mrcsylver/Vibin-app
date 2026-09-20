# Vibin — marketplace listing copy

Copy-and-paste blocks for SideProjectors, Flippa, Acquire, or an Indie Hackers
post. Each section is written to stand alone. Anything in `«guillemets»` is a
blank you need to fill in before posting.

**Please keep this listing honest.** Vibin has no users, no revenue and no
traction. It is a finished, TestFlight-running codebase being sold as source. That
is a real and saleable thing, and buyers on these marketplaces reward sellers
who say so plainly. Everything below is written to be true as it stands.

---

## Title

> **Vibin — 300ft Music Radar. Complete Expo/React Native app with a Supabase + PostGIS backend.**

Alternates:

> **See what everyone within 300 feet is playing on Spotify — full source, TestFlight-ready**

> **Proximity music discovery app (iOS + Android) — complete MVP, running on TestFlight**

## Subtitle

> A complete, working React Native app: Spotify OAuth, live GPS proximity
> matching, a procedural 16-bit map, and a privacy-first Supabase backend in a
> single SQL file. Shipped to TestFlight. ~4,900 lines of strict TypeScript.

---

## Executive summary

> **Vibin turns the room you're standing in into a music feed.**
>
> Open the app and you see a radar of everyone within 300 feet and what they are
> playing on Spotify right now — track, album art, status line — placed by real
> distance and compass bearing on a procedurally generated 16-bit overworld map.
> Tap someone to nudge them. Nobody's location is ever shared; the server returns
> distance and direction only.
>
> This is a finished MVP, not a prototype. It was built for a campus pilot, went
> through Apple's build pipeline: version 1.0.0 (build 2) uploads to App Store
> Connect, clears Apple's binary processing, and installs and runs on real
> devices through TestFlight. Every App Store compliance item is already handled —
> privacy manifest, usage-description strings, in-app account deletion,
> encryption declaration.
>
> I am selling it because I am moving on to other work, not because it stopped
> working. The Spotify and Supabase accounts are mine and will be wound down;
> the buyer connects their own in about fifteen minutes using the setup guide in
> the README.

## Value proposition

> **What you are buying is roughly three months of solved problems.**
>
> The hard parts of this app are not the screens. They are:
>
> - **Spotify's now-playing API is quietly full of traps.** Omit `market=from_token`
>   and it returns `item: null` for perfectly audible music. Omit
>   `additional_types` and podcasts vanish. `currently-playing` intermittently
>   answers 204 mid-track-change while `/me/player` answers correctly. All three
>   are handled, with a pure parser covering six distinct playback states.
> - **Expo release builds drop environment variables** that work fine in
>   development, because the Babel transform only inlines *static*
>   `process.env.X` reads. This codebase has the fix and a comment explaining it.
> - **iOS location permissions have an ordering problem** that only appears for
>   returning users, and produces a crash-adjacent failure on the main screen.
>   Solved, with the reasoning documented in the code.
> - **Apple rejects builds for permission strings you never asked for** —
>   `expo-location` links CoreMotion, so you need `NSMotionUsageDescription`
>   whether or not you use motion. This build carries every string Apple's
>   scanner looks for.
>
> Each of those cost a build cycle or a rejection to find. They are all fixed,
> and the *why* is written down in the code rather than lost.
>
> **Plus a backend that is genuinely finished.** One idempotent SQL file. Paste it
> into Supabase, and you have PostGIS proximity search, 15-minute presence
> expiry, Realtime nudges, lifetime counters, and GDPR-style account deletion —
> with all three tables locked by RLS and every operation going through a
> `SECURITY DEFINER` function. No server to deploy, no container to pay for.

---

## Technical architecture

> **Client** — Expo SDK 57 (managed workflow / CNG), React Native 0.86.3,
> React 19, New Architecture enabled. TypeScript 6 in `strict` mode; the project
> typechecks clean with zero errors. No navigation library and no state library —
> a single React context holds session state, and one gate component swaps
> onboarding for the radar. SVG for the radar and map, Reanimated 4 and
> Gesture Handler for the pannable world, `expo-secure-store` (Keychain) for
> tokens.
>
> **Backend** — Supabase Postgres with PostGIS. Presence is a
> `geography(Point, 4326)` column behind a GiST index; proximity is `ST_DWithin`
> at 91.44 m with `ST_Azimuth` for bearing. Rows expire 15 minutes after the last
> heartbeat via both a statement-level trigger and a one-minute `pg_cron` job.
> Nudges are delivered as Realtime broadcasts emitted from inside the insert
> function, so no table has to be readable for notifications to work.
>
> **The whole backend is one 400-line SQL file.** There is no API server, no
> Docker image, no queue, and no recurring infrastructure cost beyond Supabase's
> free tier.
>
> **Auth** — Spotify OAuth 2.0 with PKCE via `expo-auth-session`. No client
> secret ships in the app. Access tokens refresh a minute before expiry.
>
> **Privacy design**, which is a selling point for any campus or venue pilot:
>
> - User identity is `SHA-256("vibin:" + spotify_id)`. The raw id never leaves the device.
> - Coordinates are never returned to any client — only distance and bearing.
> - All three tables have RLS on with no policies and no grants to the anon role.
> - Presence is deleted after 15 minutes. Nothing is retained.
> - No analytics, no ad SDK, no tracking, no push provider, no device tokens.
>
> ```
>  Device ──── currently-playing ────▶ Spotify Web API
>  Device ──── upsert_presence() ────▶ Supabase (PostGIS)
>  Device ◀─── distance + bearing ──── nearby_users()
>  Device ◀─── nudge broadcast ─────── Realtime
> ```

## Code quality

> - ~4,900 lines of TypeScript across 37 files, plus ~400 lines of SQL.
> - `strict: true`. `npx tsc --noEmit` passes with zero errors.
> - Comments explain *why*, not *what* — every non-obvious decision (the Spotify
>   `market` parameter, the env-inlining rule, the permission ordering, the
>   `aps-environment` mapping) carries the reasoning that produced it.
> - Small, single-purpose modules. Playback parsing, terrain generation and the
>   polar projection are pure functions with no React or network dependency.
> - No dead code, no commented-out blocks, no `TODO` dumping ground.

---

## What is included in the sale

> **Code**
> - Full Git repository with complete commit history (or a clean single-commit
>   export — your preference).
> - The entire React Native / Expo app, unobfuscated, no dependencies on any
>   private package.
> - `schema.sql` — the complete backend, idempotent, ready to paste into a fresh
>   Supabase project.
> - All visual assets: app icon, Android adaptive icons (foreground, background,
>   monochrome), splash, and three bundled OFL-licensed fonts.
>
> **Documentation**
> - `README.md` — architecture, full tech stack, setup from zero, and an honest
>   roadmap of what is not built.
> - `DEPLOY_TESTFLIGHT.md` — a long, plain-language guide to getting a build into
>   TestFlight, covering both EAS Build and a local Xcode archive, written for
>   someone who has never shipped an app. Includes the App Store privacy answers
>   and a troubleshooting table.
> - `.env.example` — every variable documented, with the exact dashboard path to
>   find each value.
> - `GIT_GUIDE.md` — a plain-language Git primer written against this repo.
>
> **Support**
> - «e.g. 14 days of email support for setup questions» — set your own terms.
>
> **Not included** (and not transferable)
> - The Apple Developer account and the existing TestFlight build — the buyer
>   builds under their own team with their own bundle identifier.
> - The Spotify app registration and the Supabase project — both are free to
>   create and take minutes; the setup guide walks through it.
> - Users, revenue, traffic or a brand. There are none.

## Ideal buyer

> - **Indie hackers and solo mobile developers** who want a finished,
>   working, TestFlight-ready iOS codebase to relaunch under their own brand
>   instead of starting from a blank Expo template.
> - **Social and location app founders** who need working proximity
>   infrastructure — the PostGIS layer, the ephemeral presence model and the
>   privacy design generalise to dating, events, campus, conference and venue
>   apps with no music in them at all.
> - **Developers learning production React Native** who would rather read a real
>   app that builds, signs and ships than another tutorial. The commit history shows
>   each problem being found and fixed.
> - **Anyone who needs Spotify integration.** The auth and now-playing layer is
>   lift-and-shift into any other project, and it handles the edge cases most
>   implementations get wrong.
>
> **Not a fit for:** anyone looking to buy revenue, users or traction. There is
> none. This is a code and IP sale.

## Suggested Q&A for the listing

> **Does it work right now?** Yes. Clone, run one SQL file, add three environment
> variables, and build. The README has the full sequence.
>
> **Why are you selling?** I built it for a campus pilot and I am moving on to
> other projects. The code works; my attention went elsewhere.
>
> **Can I rebrand it?** Yes — name, colours, icon, and the 300 ft radius are all
> constants in one or two files.
>
> **Does it need a server?** No. Supabase's free tier covers a pilot and there is
> nothing else to host.
>
> **Is Android done?** It builds and runs, with permissions and adaptive icons in
> place, but it has never been through a Play Store submission.
>
> **What is the hardest remaining work?** Apple Music support, if you want it.
> The playback layer is already abstracted so a second provider slots in beside
> the Spotify service without touching the UI.

---

## Two-phone demo checklist

For recording the video that will sell this. You need two phones, two Spotify
accounts, and to be standing in one place.

**1. Before you start (once)**
- Add both Spotify accounts under **User Management** in the Spotify Developer
  Dashboard — a development-mode app rejects any account that is not listed.
- Install the build on both phones and grant **location** and **notifications**
  on each. Deny either one and the demo will not show what you want.
- Start music playing on **both** phones and leave it playing.

**2. The demo (record in one take)**
- Open the app on both phones, standing a few metres apart. Within a minute each
  phone shows the other's pin, track and album art, with a real distance.
- Walk ten metres apart and watch the distance update, then walk back.
- Tap the other person's pin to nudge them — the second phone raises a
  notification.
- Open **Share My Vibe** on one phone to show the card and the share sheet.

**3. If a pin does not appear**
- Wait the full 60 seconds — presence refreshes on a one-minute heartbeat.
- Background and reopen the app. That forces an immediate refresh.
- Confirm music is genuinely playing on the missing phone, not paused.
- Both phones must be within 300 ft of each other. They almost certainly are.

Record vertically, keep it under 45 seconds, and lead with both screens showing
each other's tracks — that is the moment that explains the whole product.
