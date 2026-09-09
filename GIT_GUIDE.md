# Git for Vibin

What Git and GitHub actually do, explained with this repository as the worked
example — including the three errors that cost real time, and what they were
telling you.

`mrcsylver/Vibin-app` · 9 commits · 60 files

---

## The one idea

Git is a save history for a folder. Not "the last version" — *every* version,
forever, each one labelled with what changed and why.

Think of the "Duplicate" habit: `app-final.zip`, `app-final-2.zip`,
`app-final-ACTUALLY.zip`. Git is that instinct done properly. You keep working
in one folder, and at moments you choose, you tell Git "remember this exact
state, and here's a sentence about what I did." You can return to any of those
moments, and you can see precisely what changed between any two.

**Git** is the tool doing that on your Mac. **GitHub** is a website that stores
a copy of it. They're separate things that people say in one breath.

---

## Four words

Everything else is built out of these.

**repository** — The folder, plus its whole history. Yours is
`~/Downloads/Vibin-app`. The history lives in a hidden `.git` folder inside it;
delete that and you have an ordinary folder with no memory.

**commit** — One save point. A snapshot of every file at that instant, plus a
message, an author and a time. It gets a short ID like `d248aa7` so you can
refer to it.

**branch** — A named line of commits. Yours is
`claude/vibin-completion-testflight-3jw26x`. Branches let work happen without
disturbing another line — the way a document draft doesn't overwrite the
published one.

**remote** — A copy of the repository somewhere else. Yours is called `origin`
and lives at `github.com/mrcsylver/Vibin-app`.

---

## Two computers, not one

This is the model that makes the error messages make sense. There are two
complete copies of your project's history, and nothing moves between them
unless you say so.

| Your Mac | | GitHub |
| --- | --- | --- |
| The files you edit, and a full copy of all 9 commits. Works with no internet. | `push →`<br>`← pull` | A second full copy. What you see in a browser, and what survives if the Mac dies. |

**Push** sends your commits up. **Pull** brings other commits down. When I was
working on Vibin, I pushed; you pulled. That was the whole handoff.

Git never syncs in the background. If you don't push, GitHub doesn't know. That
is a feature — it's why a half-finished experiment on your laptop can't break
anything — but it means "I saved it" and "it's on GitHub" are two different
claims.

---

## Your actual history

Real output from this repository, newest first. In the terminal it's
`git log --oneline`; on GitHub it's the "commits" link above the file list.

| ID | Date | What changed |
| --- | --- | --- |
| `d248aa7` | Sep 9 | Adopt the Vibin Music / Vibin naming this project already ships under |
| `a8788d5` | Sep 9 | Take prebuild's script rewrite so a local build leaves a clean tree |
| `9c99c56` | Sep 9 | Make the local Xcode archive path work without an Apple CLI login |
| `a8d819b` | Sep 5 | Fix the App Store rejection, the Spotify and status bugs, full-bleed map |
| `f4be0db` | Sep 3 | Rebuild the share card on the Figma direction, with flex layout |
| `e40026b` | Sep 2 | Add shareable vibe card so the app is useful with nobody nearby |
| `1a964ba` | Sep 2 | Add legal links and profile view, handle non-Spotify listeners, apply icon |
| `fd9f73b` | Sep 2 | Fix location permissions, add retro map, All-Time Likes and compass |
| `eb4b785` | Sep 2 | Import Vibin as received from the Expo prototype — the untouched starting point |

That bottom commit exists on purpose. It's your prototype exactly as it
arrived, before anything was changed. Because it's there, every later change
reads as a difference from a known starting point — 47 files, 4,187 lines
added, 389 removed — instead of a folder you have to take on trust.

On GitHub, click any commit to see a red/green view: red lines were removed,
green added. That is the entire record of what happened to your app, and it
does not depend on anyone remembering.

---

## The everyday loop

Four commands, always in this order.

**1. Get what's new**

```
git pull
```

Brings down commits made elsewhere. Do this before you start editing, not after.

**2. See where you stand**

```
git status
```

Lists what you've changed since the last commit. Run it whenever you're unsure —
it is read-only and cannot break anything.

**3. Save a point in history**

```
git add -A
git commit -m "Bump build number for TestFlight"
```

`add` chooses what goes in; `-A` means everything. `commit` writes the snapshot
with your message. This is still only on your Mac.

**4. Send it to GitHub**

```
git push
```

Now the other copy has it too.

---

## The three snags you hit

None of these were breakage. Each was Git refusing to guess — worth
recognising, because they're the ones that recur.

### "Everything I type appears"

You ran `git diff` and the screen filled up, with a `:` in the corner
swallowing your keystrokes.

Git shows long output in a scroll viewer called `less`. It wasn't waiting for a
*git* command, it was waiting for a *viewer* command. Press `q` to quit. Turn it
off for good with `git config --global core.pager cat`.

### "There is no tracking information for the current branch"

`git pull` means "fetch from the remote, then merge into what I have" — but
your branch had never been told which remote branch it pairs with. Git
downloaded the commits and then stopped, because guessing wrong would merge the
wrong work into yours.

Fixed once with `git branch --set-upstream-to=origin/<branch>`. The pairing
survives; you won't see it again on that branch.

### "Your local changes would be overwritten by merge"

The important one. You had hand-edited `app.json` to rename the app, and the
incoming commits also changed that file. Git stopped rather than silently
discarding your edit.

It cost real time — the pull aborted, you didn't notice, and the next Xcode
build was made from the old configuration and would have been rejected by Apple
a second time. When a command says **"Aborting"**, nothing happened. Read that
line before running the next thing.

The resolution was to put your rename into a commit, so both changes lived in
the same history instead of fighting. That's the general shape: when two
versions disagree, someone decides — and Git wants that someone to be you.

---

## What is deliberately not on GitHub

A file called `.gitignore` lists things Git must never record. Yours excludes:

- `.env` — your Supabase and Spotify keys. This is the one that matters.
- `node_modules/` — ~600 downloaded packages, rebuilt by `npm install`.
- `ios/` — generated by `expo prebuild`, so storing it invites the stale-folder
  problem you hit.
- `*.p12`, `*.p8`, `*.mobileprovision` — Apple signing certificates.

Which is why a fresh copy from GitHub has no `.env` and the app can't reach
Supabase until you put one back. Annoying once; correct forever.

**Assume anything committed is permanent.** Deleting a secret in a later commit
does not remove it — the earlier commit still holds it, and that's the point of
a history. If a real password ever lands in a commit, treat it as exposed and
change the password. Don't try to scrub the history.

---

## Reading it in a browser

Everything above has a point-and-click equivalent at
`github.com/mrcsylver/Vibin-app`. Three things are worth knowing:

- **The branch dropdown**, top-left of the file list. You are on
  `claude/vibin-completion-testflight-3jw26x`, not `main` — if a file looks
  wrong, check which branch you're viewing.
- **The commits link**, above the file list. The same nine entries; click one
  for its red/green diff.
- **History**, on any file page. Shows only the commits that touched that file —
  the fastest way to answer "when did this change and why?"

A **pull request** is GitHub's formal "please merge this branch into that one,"
with room for discussion. You never needed one, because nobody else was
reviewing. Worth knowing the phrase; not worth learning now.

---

## When you shut it all down

These are separate services and they end differently.

- **GitHub** — free and unlimited for private repositories. Leaving it alone
  costs nothing and is the safest option. If you want it gone, take a copy
  first: Code → Download ZIP gives you the files, though it drops the history.
  To keep the history, keep the folder on your Mac with its `.git` inside.
- **Supabase** — free projects pause after inactivity and can eventually be
  removed. This is where the app's actual data lives, so export anything you
  care about before it lapses.
- **Apple** — the $99/year membership is the one with a real deadline.
  TestFlight builds expire 90 days after upload regardless.
- **Your `.env`** — never on GitHub, so it exists only on your Mac. If the app
  might return, save those three lines somewhere safe.

If Vibin restarts in six months, the repository is what makes that a resumption
rather than a rewrite. Nine commits and a description of every change is a cheap
thing to keep.

---

## Cheat sheet

| Command | What it does |
| --- | --- |
| `git status` | What have I changed? Safe, read-only. |
| `git pull` | Bring down anything new from GitHub. |
| `git add -A` | Mark everything to go into the next save point. |
| `git commit -m "..."` | Make the save point, with a message. |
| `git push` | Send your commits to GitHub. |
| `git log --oneline` | List the history. `q` to exit. |
| `git --no-pager diff` | Show unsaved changes without the scroll viewer. |
| `git checkout -- <file>` | Throw away your edits to one file. Cannot be undone. |
| `git branch --show-current` | Which branch am I on? |

One habit worth more than the rest: **read the last line before you run the next
command.** Git says "Aborting" or "Updating" or "error:" and then does exactly
what it said. Every snag in this guide was Git telling you plainly and the
message scrolling past.
