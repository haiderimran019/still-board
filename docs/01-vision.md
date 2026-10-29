# Vision & Product Charter

**Working name:** still. *(not final)*
**One-liner:** Your life, on one calm board.
**Date:** 2026-10-29 · Sprint 0 (Inception)

---

## 1. Problem

People hold too much in their heads. Existing task apps (Todoist, Notion, Asana)
solve *capacity* — they let you store infinite tasks — but they make the feeling
worse: an endless list is a permanent reminder of everything you are not doing.

The unmet need is not storage. It is **relief**: a way to decide what matters
right now and park everything else somewhere safe.

## 2. Target user

| | |
|---|---|
| **Beachhead** | University students in Pakistan (founder's own community) |
| **Later** | Working adults, households sharing a board |
| **Devices** | Android first, iPhone close behind |

Beachhead chosen for feedback speed, not market size.

## 3. The core idea

A whiteboard-style dashboard of sticky notes in three columns:

| Column | Meaning | Limit |
|---|---|---|
| **Now** | What you are focusing on | **7 notes** (hard limit — the product's opinion) |
| **Next** | Soon, but not today | unlimited |
| **Someday** | Ideas, no pressure to act | unlimited |

Notes move between columns as priorities change. That movement *is* the app.

Example: "finish assignment" → Now · "update portfolio" → Next · "learn photography" → Someday

## 4. Why the limit of 7 matters

The 7-note cap on **Now** is the single feature that separates this from every
other task app. Without it we have built another list. The friction of being
forced to move something out of Now before adding to it is the product, not a
bug. **Do not quietly raise this limit to make onboarding smoother.**

## 5. Quality bar

Notion / Duolingo tier. Polished, approachable, premium. The first design
direction was rejected, so visual identity is **open** — see
[Open questions](#8-open-questions).

## 6. Success signals (not yet targets)

- A user opens the board and *closes it* within 60 seconds feeling clearer
- Notes get **moved**, not just created — movement is the health metric
- Week-2 retention among the first 30 students

## 7. Out of scope for v1

Collaboration · due dates & reminders · sub-tasks · tags · calendar sync ·
recurring tasks · attachments. Each of these is how calm apps become cluttered
apps. They go in `Someday`, where they belong.

## 8. Open questions

| # | Question | Owner | Needed by |
|---|---|---|---|
| Q1 | Final product name | Founder | before store listing |
| ~~Q2~~ | ~~Visual identity~~ — **closed 2026-10-29**: Direction B, pulled back ([tokens](07-design-tokens.md)) | — | — |
| Q3 | Business model — free / one-off / subscription | Founder | post-validation |
| Q4 | Does Now sit at 7, or lower? | Validate with users | Sprint 3 |

## 9. Assumptions made to keep moving

- **A1:** We prototype as a responsive **web app** first. It is the fastest route
  to put something in a student's hand (a link, no install), and it validates the
  interaction before committing to native Android/iOS. The mobile apps remain the
  launch target.
- **A2:** Single user, local-first. No accounts until the interaction is proven.
