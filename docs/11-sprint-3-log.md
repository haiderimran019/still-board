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
