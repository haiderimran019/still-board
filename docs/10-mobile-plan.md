# Mobile App — Plan (awaiting approval)

Proposed 2026-10-29. **Nothing is built yet.** This plan answers the brief and
carries forward what the web prototype already settled.

---

## 1. What the prototype already decided

The brief asks for some things we have run and closed. Carrying them forward
rather than re-opening:

| Brief asks for | Status |
|---|---|
| 2–3 visual directions, then commit | **Done.** Three drafted, B picked, tokens in [07-design-tokens.md](07-design-tokens.md) |
| The 7-note limit, handled gently | **Done and validated.** Wording and behaviour are proven; port them exactly |
| Light and dark | **Done.** Dark designed, not inverted; contrast measured |
| Drag and drop plus a "move to" path | **Done.** The non-drag path turned out faster than dragging even with a mouse |

If you want the visual directions re-opened for mobile, say so — but B was
chosen against real notes on a real board, which is better evidence than a new
round of mockups would give.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo (SDK 58) + React Native 0.88 + TypeScript** | As briefed. One codebase, runs in Expo Go on your own phone from day one |
| Navigation | **expo-router** | File-based routes; the screen list below maps one-to-one onto files |
| Storage | **expo-sqlite**, behind a `repository` module | As briefed. Per-note rows mean a future sync resolves per note, not per whole document. Works in Expo Go |
| Gestures | **react-native-gesture-handler** + **react-native-reanimated** | The only combination that gives 60fps drag on the UI thread, and both ship with Expo |
| State | **Zustand** | ~1KB, no boilerplate, readable. Redux is more than this app needs; raw Context re-renders the whole board on every keystroke |
| Fonts | **expo-font** with Gabarito + Shantell Sans | The chosen identity, bundled so there is no network dependency |

### Alternatives I considered and rejected

- **AsyncStorage instead of SQLite.** Simpler to read, but it rewrites the whole
  board on every change and gives a future sync nothing finer than
  last-write-wins on the entire document. SQLite costs ~40 lines more and keeps
  the door open. *Pick this instead if you'd rather read 40 fewer lines.*
- **MMKV.** Faster than both, but needs a custom dev build, which breaks the
  "test in Expo Go" requirement.
- **Flutter.** Genuinely better drag performance, but it's a second language to
  learn and the brief says you want to maintain this yourself.

## 3. The screen question the brief doesn't settle

Three side-by-side columns do not fit a 375pt phone. Three options:

| | Layout | Cost |
|---|---|---|
| **A** ✅ | One vertical board: Now, then Next, then Someday, scrolling | Someday sits below the fold |
| B | Swipeable pager, one section per page | You can never see two sections at once; "one calm board" stops being true |
| C | Now expanded, Next/Someday collapsed | Adds a disclosure interaction to every move |

**Recommend A.** The positioning line is "Your life, on one calm board" — a
pager makes that a lie. A is also what the web prototype already does at phone
width, so the layout is proven.

## 4. Data model

```sql
CREATE TABLE notes (
  id          TEXT PRIMARY KEY,
  text        TEXT    NOT NULL,
  section     TEXT    NOT NULL CHECK (section IN ('now','next','someday')),
  position    REAL    NOT NULL,          -- fractional: insert between 1.0 and 2.0 at 1.5
  tint        INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  completed_at INTEGER                    -- NULL while on the board
);
CREATE INDEX notes_board ON notes (section, position) WHERE completed_at IS NULL;
CREATE INDEX notes_done  ON notes (completed_at DESC) WHERE completed_at IS NOT NULL;
```

Two decisions worth naming:

- **`position` is a float, not an integer.** Dropping a note between two others
  writes one row instead of renumbering the whole section. It matters more than
  it looks on a phone, where a reorder otherwise means a dozen writes.
- **Completed notes stay in the same table** with `completed_at` set. The Done
  list is a query, not a second store, so Undo is one UPDATE.

## 5. Screens

| Route | Screen | Contents |
|---|---|---|
| `/` | **Board** | Three sections, the composer, the Now gauge |
| `(modal)/compose` | **Quick capture** | Opens focused with the keyboard up. Section defaults per §7 |
| `(modal)/full-now` | **Now is full** | The seven notes; tap one to finish, move, or remove it |
| `/done` | **Done** | Cleared notes, newest first, grouped by day |
| `(onboarding)/*` | **First run** | Three cards: what Now is · what Next and Someday are · why seven |

Five surfaces. The brief's MVP needs no more.

## 6. Folder structure

```
app/                     # expo-router; routes only, no logic
  _layout.tsx
  index.tsx              # Board
  done.tsx
  (modal)/compose.tsx
  (modal)/full-now.tsx
  (onboarding)/[step].tsx
src/
  config.ts              # APP_NAME and NOW_LIMIT live here, alone
  theme/
    tokens.ts            # ported from the web build, light + dark
    typography.ts
  db/
    schema.ts            # the SQL above
    migrations.ts
    repository.ts        # the ONLY file that knows SQLite exists
  store/
    board.ts             # Zustand: notes, sections, the limit rule
  components/
    Note.tsx
    Section.tsx
    NowGauge.tsx
    Composer.tsx
    Toast.tsx
  hooks/
    useDraggableNote.ts  # the one hard piece, isolated on purpose
```

`repository.ts` is the seam. Swapping SQLite for anything else — including a
synced backend later — touches that one file.

## 7. Two places I'd change the brief

**The default section when Now is full.** The brief says capture should default
to Next once Now holds seven. That is gentle, but it quietly removes the
decision that the whole product exists to force — the user never learns Now is
full, and Next becomes the drain. **Recommend instead:** the composer still
defaults to Now, and choosing Now when it is full opens the *Now is full* sheet
showing the seven notes, where one tap finishes, moves, or removes one. The
refusal becomes the feature. It costs one screen, already listed above.

**Bound the Done list.** An unbounded Done list becomes a second backlog, and
scrolling past 400 finished chores is its own small pressure. **Recommend:**
Done shows the last 30 days, with a quiet line for anything older. Everything
stays in the database; the screen just doesn't pile it up.

## 8. Build order

Each step runs in Expo Go, and each ends with something you can try.

| # | Step | You can test |
|---|---|---|
| 1 | Project, fonts, theme tokens, light/dark | App opens in your brand, switches with the system |
| 2 | Database + repository + seed | Notes survive a force-quit |
| 3 | Board screen, read-only | Your three sections render |
| 4 | Quick capture + the 7 limit + the full-Now sheet | The core loop works |
| 5 | Edit, delete, "move to" menu | Everything but dragging |
| 6 | Done list + the complete animation | The satisfying part |
| 7 | Drag and drop | The risky part, last, on a working app |
| 8 | Onboarding + a11y pass (48dp, labels, contrast) | Ready for your classmates |

**Drag is deliberately last.** It is the one piece that can eat a week, and
steps 1–6 are a usable app without it. Sprint 1 already showed the menu path is
quicker than dragging anyway.

## 9. Before I start — four questions

1. **Layout A (one scrolling board)?** §3. It shapes everything after it.
2. **The full-Now sheet instead of silently defaulting to Next?** §7.
3. **Carry Direction B over, or re-open the visuals for mobile?** §1.
4. **Placeholder name** — `APP_NAME` in `src/config.ts`. Keep `still.`, or
   something deliberately temporary like `board` so it doesn't harden by habit?

Not blocking: the final name, the business model, anything in §Out of scope.

---

## Appendix — the canvas idea (explored 2026-10-29)

Built as a working prototype rather than a mockup: `canvas.html`. Zones keep the
Now / Next / Someday meaning; position inside a zone is the user's own. Pinch,
wheel and double-tap zoom; drag notes between zones; the 7-limit still refuses.

**What it gains.** Notes acquire *places*. "Pay hostel fee" sits bottom-left of
Now and stays there, so you find things by spatial memory instead of by reading
a list. On a laptop this is genuinely better than the lane view.

**Why it doesn't work on the phone.** Measured on a 375 × 812 viewport:

| Zoom | What you see |
|---|---|
| 16% — the whole board fits | Notes are coloured smudges. Shape, not content. |
| 65% — handwriting readable | **Two notes**, plus empty board |

There is no zoom level on a portrait phone where a three-zone canvas is both
readable and useful, so the user pinches constantly — which is the opposite of
the relief the product sells.

**Caveats on that finding.** The zones were laid out side by side, the worst
case for a portrait screen; stacking them vertically fits far better, but then
it is layout A with zoom added and the zoom earns much less. A native canvas
with real momentum will also feel better than a browser one.

**Verdict.** Not the phone MVP. Worth revisiting as a *laptop* view of the same
data later — the "look at everything" screen, not the daily one. Parked in the
backlog rather than discarded.
