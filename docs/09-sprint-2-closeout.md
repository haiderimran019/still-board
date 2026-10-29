# Sprint 2 — C3 (motion) and C5 (accessibility)

## C3 — motion

| Change | Detail |
|---|---|
| Note arrival | New notes settle in — fade and a 6px drop over 220ms, preserving the note's own tilt |
| Note cleared | Lift to 104%, then fade and shrink (280ms, from B5) |
| Toast | Rises 8px into place over 180ms |
| Drag | The slot and the lane highlight were already animated; unchanged |
| Reduced motion | `prefers-reduced-motion` now disables **animations** as well as transitions, and the done path skips its animation and removes the note immediately |

Nothing animates for longer than 280ms and nothing moves on load.

## C5 — accessibility

### Contrast — fixed

Three text colours failed 4.5:1 against the cream board and were darkened.
Measured in the browser from the live tokens:

| Token | Was | Now | Light | Dark |
|---|---|---|---|---|
| `--ink-faint` lane subtitles, placeholder | `#a99880` (2.6:1 ✗) | `#7c6e58` | **4.66** | **4.74** |
| `--ink-soft` secondary text | `#7d6f5c` (4.6:1) | `#6b5f4c` | **5.85** | **7.66** |
| `--warn` "7 / 7" at the limit | `#b8701a` (3.7:1 ✗) | `#9c5d12` | **4.94** | **8.56** |
| `--accent` buttons, pips | unchanged | `#6e5220` | **6.81** | **11.15** |
| `--ink` on every note colour | unchanged | | **8.7–10.8** | **8.7–10.3** |

The warm dark theme was re-checked separately rather than assumed.

### Meaning never carried by colour alone

- Now at its limit shows **"7 / 7"** as text; the amber pips repeat that, they
  don't carry it.
- Note tints are decorative. Nothing is encoded in which colour a note is.
- A blocked drop shows an outline *and* says why in words.

### Structure and keyboard

| Change | Detail |
|---|---|
| Roles | Each lane's stack is a `list` labelled "Now — what you're focusing on"; each note is a `listitem` |
| Instructions | Every note is `aria-describedby` a hidden line naming its keys, so a screen reader announces them on focus |
| Editing | The note's text field is `role="textbox"` with `aria-multiline="false"` |
| Discoverability | A visible hint line under the board shows the keys, so sighted keyboard users find them too |
| Announcements | Moves, reorders, edits, done and undo all speak through the existing live region |

### Tap targets

| Control | Visual | Hit area |
|---|---|---|
| Done circle | 20px | **44 × 44px** (invisible expansion, verified with `elementFromPoint` at ±18px) |
| Move / delete | ~22px | **30 × 30px** minimum |

30px is the practical limit inside a note on a desktop screen. **On the phone
build these become 48dp**, which is where the brief sets the bar — see the
mobile plan.

## Not covered

- No screen reader has actually been run against the board. The structure and
  labels are correct by inspection; that is not the same as tested.
- Real-device touch, still outstanding from Sprint 1.
