# Sprint 1 — Review & Retrospective

## Increment

A working board: **[board.html](../board.html)** — capture a note, drag or key it
between Now / Next / Someday, and run into the 7-note wall when Now is full.
State survives a reload. Works on a phone-width screen in light and dark.

## Story outcome

| Story | Pts | Done |
|---|---|---|
| A1 capture · A2 any lane · A3 persistence · A4 edit · A5 delete + undo | 12 | ✅ |
| B1 move between lanes (drag + buttons + arrow keys) | 5 | ✅ |
| B2 Now refuses the 8th | 3 | ✅ |
| B3 fullness indicator | 2 | ✅ |
| C2 works at 375px | 5 | ⚠️ passes in an emulated phone viewport; untested on real hardware |

**24 of 25 points fully accepted.** C2 is accepted with a caveat, not closed.

## What went well

- The 7-limit is the thing that makes the product feel different, and it reads
  that way in use. Hitting the wall feels like a decision, not an error.
- Shipping a keyboard and button path alongside drag was the right call — the
  move controls turned out to be faster than dragging even with a mouse.

## What to change

- **Test on a real phone before the next demo.** Emulated viewports hid a
  touch-only defect (D1) until a screenshot happened to show it, and they still
  cannot tell us whether touch drag feels right.
- Two of the sprint's defects were about *drop targets and hit areas* — worth
  checking hit areas deliberately rather than discovering them.

## Sprint 2 — proposed

**Goal:** make the board feel finished, and get it into five students' hands.

| Story | Pts |
|---|---|
| C1 visual identity (blocked on Q2 — needs the founder's direction) | 5 |
| B5 mark a note done, with a moment of satisfaction | 3 |
| B4 reorder within a lane | 3 |
| C3 motion polish | 2 |
| C5 accessibility pass | 3 |
| New: real-device test round with 5 students, structured feedback | 3 |

Q2 (visual direction) blocks the largest item, so it needs an answer before
Sprint 2 planning.
