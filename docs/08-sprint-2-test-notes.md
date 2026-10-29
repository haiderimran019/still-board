# Sprint 2 — Test Notes (B4, B5)

Tested 2026-10-29 in a Chromium browser, light and dark, desktop and 375 × 812.

## B4 — reorder within a lane

| # | Test | Result |
|---|---|---|
| T13 | Drag a note down past its neighbour → order changes and persists through reload | **Pass** |
| T14 | Drag a note from one lane to a *position* in another, not just the end | **Pass** — dentist note landed above "Update portfolio", not under it |
| T15 | A dashed slot shows where the note will land, and the note being dragged collapses out of the flow | **Pass** |
| T16 | Arrow Up / Arrow Down on a focused note reorders it | **Pass** — focus follows the note, live region announces "Moved up." |
| T17 | No stray slot left in the DOM after a drop | **Pass** (`.slot` count = 0 after every drop tested) |

## B5 — mark done

| # | Test | Result |
|---|---|---|
| T18 | Clicking the circle clears the note with a brief lift-and-fade | **Pass** (~280ms, skipped under `prefers-reduced-motion`) |
| T19 | "N cleared today" appears in the header and counts up | **Pass** |
| T20 | Undo restores the note to its original position and decrements the count | **Pass** — count went 2 → 1, note returned to the top of Someday |
| T21 | The count resets on a new day | **Pass by construction** — the stored record carries its date and is ignored when stale. *Not exercised against a real date rollover.* |
| T22 | Enter or Space on a focused note marks it done; typing inside note text is unaffected | **Pass** |

## Regression

| # | Test | Result |
|---|---|---|
| T23 | Now still refuses an 8th note on add | **Pass** |
| T24 | Dragging into a full Now is still refused | **Pass** (after D3 below) |

## Defect found and fixed in-sprint

| ID | Defect | Fix |
|---|---|---|
| D3 | Dragging into a full Now was blocked, but released silently — the amber outline vanished and nothing explained why the note sprang back | The drop now carries the same sentence the add path uses. A refusal that doesn't say why reads as a bug, and this is the product's most important refusal. |

## Design note

Done is a circle on the **left** of each note, not another glyph in the
right-hand cluster. It is the one positive action, it is the one people reach
for most, and crowding it next to Delete invites the wrong click. The right
cluster stays for moving and deleting.

## Still not covered

- Real-device touch (unchanged from Sprint 1, now with more drag surface to test)
- Screen-reader pass (C5)
- Date rollover for the cleared counter
