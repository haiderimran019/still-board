# Sprint 1 — Test Notes

Tested 2026-10-29 against the Sprint 1 increment, in a Chromium browser at
desktop width and at 375 × 812 (phone), light and dark themes.

## Results

| # | Test | Story | Result |
|---|---|---|---|
| T1 | Type a note, press Enter → note appears in the selected lane, field clears, focus stays | A1 | **Pass** |
| T2 | Switch the lane picker to Next / Someday → note lands in that lane | A2 | **Pass** |
| T3 | Reload the page → every note, lane and order is still there | A3 | **Pass** (11 notes restored from `localStorage`) |
| T4 | Click a note's text, retype, press Enter → text saves; Escape reverts | A4 | **Pass** |
| T5 | Delete a note → it disappears and a toast offers Undo | A5 | **Pass** |
| T6 | Drag a note from Next into Someday → it moves and persists | B1 | **Pass** (after fix D2 below) |
| T7 | Move a note with the ← → controls and with arrow keys on a focused note | B1 | **Pass** |
| T8 | Add an 8th note to a full Now → refused, with the trade-off explained | B2 | **Pass** — "Now is full at 7. Move something out first — that's the point." |
| T9 | Drag a note into a full Now → refused, lane shows a warning outline | B2 | **Pass** — "Now already holds 7. Something has to leave before this can land." |
| T10 | Now shows 5/7 and a pip gauge that turns amber at the limit | B3 | **Pass** |
| T11 | At 375px the lanes stack and the page does not scroll sideways | C2 | **Pass** (`scrollWidth − clientWidth = 0`) |
| T12 | Dark theme renders with designed colors, not inverted ones | C4 (early) | **Pass** |

## Defects found and fixed in-sprint

| ID | Defect | Fix |
|---|---|---|
| D1 | On touch, the always-visible move/delete controls overlapped long note text | Reserved space for the controls in the note's padding, widened for the lane that carries three controls |
| D2 | A lane was only as tall as its notes, so dropping into the empty space below a short lane did nothing | Lanes now stretch to the tallest column, making the whole column a drop target; min-height raised to 160px |

## Known gaps (carried to Sprint 2)

- **Touch drag is untested on real hardware.** It is built on pointer events,
  which covers touch in principle, but it has only been exercised with a mouse
  and with an emulated phone viewport. Test on an actual Android phone before
  showing this to students.
- No reorder within a lane (B4), no done-state (B5) — both deferred by plan.
- Screen-reader pass (C5) not done. Notes carry labels and a keyboard move
  path exists, but no assistive technology has been run against the board.
- Visual identity is placeholder, pending Q2.
