# Google sign-in — built, and what you must do to switch it on

Built in sprint 3. It does exactly one thing: keeps a copy of your board in
**your own** Google Drive, in a private folder only this app can see.

## What it is wired to

`drive.appdata` — the narrowest scope that does the job. It gives access to a
hidden folder Drive sets aside for this app alone. The app cannot see, list or
touch a single other file in your Drive, and no other app can read what it
writes. One file, always overwritten: a backup, not a history.

The access token is held in memory for the session and never written to disk.
Staying signed in permanently needs a refresh token, which needs a server to
hold the client secret, which is a backend this app does not have and should
not want. Backing up is something you choose to do, so signing in at that
moment is not a hardship.

## Two things you have to do

### 1. Create the OAuth client IDs

They are tied to your identity and your Google Cloud project, so they have to
be made by you. They are **not** secrets — a client ID ships inside every app
that uses one — but they are yours.

1. Make a project at <https://console.cloud.google.com>.
2. Enable the **Google Drive API** for it.
3. Fill in the **OAuth consent screen**: app name, your support email, and the
   scope `.../auth/drive.appdata`. While it is in "testing" only accounts you
   list can sign in — add your own and a classmate's to try it.
4. Create three **OAuth client IDs** under *Credentials*:
   - **Android** — needs the package name from `app.json`
     (`android.package`) and the SHA-1 of your signing key
   - **iOS** — needs the bundle identifier (`ios.bundleIdentifier`)
   - **Web** — needed by the library even on a phone
5. Paste all three into `GOOGLE` in `src/config.ts`.

Until they are filled in, the app hides the Google half of the backup sheet
rather than showing a button that cannot work.

### 2. Build a development build

**Google sign-in will not work in Expo Go.** Expo Go's redirect URI is an
`exp://` address on your local network, which Google rejects — and the hosted
auth proxy that used to paper over this was removed. This is not something
code can work around.

```bash
npx expo run:android      # or: eas build --profile development --platform android
```

A development build also wants the Android client ID's SHA-1 to match the key
it was signed with, so do step 1 first.

## What works right now, with no account at all

**Save a copy** and **Restore from a file**, at the bottom of the board. The
whole thing — every note, finished ones included — written to a JSON file you
send wherever you like. No account, no network, no server to trust, and it
works on a bad connection. For most people, most of the time, this is the
backup that actually gets used, which is why it is listed first on the sheet.

## The one rule both paths share

**Restoring only adds notes that aren't here.** It never overwrites a note
and never deletes one. The copy on this phone may well be newer than the copy
in the file, and silently replacing it with an older version is
indistinguishable from losing work. So running a restore twice is harmless,
and running it on the wrong phone costs you nothing. 13 tests cover the parser
alone, including that a single damaged note rejects the whole file rather than
half-restoring it.

## What this still is not

It is a **backup**, not sync. Two phones editing one board, offline, is a
different and much harder product — the fractional ordering in
`db/positions.ts` would have to survive two people reordering the same section
with no network between them. That remains out of scope, and the brief was
right to put it there.
