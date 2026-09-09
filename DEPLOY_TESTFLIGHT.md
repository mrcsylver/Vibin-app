# Putting Vibin on TestFlight — step by step

Written for someone who has never shipped an app. Every command is meant to be
copied and pasted exactly. If a step doesn't look like what's described here,
stop and check the Troubleshooting table at the bottom rather than guessing.

**Roughly how long:** about 40 minutes the first time, of which ~25 is waiting.
After that, a new version takes two commands and about 30 minutes of waiting.

---

## A few words you'll see

| Word | What it means |
| --- | --- |
| **TestFlight** | Apple's app for handing test versions to people before the App Store. |
| **EAS** | Expo's build service. It turns your code into a real iPhone app on their computers, so you don't have to fight Xcode. |
| **Build** | One finished copy of the app. Each has a build number that goes up by one. |
| **Bundle ID** | Your app's permanent unique name. Yours is `com.marcsylver.Vibin`. Don't change it. |
| **Terminal** | The black text window on your Mac. Open it with Cmd+Space, type `Terminal`, press Enter. |

Throughout, `cd ~/Downloads/Vibin-app` means "go to the project folder". Change
that path to wherever you actually unzipped it.

---

# Part 1 — One-time setup

You only ever do this part once.

## 1.1 Update the database

The app now keeps a permanent count of likes, which needs a small database
change. **Skip this and the profile screen will show an error.**

1. Go to your Supabase dashboard and open your project.
2. In the left sidebar click **SQL Editor**, then **New query**.
3. Open `schema.sql` from the project folder in TextEdit, select all, copy.
4. Paste it into the Supabase editor and click **Run**.

You should see "Success". It's safe to run more than once — it won't delete
anything.

**Run it again for this build.** It now also adds the function behind the new
"Delete my data" button, which Apple requires before an App Store release.

## 1.2 Check your Supabase address

Last time I found your `.env` file had a password pasted where the web address
should be. I corrected it to:

```
EXPO_PUBLIC_SUPABASE_URL=https://ajwdrjsetcfryzqtcztg.supabase.co
```

Please confirm it matches: Supabase dashboard → **Project Settings** →
**Data API** → **Project URL**. If it's different, open `.env` in TextEdit and
fix that line.

## 1.3 Tell Spotify about the app

1. Go to the Spotify Developer Dashboard and open your app.
2. Click **Settings**, then **Edit**.
3. Under **Redirect URIs**, add exactly this and click **Add**, then **Save**:

```
vibin://spotify-auth
```

Without this, the Spotify login screen will refuse to come back to your app.

## 1.4 Install the build tool

Open Terminal and run these one at a time:

```bash
npm install -g eas-cli
```

```bash
eas login
```

It asks for your Expo account email and password. If you don't have an Expo
account, make one free at expo.dev first.

Also open **Xcode** once from your Applications folder and accept the licence
agreement it shows. Command-line builds fail with a confusing error if you skip
this.

## 1.5 Install the project

```bash
cd ~/Downloads/Vibin-app
npm install
```

This takes a couple of minutes and prints a lot of text. Warnings are normal.
Errors in red are not — if you see those, stop.

## 1.6 Hand your passwords to the build service

Your `.env` file holds your Supabase and Spotify keys. It is deliberately **not**
uploaded with your code, so the build service needs its own copy. Run all three:

```bash
eas env:push production --path .env
```
```bash
eas env:push preview --path .env
```
```bash
eas env:push development --path .env
```

Then check it worked:

```bash
eas env:list production
```

You should see three lines: `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`.

**If you skip this step the app installs fine and then shows an error message
instead of the sign-up screen.** It is the single most common way this goes
wrong.

---

# Part 2 — Build the app

```bash
cd ~/Downloads/Vibin-app
eas build --platform ios --profile production
```

The first time, it asks a few questions:

- *"Do you want to log in to your Apple account?"* → **yes**, then sign in.
- *"Generate a new Apple Distribution Certificate?"* → **yes**.
- *"Generate a new Apple Provisioning Profile?"* → **yes**.

Say yes to anything about letting EAS manage certificates. Those are Apple's
security files; letting EAS handle them avoids a lot of pain.

Then it uploads your code and builds. **This takes 15–25 minutes.** You can close
the Terminal — it keeps building on their servers, and the link it printed shows
progress.

When it finishes you'll see `Build finished` and a green tick.

---

# Part 3 — Send it to TestFlight

```bash
eas submit --platform ios --latest
```

- It asks for your Apple ID and password again.
- If your app doesn't exist in App Store Connect yet, it offers to create it.
  Say **yes**.
- `--latest` just means "use the build I just made".

This takes 2–5 minutes to upload. Then **Apple needs another 5–15 minutes** to
process it before it appears anywhere. Go make a coffee.

---

# Part 4 — Invite your testers

1. Go to **appstoreconnect.apple.com** and sign in.
2. Click **My Apps**, then **Vibin**.
3. Click the **TestFlight** tab at the top.
4. Wait until your build stops saying "Processing".

### If Apple asks about encryption

It shouldn't — the answer is already set in the project. If it does ask, the
answer is **No**, your app does not use non-exempt encryption.

### Adding people (the closed beta)

For a closed beta, use **Internal Testing**. This is the fast path:

- Up to 100 people.
- **No review by Apple** — testers get it within minutes.
- Each person must first be added under **Users and Access** in App Store
  Connect (invite them by email, the "Customer Support" role is enough).

Steps: TestFlight tab → **Internal Testing** → **+** next to Testers → tick the
people → **Add**. They get an email with a link, install Apple's **TestFlight**
app, and your app appears there.

> **External Testing** (up to 10,000 people, no App Store Connect account
> needed) exists too, but the first build must pass **Beta App Review**, which
> takes a day or two. If you go that route, put a working **Spotify account
> username and password** in the review notes — the reviewer physically cannot
> get past your sign-up screen without one.

### One thing to warn your testers about

The radar only shows people **within 300 feet who also have the app open**. On
their own, testers will see an empty map. Tell them to test in pairs, in the
same room.

There is now something to do alone, though: **Share my vibe** turns whatever
they are playing into a retro card they can post to an Instagram or Snapchat
story. Ask your first testers to post one — that is what brings the next
testers in. It works even with nothing playing on Spotify.

---

# Part 2b — Building in Xcode instead of EAS

Use this route if `eas build` asks **"Do you want to log in to your Apple
account?"** and you do not have that password. Xcode uses the account already
signed into it, so no Apple login is needed anywhere. Press **Ctrl+C** to get out
of that EAS prompt — do not answer `n`, because it then asks you to paste a
certificate and provisioning profile you would need the same login to create.

```bash
cd ~/Downloads/Vibin-app
npx expo prebuild --platform ios --clean
```
```bash
npx pod-install
```
```bash
open ios/*.xcworkspace
```

The project is called **VibinMusic**, after `expo.name` in `app.json`. The name
under the app icon is `CFBundleDisplayName` (`Vibin`), and App Store Connect
matches on the bundle identifier, not either name.

Then in Xcode:

1. Click **VibinMusic** at the top of the left sidebar, then the **VibinMusic**
   target.
2. **Signing & Capabilities** → tick **Automatically manage signing** → choose
   your **Team**. Every red error in that pane should clear.
3. In the top bar next to the app name, set the destination to **Any iOS Device
   (arm64)**. Archive stays greyed out while a simulator is selected.
4. Menu bar → **Product** → **Archive**. Ten to twenty minutes.
5. The Organizer window opens when it finishes → **Distribute App** → **App
   Store Connect** → **Upload**.

Then pick up at **Part 4** to invite testers.

Two things this route handles differently:

- **`.env` must be in the project folder.** It is read during the build, which is
  why this route does not need step 1.6 at all.
- **The build number lives in `app.json`.** Bump `ios.buildNumber` by one before
  each upload — App Store Connect rejects a number it has already seen. It is at
  `2` now, because build `1` was the rejected delivery.

Before spending twenty minutes on an archive, check the generated config is the
one you expect:

```bash
plutil -p ios/VibinMusic/Info.plist | grep -E 'NSMotionUsage|CFBundleVersion'
```

`CFBundleVersion => 2` and a motion string present means the rejection is fixed.
If either is missing, `ios/` is stale — re-run `prebuild --clean`.

If `npx pod-install` fails saying CocoaPods is missing, run
`sudo gem install cocoapods` once, then try again.

---

# Part 5 — Releasing a new version later

Change your code, then just:

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

The build number goes up automatically — you don't have to touch it. Only edit
the `"version"` line in `app.json` (e.g. `"1.0.1"`) when you want the version
users *see* to change.

Builds expire after **90 days**, so testers will need a fresh one eventually.

---

# Part 6 — Before the real App Store release

## Your Terms and Privacy links

The app already shows **Terms of Service** and **Privacy Policy** buttons at the
bottom of the sign-up screen and inside the profile screen. Right now tapping
one shows a short "not published yet" note — which is fine for a closed beta.

When your documents are ready, open `utils/legal.ts` in TextEdit and put the
addresses between the quote marks:

```js
export const LEGAL_URLS: Record<LegalDocument, string> = {
  terms: 'https://your-page.notion.site/terms',
  privacy: 'https://your-page.notion.site/privacy',
};
```

Rebuild and the same buttons open the real pages. Nothing about the layout
changes, so there's no risk of breaking the screen. Only addresses starting with
`https://` are accepted, so a half-typed link can't ship as a dead button.

## App Privacy questionnaire

Apple asks what data you collect before an App Store release. For Vibin:

| Data | What to answer |
| --- | --- |
| Precise Location | Collected · App Functionality · **not** used for tracking |
| User ID | Collected (a scrambled version of the Spotify ID, never the real one) · App Functionality · not used for tracking |
| Other Usage Data (current song) | Collected · App Functionality · not used for tracking |

Nothing is sold and nothing is used for advertising.

## Background location note

Apple always asks why an app needs location in the background. Paste this:

> Vibin shows people within 300 ft of each other what they are listening to on
> Spotify. Background location refreshes the user's own pin so nearby users keep
> seeing an accurate position while walking. Presence records are deleted 15
> minutes after the user goes quiet, and other users only ever receive distance
> and bearing, never coordinates.

---

# Troubleshooting

| What you see | What it means | Fix |
| --- | --- | --- |
| App opens on "Add your Supabase URL to .env" | The build service didn't get your keys | Redo step 1.6, then rebuild |
| "EXPO_PUBLIC_SUPABASE_URL must look like https://your-project-ref.supabase.co" | A key got pasted where the address goes | See step 1.2 |
| Profile screen errors, likes stuck at 0 | Database not updated | Redo step 1.1 |
| Spotify login opens then shows an error | Redirect address missing | See step 1.3 |
| Radar says "Location access needed" | The tester tapped Don't Allow | Normal — the button on that screen opens iOS Settings |
| Map is empty | Nobody else is within 300 ft with the app open | Not a bug. Test in pairs, and use Share my vibe meanwhile |
| Share sheet has no Instagram or Snapchat | Those apps are not installed on that device | Use Save Image, then post it from the app itself |
| "You're on ..." never appears | Nothing playing on Spotify | Not a bug — the app now says so and asks them to set a status instead |
| Build fails mentioning certificates or `aps-environment` | Apple's security files got confused | Run `eas credentials`, pick iOS → production, and let EAS regenerate them |
| `command not found: eas` | Build tool not installed | Redo step 1.4 |

---

## Changing the share card

The card lives in `components/VibeCard.tsx`. Sizes are all ratios of one number
(`DESIGN_WIDTH = 390`) via the `s()` helper, so changing a value keeps its
proportion on every screen size. Layout is flex, not fixed offsets, which is why
a long track title pushes the rows below it instead of overlapping them.

The two pixel typefaces live in `assets/fonts/` and are loaded in `App.tsx`.
Both are SIL Open Font Licence, which permits commercial use.

## For a developer (technical reference)

- `app.json` holds static config; `app.config.js` layers on the two things that
  depend on the build profile — the `aps-environment` entitlement (Development
  profiles need `development`, Ad Hoc and App Store need `production`) and
  mirroring `EXPO_PUBLIC_*` into `extra`.
- `eas.json` maps each build profile to the matching EAS environment.
- The `ios/` and `android/` folders are generated by `npx expo prebuild` and are
  gitignored. Never edit them by hand.
- To build locally instead, see Part 2b. `app.config.js` resolves
  `aps-environment` to `production` unless `EAS_BUILD_PROFILE=development`, so a
  bare local prebuild is already correct for an App Store archive.
- `eas.json` uses `appVersionSource: "local"`, so the build number in
  `app.json` is the single source of truth for both EAS and Xcode.
- `assets/icon.png` is deliberately stored without an alpha channel; App Store
  Connect rejects icons that have one.
