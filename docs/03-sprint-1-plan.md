# Sprint 1 — Plan

**Goal:** A person can open the board, dump what is on their mind, and feel the
7-note limit push back. One runnable increment, good enough to put in front of a
student.

**Length:** 1 sprint · **Committed:** 25 points

## Sprint backlog

| ID | Story | Pts | Status |
|---|---|---|---|
| A1 | Capture a note in one action | 3 | |
| A2 | Add into any column | 2 | |
| A3 | Persistence across reload | 3 | |
| A4 | Edit note text | 2 | |
| A5 | Delete note | 2 | |
| B1 | Move between columns | 5 | |
| B2 | Now refuses the 8th note | 3 | |
| B3 | Now fullness indicator | 2 | |
| C2 | Works at 375px | 5 | |

## Deferred to Sprint 2

B4 (reorder) · B5 (done + celebration) · C1 (final visual identity — blocked on
Q2) · C3 (motion polish) · C4 (dark theme) · C5 (full a11y pass)

C1 is deferred deliberately: the founder rejected the first visual direction, so
Sprint 1 ships a *neutral, honest* treatment rather than guessing at the brand.

## Definition of Done

- [ ] Story's acceptance criteria met
- [ ] Works at 375px and at desktop width
- [ ] Keyboard-operable (no mouse-only paths)
- [ ] State survives a reload
- [ ] Manually tested against the test notes in `04-test-notes.md`

## Risks

| Risk | Mitigation |
|---|---|
| Touch drag-and-drop is fiddly on phones | Ship a non-drag move path (explicit control) alongside drag |
| 7-limit frustrates first-time users | Message explains the trade-off; measure in validation, do not pre-emptively soften |
| No visual identity yet | Build on neutral tokens so a brand can be swapped in without a rewrite |
