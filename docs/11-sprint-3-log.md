# Sprint 3 — Build log

The phone app. Branch `sprint-3/foundation`.

## Decisions taken into the build

| Question (from the plan) | Answer |
|---|---|
| Board layout | **A — one vertical scrolling board** |
| Visual identity | **Direction B carried over**, tokens ported with their measured contrast |
| Placeholder name | `still.` — in `src/config.ts` and nowhere else |
| Full-Now sheet vs defaulting to Next | **Still open.** Doesn't bite until step 4 |

## Step 1 — project, fonts, theme ✅

**Corrected from the plan:** Expo is on **SDK 58** (React Native 0.88, React
19.3), not SDK 54. The plan was written from memory; the registry was checked.

| File | What it holds |
|---|---|
| `src/config.ts` | `APP_NAME`, `TAGLINE`, `NOW_LIMIT`, `DONE_WINDOW_DAYS` — everything undecided, in one place |
| `src/theme/tokens.ts` | Both palettes, shadows, radii, the 8pt spacing scale, `MIN_TAP = 48` |
| `src/theme/typography.ts` | The type scale, and the rule: app speaks in Gabarito, you write in Shantell |
| `src/theme/useTheme.ts` | Follows the system scheme; the only file that would change if an in-app switch is ever added |
| `App.tsx` | The top of the board — wordmark, composer, Now with its gauge, three notes |

`userInterfaceStyle: "automatic"` in `app.json`, so the system theme actually
reaches `useColorScheme`.

**Verified:** TypeScript clean (`tsc --noEmit`), and rendered at 375 × 812 in
both themes — fonts load, both palettes apply, the footer reports which theme
is live. Screenshots in `mockups/`.

**Not verified:** nothing has run on a real device or in Expo Go yet. The render
check was Expo's web target, which uses the same components but not the same
renderer.

## Next — step 2: database

`expo-sqlite`, the schema from the plan, `repository.ts` as the only file that
knows SQLite exists. Done when notes survive a force-quit.

## Step 2 — the database

**Built**

- `src/db/schema.ts` — one `notes` table, schema version 1. Completed notes stay
  in the same table with `completed_at` set, so Done is a query and Undo is one
  `UPDATE`.
- `src/db/positions.ts` — fractional ordering. A reorder is a single write
  instead of renumbering a whole section.
- `src/db/migrations.ts` — versioned with SQLite's own `user_version`. Every
  future step is additive; the table is never dropped.
- `src/db/repository.ts` — the only file that knows SQLite exists.
- `src/db/driver.ts` — the connection shape the app uses, so the repository can
  be pointed at a different SQLite engine in a test.

**Two corrections to the plan**

1. *The boot had no failure path.* The first version of `App.tsx` awaited
   `repo.init()` inside an effect with no `catch`. Any failure left the app on a
   blank board-coloured screen forever — which to a user looks exactly like
   losing every note. There is now a `BootFailed` screen that says the notes are
   still on the device and shows the underlying error.

2. *Web is not a target, and `expo-sqlite` cannot bundle for it.* Metro fails on
   `Unable to resolve "./wa-sqlite/wa-sqlite.wasm"`. Rather than configure a
   platform we do not ship, `react-dom` / `react-native-web` and the `web`
   script were removed. Android and iPhone remain the targets, per the brief.

**Verified**

`npm test` — 21 assertions, all passing:

- 8 on the ordering rules, including that a gap exhausts after 52 inserts and
  that the renumber path catches it.
- 13 on the repository itself, run against a **real SQLite file** via Node's
  built-in engine, with the connection dropped and the file reopened between
  assertions to imitate a force-quit. These cover seeding once and only once,
  notes surviving a relaunch, migrations not running twice, section ordering,
  edit, reorder, cross-section move, complete, undo, the Done window, delete,
  and 50 reorders into the same gap staying distinct and ordered.

**Not verified**

Nothing has run on a phone or in Expo Go. This machine has no iOS runtime
installed and no Android emulator, so the `expo-sqlite` driver itself — as
opposed to the SQL and the logic above it — is still untested. That is the one
thing the next run on a real device needs to confirm.

## Step 3 — the board screen (read-only)

**Built**

`App.tsx` is now boot and state only. Everything on screen moved into pieces
that can be reasoned about one at a time:

- `src/screens/BoardScreen.tsx` — the whole board on one screen, Now then Next
  then Someday, always in that order.
- `src/components/NoteCard.tsx` — one sticky note. The tilt comes from the
  note's index, so a note keeps its angle across re-renders instead of
  twitching every time the board refreshes. Memoised, because a refresh
  re-renders every note and almost none of them have changed.
- `src/components/NowGauge.tsx` — how full Now is.
- `src/components/SectionHeading.tsx` — name, reason, count. Only Now shows a
  denominator, because only Now has a ceiling.
- `src/screens/sectionCopy.ts` — every word the board says, in one file.
- `src/screens/BootScreens.tsx` — the holding and failure screens from step 2.

**The 7 limit, shown three ways**

The gauge states a full Now through filled pips, the `7 / 7` count, *and* a
line of text. Colour never carries the meaning on its own — the accessibility
rule this board is held to, and also what makes it readable in sunlight. The
wording is "Now is full — that's the point of it", not a warning: a full Now is
a fact about the board, not a mistake the user made.

**A correction found while verifying**

Exporting the bundle showed **5.2MB of fonts** in it. Importing from
`@expo-google-fonts/gabarito` pulls in every weight the family ships, and we
draw with five faces. Importing each weight by its own subpath instead:

| | before | after |
|---|---|---|
| fonts in bundle | 5.2 MB | 796 KB |
| exported app | 6.9 MB | 2.4 MB |

Worth catching now rather than at launch — the first users are students in
Pakistan, where download size and storage are not free.

**Verified**

- `npm test` — 21 assertions still passing.
- `tsc --noEmit` — clean.
- `npx expo export` — bundles without error for **both iOS and Android**, which
  exercises every import in the app including `expo-sqlite`.

**Not verified**

Still nothing on a real phone, and this machine has no simulator to put one on.
Bundling proves the app *builds* for a phone; it does not prove it *looks*
right on one. Layout, the font rendering, the tilt, dark mode and the safe-area
insets all need eyes on a device.

## Step 4 — quick capture, and the one moment the app says no

**The open question is answered the plan's way.** The brief asked that capture
quietly default to Next once Now holds seven. The plan (§7) argued against it,
and this step builds the plan's version: capture defaults to **Now**, and
choosing Now when it is full turns the sheet around to show the seven notes
already there, each with the three honest ways out — *Done*, *Next*, *Drop* —
plus a quiet "Put it in Next instead" for when the user genuinely just wants
the brief's behaviour. One tap resolves it either way.

The reasoning: silently diverting to Next spares the user the one decision the
whole product exists to force. They never learn Now is full, and Next becomes
the drain. Reverting to the brief's behaviour, if this proves wrong on a real
board, is a few lines in `CaptureSheet`.

**Built**

- `src/components/CaptureSheet.tsx` — writing a note, and the Now-is-full turn.
- `src/store/useBoard.ts` — the board and every write to it. Screens read from
  this hook and nothing above it touches the repository. Each action writes and
  then re-reads, so the screen can't drift out of step with the database.
- `repo.createInNowBySwapping()` — makes room and adds the new note **in one
  transaction**. Without it a failure between the two writes could take a note
  out of Now and not put one back, which is the one thing this app must never
  do to someone.

**Verified**

- 21 tests, including four new ones on swapping: by completing, by moving to
  Next, by deleting, and — the one that matters — that a swap which fails
  partway leaves Now exactly as it was, nothing moved and nothing lost.
- `tsc` clean; `expo export` bundles for iOS and Android.

**Not verified**

The sheet itself has never been on a screen. Keyboard behaviour, the sheet
height with the keyboard up, and whether autofocus fires inside a modal on
Android are all things only a device will tell us.

## Step 4b — warmth, without new screens

Asked for something more inventive that doesn't cost simplicity. The rule I
held to: **no new screens, no new taps, nothing that can be lost at.** Four
additions, all of them things the board already knew and wasn't saying.

**1. The line under the wordmark now describes the board.** A tagline is for
strangers, and by the second launch the user isn't one. It reads
`Morning · 3 in Now`, or `A clean board.` when there is nothing. After 10pm it
stops counting and says *"Late — most of this can wait for tomorrow."* — the
one time the app offers an opinion, and it offers permission.

**2. A note that has sat in Now for four days says how long it has been
there.** Just the age: `here 4 days`, `here a week`. Never "still", "overdue"
or "should" — there is a test that fails if any of those words appear. Now is
meant to turn over; noticing that it hasn't is the user's job, not the app's
to announce. Next and Someday never get this, because sitting there is what
they are *for*.

**3. The chip counts today, not forever.** `2 cleared today` while it is true,
falling back to the total. A running total becomes a score, and a score is a
thing you can be losing at.

**4. Haptics, at three moments only** — a note landing, Now refusing, a note
making room. Nothing for scrolling, typing, opening or closing: a buzzing task
app is the opposite of calm. Every call swallows its own error so a phone with
the motor off can't take a write down with it.

All the wording lives in `src/board/whispers.ts` as pure functions, because
copy is the part most likely to be argued about and so should be the easiest
to test and change. 10 tests cover it, including the one asserting the age
line never nags.

**Verified:** 35 assertions passing, `tsc` clean, both platforms bundle.
**Not verified:** haptics have never fired — they need a real device, and they
are the one thing here a simulator wouldn't prove either.

## Sprint 3, later additions

Asked mid-sprint for a different note face, dragging, reminders, Google
sign-in, and for Someday to stop piling up. Four of the five are built.

**The note face is now Caveat**, not Shantell Sans. Shantell is rounded and
comic-ish, which reads cheerful rather than calm, and its wide letterforms
cost line length on a phone. Caveat is a real pen hand. It is set at 19pt
against the UI's 15 because handwriting faces carry a smaller x-height and
would otherwise read as the quieter voice. Swapping it again is one line in
`theme/typography.ts` plus the import in `App.tsx`.

**Someday fades and folds away.** A note there starts losing opacity after 14
days and folds into a box at the bottom after 45 — `SOMEDAY_FADE_DAYS` and
`SOMEDAY_BOX_DAYS` in `config.ts`. The box is a drawer, not a bin: one tap
opens it, nothing is ever deleted by age, and a test asserts every note is
still somewhere after the split.

**Reminders are schema v2**, and belong to Now alone — being nudged about
something you have already decided isn't today is just an interruption. Three
presets, no date picker: a picker turns "remind me" into a planning exercise.
They are local notifications, so nothing leaves the phone. The reminder is
stored on the note and scheduled with the OS together or not at all; if
notifications are off, the app says so rather than showing a reminder that can
never fire. A note leaving Now, or being finished, drops its reminder — in SQL,
so it can't be forgotten at a call site.

The v1→v2 upgrade is tested against a **real version-1 database with notes
already in it**: all three survive, the new column arrives NULL rather than
guessed at, the version is recorded, and a second launch doesn't migrate again.

**Dragging works**, and arrived four steps earlier than planned. Long-press
lifts a note; a line shows where it will land; dropping into a full Now is
refused out loud. It uses React Native's own Animated and PanResponder rather
than a gesture library — a board this size doesn't need the machinery. Every
note and section is measured once at pick-up and the hit-testing runs against
that snapshot, with the maths in `board/drag.ts` under 10 tests covering the
cases a phone can't show you: the dragged note not counting against itself,
the gaps between sections, dropping past the end of a list.

One bug caught before it shipped: the pan responder was being rebuilt whenever
drag state changed, which would have stranded a note on screen mid-gesture.
The handlers now read state through a ref.

**Google sign-in is not built** — see `docs/12-google-signin.md`. It needs
OAuth client IDs only you can create, and more importantly sign-in without
sync is a door to an empty room.

**Verified:** 64 assertions passing, `tsc` clean, both platforms bundle.
**Not verified:** the drag gesture, the haptics and the notifications have
never run anywhere but a bundler. Drag especially — the measurement approach
assumes the board doesn't scroll mid-gesture, which is true but untested.

## Sprint 3, final additions

Asked for Google sign-up, a Makio font, animations on completing a task, and
"gravitas and softness".

**On the font.** There is no font called Makio — not on Google Fonts, not on
npm. **Mako** exists and is almost certainly what was meant: narrow, light and
level, it gives a note weight without raising its voice. It is now the default
via `NOTE_FACE` in `config.ts`, with Caveat still loaded as the alternative.
The two need different metrics — Mako is a sans with a normal x-height, Caveat
is handwriting and reads small — so the type scale follows the choice instead
of being one compromise that suits neither. Changing it is one word.

**Finishing a note is now given its due.** The circle fills with a slight
overshoot, the note is held for a beat so you actually see it happen, and only
then does it lift away, drifting up and to the right the way paper does when
you take it off a board. Around 560ms end to end. Notes also arrive by rising
into place, staggered by 35ms and capped at six, so opening the app looks like
a board settling rather than a list appearing.

Two separate animated values throughout, because height cannot run on the
native driver and everything else should — mixing them on one value is the
usual way this breaks.

**Gravitas, concretely: nothing is lost by accident.** Clearing a note offers
Undo for six seconds. Deleting — the only irreversible act in the app — asks
twice, in words. The Done screen groups the last 30 days by day and puts
anything back in one tap. The point of that screen is not a trophy cabinet; it
is that finishing something is safe.

**Google sign-in is built**, scoped to `drive.appdata` — a private folder this
app alone can see, with no access to anything else in the user's Drive. Two
things are still needed, both documented in `docs/12-google-signin.md`: the
three OAuth client IDs, which only the owner of the Google Cloud project can
create, and a development build, because **Google sign-in cannot work in Expo
Go** — its `exp://` redirect URI is rejected by Google and the proxy that used
to cover this was removed. Until the IDs are filled in, the app hides that
half of the sheet rather than showing a dead button.

**What works today with no account:** save the whole board to a file and
restore from one. Offline, no server, listed first on the sheet because it is
what most people will actually use.

**The rule both backup paths share:** restoring only adds notes that aren't
here. It never overwrites and never deletes, because the copy on the phone may
be newer than the copy in the file and replacing it silently is
indistinguishable from losing work. The parser has 13 tests of its own,
including that one damaged note rejects the whole file rather than
half-restoring it.

**Verified:** 86 assertions, `tsc` clean, both platforms bundle at 2.7MB.
**Not verified:** every animation, the drag, the haptics, the notifications,
the file picker and all of the Drive code have run nowhere but a bundler. The
Drive layer in particular has never made a single real request.
