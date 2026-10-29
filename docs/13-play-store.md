# 13 — Google Play release

Everything Play asks for, written down once so the console can be filled in without
inventing answers under time pressure. Nothing here is aspirational: each line
describes what the code in this repo actually does on 29 October 2026.

---

## 1. Identity

| Field | Value |
| --- | --- |
| App name (Play, 30 char max) | `still. — a calm task board` |
| Package name | `com.haiderimran.still` |
| Version name | `1.0.0` |
| Version code | `1` (EAS auto-increments after this; `eas.json` sets `autoIncrement`) |
| Default language | English (United States) |
| Category | Productivity |
| Contact email | thehaiderimran19@gmail.com |
| Website | https://haiderimran019.github.io/still-board/ |
| Privacy policy | https://haiderimran019.github.io/still-board/privacy.html |

The package name can never be changed once an app is published, so it is set in
`app.json` and must not be edited again.

---

## 2. Store listing copy

**Short description** (80 characters max — this one is 71):

```
Your life, on one calm board. Seven things today. Everything else waits.
```

**Full description** (4000 max; this is ~1,500):

```
still. is a board for everything you are carrying, made to feel like relief
rather than another list that grows while you sleep.

Four places for a thought to live:

Now — what you are doing today. Seven things, and no more. When Now is full,
adding something means finishing, moving or deleting something else. That is
not a limitation. It is the whole idea.

Next — soon, but not today.

Next week — it has a date in mind, just not this one.

Someday — the things you want to want. They sit quietly and do not nag.

• Write a note and it lands on the board like a sticky note.
• Drag it anywhere — a different place in the list, or a different section.
• Swipe right to edit, swipe left to delete.
• Give a note a colour when it is urgent. The whole note changes, so you can
  see it from across the room.
• Set a reminder on anything in Now. Not an alarm clock — a quiet tap on the
  shoulder this evening.
• Clear a note and watch it go. Done notes keep for a month, then let go.
• Day or night theme, or whichever one your phone is in.

It works with no signal, no account and no network, because everything lives
on your phone. There is no server. There are no ads, no tracking and nothing
to subscribe to.

Sign in with Google only if you want the same board on more than one phone.
Your notes go into a private folder in your own Google Drive that no other app
can read — and syncing only ever adds, so nothing you wrote is ever quietly
replaced by an older copy.

Built in Pakistan, for anyone with more on their mind than fits in their head.
```

**Graphics still to produce** (Play will not accept the listing without them):

| Asset | Size | Notes |
| --- | --- | --- |
| App icon | 512×512 PNG, 32-bit | from `assets/icon.png`, upscaled |
| Feature graphic | 1024×500 PNG | board on `#fdf7ec`, wordmark bottom-left |
| Phone screenshots | ≥ 2, 1080×1920 or better | board, a full Now, the theme toggle, profile |

Screenshots have to come off a real device or emulator running the built app,
so they are the one part of this that cannot be produced from the repo alone.

---

## 3. Data safety declaration

Play's definition of "collected" is *leaves the device*, which is narrower than
it sounds and wider than people assume. Answers below match that definition.

**Does your app collect or share any of the required user data types?** — Yes
(only when the person signs in; see "optional" below).

| Data type | Collected | Shared | Optional | Purpose |
| --- | --- | --- | --- | --- |
| Personal info → Name | Yes | No | Yes | App functionality, Account management |
| Personal info → Email address | Yes | No | Yes | App functionality, Account management |
| App activity → Other user-generated content (the notes) | Yes | No | Yes | App functionality |

Everything else in the questionnaire is **No**: no location, no contacts, no
photos, no files, no financial info, no health, no messages, no device IDs, no
analytics, no advertising, no crash logs.

Supporting answers:

- **Is all data encrypted in transit?** Yes — the only network calls are HTTPS
  to Google's own OAuth and Drive endpoints.
- **Do you provide a way for users to request data deletion?** Yes. In-app:
  delete notes, or uninstall. Off-device: Drive → Settings → Manage apps →
  still. → Delete hidden app data, documented on the privacy page.
- **Is any of this data collected from children?** No; the app is not directed
  at children.
- **Independent security review?** No.

Why name and email are listed at all: Google returns them to the app at
sign-in and the profile screen shows the email so you can tell which account
you are on. They are held in memory, never written to the database, and never
sent anywhere. Listing them is the conservative reading of the question.

Why the notes are listed: signed in, they are written to `appDataFolder` in
the person's own Drive. That is off the device, so it is collection, even
though the destination is their account and not ours.

---

## 4. Content rating questionnaire (IARC)

| Question | Answer |
| --- | --- |
| Category | Utility, Productivity, Communication or Other |
| Violence, sexuality, language, controlled substances, gambling | No to all |
| Does the app allow users to interact or exchange content? | **No** — notes never travel between users |
| Does the app share the user's location with other users? | No |
| Does the app allow purchases of digital goods? | No |
| Does the app contain user-generated content shared publicly? | No |

Expected rating: Everyone / PEGI 3.

---

## 5. The rest of the console

| Section | Answer |
| --- | --- |
| Ads | No ads |
| App access | All functionality is available without restriction. Google sign-in is optional and reviewers do not need an account. **Say this in the notes field** so review does not stall asking for test credentials. |
| Target audience | 13 and over |
| News app | No |
| COVID-19 contact tracing | No |
| Data deletion | In-app deletion + Drive instructions (URL above) |
| Government app | No |
| Financial features | None |
| Health | None |

### Permissions the build will declare

`INTERNET`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`,
`WAKE_LOCK` — all from expo-notifications and the network stack, none of them
sensitive, none requiring a declaration form.

`SCHEDULE_EXACT_ALARM` and `USE_EXACT_ALARM` are **blocked** in `app.json`.
Reminders here are "this evening", not "08:04:00 exactly". Exact alarms are a
Play-restricted permission intended for alarm clocks and calendars, and asking
for one we do not need is a review problem we would deserve.

---

## 6. Building it

Once, on the machine doing the build:

```bash
npm install -g eas-cli
eas login
eas build:configure      # writes the EAS project id into app.json
```

A test build you can sideload on your own phone — do this one first:

```bash
eas build -p android --profile preview
```

The release build Play actually takes (an `.aab`):

```bash
eas build -p android --profile production
```

Then either upload the `.aab` by hand in the console, or:

```bash
eas submit -p android --latest
```

`eas submit` needs a Google Play service account JSON, which is set up inside
the Play Console under Setup → API access. Uploading by hand for the first
release is simpler and skips that entirely.

### The one thing that must happen after the first build

Google sign-in on Android needs an OAuth client tied to the signing
certificate, and that certificate does not exist until EAS has built the app
once. After the first build:

```bash
eas credentials                 # Android → production → read the SHA-1
```

Create an **Android** OAuth client in the Google Cloud console with package
`com.haiderimran.still` and that SHA-1, then put its id in
`GOOGLE.androidClientId` in `src/config.ts` and rebuild. Until that is done,
the sign-in row simply does not appear on Android — the app checks
`googleConfigured()` first — so the build is shippable without it. Everything
except sync works. Detail is in [12-google-signin.md](12-google-signin.md).

If you later let Play manage the signing key (Play App Signing, which is the
default), Play's own certificate gets a *second* SHA-1, shown under Setup →
App integrity. Add that one to the same OAuth client too, or sign-in will work
in your test build and fail for everyone who installs from the store.

---

## 7. Before pressing publish

- [ ] `npm test` — 102 assertions, all green
- [ ] `npx tsc --noEmit`
- [ ] `npx expo-doctor` — 20/20
- [ ] `eas build -p android --profile preview`, installed on a real phone
- [ ] Walked through: add, drag between sections, swipe to edit, swipe to
      delete, fill Now to seven, set urgency, set a reminder and wait for it,
      switch theme, sign in, sign out, sign in on a second phone
- [ ] Screenshots taken from that build
- [ ] Privacy policy URL loads
- [ ] Internal testing track first, a few real people, then production

The checklist above is the honest gate. Everything in this repo has been
verified by tests and by bundling; none of it has been run on a physical
Android phone by the person writing this file.
