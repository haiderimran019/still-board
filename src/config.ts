/**
 * Everything still undecided lives here, so changing your mind is a one-line edit.
 */

/** Placeholder. "still." was explored, never confirmed. Not referenced anywhere else as a string. */
export const APP_NAME = 'still.';

/** The positioning line, shown on the board and in onboarding. */
/** For strangers: the onboarding cards in step 8. The board itself describes
 *  what is on it instead — see board/whispers.ts. */
export const TAGLINE = 'Your life, on one calm board.';

/**
 * The product's one rule. Lowering this is a product decision, not a tuning knob —
 * see docs/01-vision.md before you touch it.
 */
export const NOW_LIMIT = 7;

/**
 * The face your own writing is set in. Flip this one word to change the whole
 * feel of the board — 'mako' is a narrow, quiet, modern sans; 'caveat' is a
 * pen hand. Both are loaded, so switching costs nothing but this line.
 */
export const NOTE_FACE: 'mako' | 'caveat' = 'mako';

/** How far back the Done list reaches before it stops piling up. */
export const DONE_WINDOW_DAYS = 30;

/**
 * Someday is a place to put things down, not a backlog to carry. A note left
 * there starts to fade after this many days...
 */
export const SOMEDAY_FADE_DAYS = 14;

/** ...and after this many it folds itself into the box at the bottom. */
export const SOMEDAY_BOX_DAYS = 45;
