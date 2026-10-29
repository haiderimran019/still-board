# Product Backlog

Ordered by value. Estimated in story points (Fibonacci). `MoSCoW` = Must / Should / Could / Won't (v1).

## Epic A — Capture

| ID | User story | Acceptance criteria | Pts | MoSCoW |
|---|---|---|---|---|
| A1 | As a student, I can write a note in one action so nothing stays stuck in my head. | Typing in the composer and pressing Enter creates a note in the chosen column; composer clears and keeps focus for the next note. | 3 | Must |
| A2 | As a user, I can add a note directly into any of the three columns. | Each column has its own add affordance; note lands in that column. | 2 | Must |
| A3 | As a user, my notes are still there when I come back. | Board persists across reload and browser restart; no account needed. | 3 | Must |
| A4 | As a user, I can edit a note's text. | Click note → inline edit → blur or Enter saves; Escape cancels. | 2 | Must |
| A5 | As a user, I can delete a note. | Delete control on hover/focus; removal is immediate with an undo window. | 2 | Should |

## Epic B — Decide (the heart of the product)

| ID | User story | Acceptance criteria | Pts | MoSCoW |
|---|---|---|---|---|
| B1 | As a user, I can move a note between Now / Next / Someday. | Drag-and-drop between columns, plus a keyboard/button path for accessibility; position persists. | 5 | Must |
| B2 | As a user, Now refuses an 8th note so I am forced to choose. | Adding/moving into a full Now is blocked with a calm, non-scolding message naming the trade-off. | 3 | Must |
| B3 | As a user, I can see how full Now is at a glance. | Now shows an unobtrusive 5/7 style indicator that changes tone as it fills. | 2 | Should |
| B4 | As a user, I can reorder notes within a column. | Drag within column; order persists. | 3 | Should |
| B5 | As a user, I can mark a note done and feel it. | Done removes it from the board with a brief, satisfying confirmation. | 3 | Should |

## Epic C — Calm (the quality bar)

| ID | User story | Acceptance criteria | Pts | MoSCoW |
|---|---|---|---|---|
| C1 | As a user, the board feels like a real whiteboard, not a spreadsheet. | Sticky-note visual treatment, soft paper surface, gentle shadows; passes a side-by-side "does this feel Notion-tier?" review. | 5 | Must |
| C2 | As a user, it works on my phone. | Usable one-handed at 375px; no horizontal page scroll; touch drag works. | 5 | Must |
| C3 | As a user, motion feels soft, never jumpy. | Note add/move/remove animate under 250ms; respects `prefers-reduced-motion`. | 2 | Should |
| C4 | As a user, I can use it at night. | Light and dark themes, both designed, not inverted. | 3 | Should |
| C5 | As a user with a screen reader, I can work the board. | Columns and notes labelled; keyboard path for every drag action. | 3 | Should |

## Epic D — Grow (post-validation)

| ID | User story | Pts | MoSCoW |
|---|---|---|---|
| D1 | Sync across devices with an account | 13 | Won't (v1) |
| D2 | Package as Android + iOS app | 8 | Won't (v1) |
| D3 | Weekly "what moved" reflection | 5 | Won't (v1) |
| D4 | Shared household board | 13 | Won't (v1) |

---

**Total committed scope (A+B+C):** 46 points across Must/Should.
