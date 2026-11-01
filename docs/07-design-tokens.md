# Design tokens — soft paper and pastel lanes

The native and browser boards share a quiet palette and the same type pairing:
the interface speaks in Gabarito, and note text stays in Shantell Sans. Light
mode uses soft lane colors and white note cards; dark mode is a separate
low-glare palette.

The three visible lanes are Now, Next, and Someday. Next week remains a
separate section inside the Next lane so existing notes and actions retain
their meaning.

## Type

| Role | Face | Notes |
|---|---|---|
| Interface | **Gabarito** 400/500/600/700 | wordmark, headings, controls, placeholder text |
| Note text | **Shantell Sans** 500 | only what the user wrote |

## Light palette

| Token | Value | Use |
|---|---|---|
| board | `#fbf9f6` | page surface |
| surface | `#ffffff` | cards and raised surfaces |
| ink | `#48454d` | note and heading text |
| ink soft | `#746f78` | secondary text |
| ink faint | `#77727b` | subtitles and placeholders |
| rule | `#ebe7e7` | borders and dividers |
| accent | `#795c91` | actions, focus, and Now gauge |
| Now lane | `#fff5f0` | soft peach |
| Next lane | `#f8f6f3` | warm neutral |
| Someday lane | `#f4f6f1` | soft sage |

## Dark palette

| Token | Value |
|---|---|
| board | `#19171c` |
| surface | `#252229` |
| ink | `#f1edf3` |
| accent | `#c4a8d7` |
| warn | `#e7aa8b` |

Urgency washes remain a visual signal, paired with the existing urgency label.
The base note surface is neutral so text stays easy to scan in every lane.

## Layout

The browser board uses three columns on desktop and stacks them on narrow
screens. The native board follows the same intent: three columns on wide
displays and a vertical list on phones. Now's seven-note limit, the Next-week
subsection, filtering, and all existing note actions remain intact.
