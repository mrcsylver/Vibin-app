# Pitching Vibin to developers

Ready-to-post copy for indie developer communities. Companion to
[`MARKETPLACE_LISTING.md`](./MARKETPLACE_LISTING.md), which holds the
SideProjectors / Flippa listing fields.

Lead with the build, not the business. This audience buys code, not traction —
and responds to a seller who doesn't oversell. The honesty is the
differentiator; don't sand it off.

---

## Where to post

| Venue | How it lands |
| --- | --- |
| **r/SideProject** | The most receptive. "Selling my finished side project" is normal there. |
| **Indie Hackers** | Good home for the long post. People genuinely read there. |
| **r/iOSProgramming**, **r/reactnative** | Technical crowd. Lead with the stack, sale second. Read the sidebar rules first — both restrict self-promotion. |
| **X / Twitter** | Short version plus the demo video. `#buildinpublic` reaches the right people. |
| **Hacker News** | Skip it. "Show HN" is for things people can try; sale posts get buried. |

## Titles

```
Selling Vibin — a 300ft Spotify proximity radar (Expo + Supabase/PostGIS, full source)

I built an app that shows what everyone within 300ft is playing on Spotify. I'm selling it.

[For sale] Finished React Native + PostGIS proximity app — no users, honest listing
```

---

## Short version

For a comment, a DM, or a tweet with the video attached.

```
I built a proximity music app: open it and you see everyone within 300ft of you and what they're playing on Spotify right now, placed by real distance and compass bearing.

Expo / React Native, Supabase + PostGIS for the proximity search, Spotify OAuth with PKCE. The entire backend is one 400-line SQL file — no server to run.

It's finished and runs on TestFlight, but I've moved on and I'm selling the source. No users, no revenue — it's a code sale, not a business. ~4,900 lines of strict TypeScript, full docs, sold as-is.

Happy to answer questions about the stack whether or not you're buying.
```

---

## Long version

For a forum post. Put the demo video at the top.

```
I spent about three months building a proximity music app and I'm selling the source. Here's what it is and what I learned, whether or not you're in the market.

WHAT IT DOES

Open it and you get a radar of everyone within 300 feet and what they're playing on Spotify right now — track, album art, status line — placed by real distance and compass bearing on a procedurally generated 16-bit overworld map. Tap someone to nudge them. Nobody's location is ever shared: the server returns distance and direction only.

THE STACK

- Expo SDK 57 / React Native 0.86 / React 19, New Architecture on
- TypeScript 6 strict, ~4,900 lines across 37 files, compiles with zero errors
- Supabase Postgres + PostGIS: presence is a geography(Point, 4326) column behind a GiST index, proximity is ST_DWithin at 91.44m with ST_Azimuth for bearing
- Rows expire 15 minutes after the last heartbeat, via a statement trigger and a pg_cron job
- Spotify OAuth 2.0 with PKCE — no client secret in the app
- No API server, no Docker, no queue. The whole backend is one idempotent SQL file you paste into Supabase.

THE PARTS THAT ACTUALLY COST ME TIME

These are the reason the codebase is worth something:

- Spotify's now-playing endpoint returns item: null for perfectly audible music if you omit market=from_token. Drop additional_types and podcasts vanish too. And currently-playing intermittently answers 204 mid-track-change while /me/player answers correctly. All three handled, six distinct playback states parsed.
- Expo release builds silently drop environment variables that work fine in dev, because the Babel transform only inlines *static* process.env.X reads. A computed lookup resolves to undefined in the release bundle and nowhere else. That one shipped before I caught it.
- iOS location permissions have an ordering problem that only bites returning users — the app can reach the map screen before permissions resolve.
- Apple rejects builds over permission strings you never asked for: expo-location links CoreMotion, so you need NSMotionUsageDescription whether or not you touch motion.

Each of those is fixed, and the reasoning is in the code rather than lost.

HONEST STATUS

No users. No revenue. No traction. I built it for a campus pilot I didn't end up running. It builds, signs, uploads to App Store Connect, clears Apple's processing and runs on TestFlight — but I never completed a full App Store review, because I stopped work on it. Android builds and runs but has never been through a Play Store submission.

Sold as-is, no post-sale support, which is why the documentation is thorough: the deploy guide takes a complete beginner from a fresh Mac to a TestFlight build.

WHAT A BUYER WOULD DO NEXT

Apple Music support is the obvious first move — the playback layer is already abstracted behind one interface with an explicit "not linked" state, so a second provider slots in without touching UI code. After that, pick somewhere dense and pilot it. This is a density product: dead with two users, fun with fifty.

The proximity layer also generalises. The PostGIS presence model, the 15-minute expiry and the privacy design (hashed IDs, distance-and-bearing-only responses) would carry a dating, events, conference or campus app with no music in it at all.

Listing and price in the comments. Happy to talk about any of the above regardless.
```

---

## Four rules for the replies

1. **Say it's a sale in the first two lines.** Burying it reads as bait and the
   thread turns on you.
2. **Never claim App Store approval.** The true answer — "it runs on TestFlight,
   I never finished a full review" — is unremarkable and costs nothing.
3. **Answer technical questions properly, even from people who will never buy.**
   That is what makes a thread worth reading, and threads that get read get
   buyers.
4. **Post once per community.** Reposting to farm attention is the fastest way
   to get banned from the two subreddits that were actually going to work.

The strongest line in any of this: *"No users, no revenue — it's a code sale,
not a business."* Say it early and plainly. Most listings won't, and the people
who have been burned by those listings are exactly who you want replying.
