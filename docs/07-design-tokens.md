# Design tokens — Direction B (pulled back)

Decided 2026-10-29. Closes **Q2**. Implemented in `board.html` as CSS custom
properties on `:root`; nothing in the component styles hard-codes a colour, so a
later brand swap is a change to this one block.

## Stance

Warm, tactile, barely askew. Direction B as drafted, dialled back:

| | Drafted | Shipped |
|---|---|---|
| Note tilt | ±0.7–0.8° | ±0.15–0.4° |
| Note colours | saturated stationery | ~30% softer, nearer the paper |
| Drop shadow | 2px solid edge + heavy blur | 2px solid edge at 7% + tighter blur |
| Corner radius | 13px | 12px |

The handwriting stays. It is the one unmistakable thing in the direction and it
carries the idea that the board holds *your* words, not the app's.

## Type

| Role | Face | Notes |
|---|---|---|
| Interface | **Gabarito** 400/500/600/700 | wordmark, lane names, controls, placeholder text |
| Note text | **Shantell Sans** 500 | only what the user wrote |

The split is the rule: **the app speaks in Gabarito, you write in Shantell.**

## Colour

### Light — cream paper
| Token | Value | Use |
|---|---|---|
| `--board` | `#fdf7ec` | board surface |
| `--board-line` | `#f3e8d6` | the faint grid |
| `--surface` | `#fffdf8` | composer |
| `--ink` | `#3a3026` | note and heading text |
| `--ink-soft` | `#7d6f5c` | secondary |
| `--ink-faint` | `#a99880` | lane subtitles, placeholder |
| `--accent` | `#6e5220` | buttons, focus, gauge pips |
| `--warn` | `#b8701a` | Now at its limit |
| notes | `#ffeba3` `#cdeed6` `#ded8f2` `#ffd4c2` | yellow · mint · lilac · peach |

### Dark — warm, not inverted
| Token | Value |
|---|---|
| `--board` | `#1a1713` |
| `--surface` | `#241f19` |
| `--ink` | `#f2eae0` |
| `--accent` | `#e8c892` |
| `--warn` | `#e8a74e` |
| notes | `#4a3f1e` `#2d4031` `#37314f` `#4a3328` |

Dark was designed separately rather than derived — the same four stationery
hues, taken down to something that still reads as coloured paper at night.

## Checked

Light and dark at desktop width and at 375 × 812. No horizontal overflow
(`scrollWidth − clientWidth = 0`). The move and delete controls no longer
collide with note text at any width.

## Still open

- **Q1, the name.** The wordmark is set in Gabarito 700 at −0.035em tracking.
  If the name changes, this is the piece that changes with it.
- The tilt is a judgement call made on a desktop screen. Watch whether it still
  reads as paper or as sloppiness on a real phone.
