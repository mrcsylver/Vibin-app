# Shipping Vibin to TestFlight

Everything below assumes the Mac with Xcode and the paid Apple Developer account.
Follow it top to bottom the first time; after that only **Step 5** and **Step 6**
are needed for each new build.

---

## 0. Two things you must do before anything else

### 0a. Re-run `schema.sql` in Supabase

The All-Time Likes feature added a new table (`like_totals`) and a new RPC
(`all_time_likes`), and it changed `insert_like`. **The app will error on the
likes screen until you run it.**

Supabase Dashboard → **SQL Editor** → paste the whole of `schema.sql` → **Run**.
The file is idempotent (`create ... if not exists`, `create or replace`), so
re-running it is safe and will not touch existing rows.

### 0b. Your Supabase URL in `.env` was wrong — I fixed it

`.env` had this in the URL slot:

```
EXPO_PUBLIC_SUPABASE_URL=https://sb_publishable_...supabase.co
```

That is a Supabase **publishable API key**, not a project URL, and that hostname
does not resolve — every Supabase request would have failed. Your real project
ref (decoded from the `ref` claim inside your anon key) is `ajwdrjsetcfryzqtcztg`,
so I corrected it to:

```
EXPO_PUBLIC_SUPABASE_URL=https://ajwdrjsetcfryzqtcztg.supabase.co
```

Please confirm this matches **Project Settings → Data API → Project URL** in your
Supabase dashboard. `services/config.ts` now rejects a malformed URL at startup
instead of failing silently later.

---

## 1. Prerequisites

```bash
node -v          # 20 or newer
xcode-select -p  # Xcode command line tools installed
npm install -g eas-cli
eas login
```

Open Xcode once and accept the licence agreement, or command-line builds fail.

---

## 2. Install and sanity-check the project

```bash
cd Vibin-app
npm install
npx tsc --noEmit     # must be clean
npx expo-doctor      # all checks should pass
```

---

## 3. Spotify dashboard (one time)

Spotify Developer Dashboard → your app → **Settings** → **Redirect URIs**, add:

```
vibin://spotify-auth
```

The onboarding screen prints the exact URI it will use at the bottom — if it ever
differs, trust the screen and paste that value instead.

---

## 4. Give EAS your environment variables (one time)

`.env` is gitignored, so **EAS Build never receives it**. Without this step the
app installs and then reports that it is not configured.

```bash
eas env:push production  --path .env
eas env:push preview     --path .env
eas env:push development --path .env
```

If your `eas-cli` wants a different shape, check `eas env:push --help`, or set
them one at a time:

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://ajwdrjsetcfryzqtcztg.supabase.co" --type string --visibility plaintext
```

Verify before building:

```bash
eas env:list production
```

All three of `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` and
`EXPO_PUBLIC_SPOTIFY_CLIENT_ID` must be listed. `eas.json` points each build
profile at the matching environment, so they are picked up automatically.

---

## 5. Build

```bash
eas build --platform ios --profile production
```

First run only, EAS asks about credentials — answer **yes** to letting EAS
generate and manage the Distribution Certificate and Provisioning Profile. It
will also enable the Push Notifications capability on the App ID, which the
build needs because `expo-notifications` is installed.

`eas.json` uses `"appVersionSource": "remote"` with `"autoIncrement": true`, so
the build number increments on the server. You do **not** need to bump anything
by hand. Bump `"version"` in `app.json` (e.g. `1.0.1`) only for a user-visible
release version.

The build takes roughly 15–25 minutes.

---

## 6. Submit to TestFlight

```bash
eas submit --platform ios --latest
```

It prompts for your Apple ID and, if the app record does not exist yet, offers
to create it in App Store Connect. Accept.

Processing on Apple's side takes another 5–15 minutes before the build shows up
in TestFlight.

---

## 7. App Store Connect, first submission only

**App Privacy** (required before TestFlight external testing). What Vibin
actually transmits:

| Data | Answer |
| --- | --- |
| Precise Location | Collected · App Functionality · **not** used for tracking |
| User ID | Collected (a SHA-256 hash of your Spotify id — never the raw id) · App Functionality · not used for tracking |
| Other Usage Data (current track) | Collected · App Functionality · not used for tracking |

Nothing is used for advertising, and no data is sold.

**Export compliance** is already answered — `ITSAppUsesNonExemptEncryption: false`
is set in `app.json`, so App Store Connect will stop asking per build.

**Background location review note.** Apple always asks why an app needs
"Always" location. Paste something like:

> Vibin shows people within 300 ft of each other what they are listening to on
> Spotify. Background location refreshes the user's own pin so nearby users keep
> seeing an accurate position while walking. Presence rows are deleted 15 minutes
> after the user goes quiet, and other users only ever receive distance and
> bearing, never coordinates.

**Testers.** Internal testers (up to 100 people on your team) get the build with
**no App Review**. External testers require Beta App Review — for that, supply a
working **Spotify account** in the review notes, because the reviewer cannot get
past onboarding without one, and the radar looks empty unless a track is playing.

---

## 8. Building locally in Xcode instead (optional)

```bash
npx expo prebuild --platform ios --clean
npx pod-install
open ios/Vibin.xcworkspace
```

Then Product → Archive → Distribute App. The `ios/` folder is gitignored and is
generated output — never edit it by hand, because the next `prebuild --clean`
discards your changes. Everything native is configured through `app.json` and
`app.config.js`.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| App opens on "Add your Supabase URL to .env" | Step 4 was skipped, or a value is wrong. Run `eas env:list production`. |
| "EXPO_PUBLIC_SUPABASE_URL must look like https://your-project-ref.supabase.co" | An API key was pasted into the URL slot. See Step 0b. |
| Radar shows "Location access needed" | Expected when the permission was denied. The button opens iOS Settings. |
| Likes screen stays at 0 after a nudge | `schema.sql` was not re-run. See Step 0a. |
| Spotify login bounces back with an error | `vibin://spotify-auth` missing from the Spotify dashboard. See Step 3. |
| Codesign error mentioning `aps-environment` | You built with a hand-made profile. Let EAS manage credentials, or make sure `EAS_BUILD_PROFILE` is set — `app.config.js` derives the entitlement from it. |
| Nothing appears on the radar | Expected unless a second device with the app is genuinely within 300 ft and playing music. Presence expires after 15 minutes of silence. |
