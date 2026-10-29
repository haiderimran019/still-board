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
 * feel of the board. 'shantell' is the one the board was designed around —
 * a warm, slightly drawn sans that reads as a person's handwriting without
 * the legibility cost of a real script. 'mako' is narrow and level; 'caveat'
 * is a pen hand. All three are loaded, so switching costs nothing but a word.
 */
export const NOTE_FACE: 'shantell' | 'mako' | 'caveat' = 'shantell';

/** How far back the Done list reaches before it stops piling up. */
export const DONE_WINDOW_DAYS = 30;

/**
 * Someday is a place to put things down, not a backlog to carry. A note left
 * there starts to fade after this many days...
 */
export const SOMEDAY_FADE_DAYS = 14;

/** ...and after this many it folds itself into the box at the bottom. */
export const SOMEDAY_BOX_DAYS = 45;

/**
 * Google sign-in, used for one thing only: keeping a copy of your board in
 * your own Google Drive, in the app's private folder that nothing else can
 * read. Leave these empty and the app hides the Google half of the backup
 * sheet entirely — saving to a file still works, offline, with no account.
 *
 * Filling them in means creating three OAuth client IDs in your own Google
 * Cloud project. docs/12-google-signin.md walks through it. They are not
 * secrets — client IDs ship inside every app that uses them — but they are
 * tied to your project, so they have to be yours.
 */
export const GOOGLE: Record<'androidClientId' | 'iosClientId' | 'webClientId', string> = {
  // Android needs the SHA-1 fingerprint of the signing certificate, which does
  // not exist until the app has been built once. Filled in after the first
  // build — see docs/12-google-signin.md.
  androidClientId: '',
  iosClientId: '208157036332-a8g5bdagd3253iscsl97kk8o7leo4h5i.apps.googleusercontent.com',
  webClientId: '208157036332-ni3bg64lr1atghc2h5bm3sjm7otgb802.apps.googleusercontent.com',
};

/* Whether sign-in can actually run on the phone in your hand is a question
   about the running platform, so it lives next to the auth code itself —
   see auth/google.ts. This file stays free of react-native imports: the test
   suite loads it under plain Node. */
