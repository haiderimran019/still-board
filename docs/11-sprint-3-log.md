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
