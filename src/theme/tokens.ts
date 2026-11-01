/**
 * Soft paper, pastel lanes, and white cards. The interface and browser board
 * share these values so the product keeps one visual language across screens.
 *
 * See docs/07-design-tokens.md for the reasoning and the measurements.
 */

export type Palette = {
  board: string;        // the board surface
  line: string;         // quiet dividers
  surface: string;      // composer, sheets, anything raised
  ink: string;          // primary text
  inkSoft: string;      // secondary text
  inkFaint: string;     // subtitles, placeholders
  rule: string;         // hairlines and borders
  accent: string;       // buttons, focus, the Now gauge
  warn: string;         // Now at its limit — never the only signal
  lanes: [string, string, string];
  notes: [string, string, string, string];  // yellow, mint, lilac, peach
  noteEdge: string;
  /** Urgency 1, 2, 3 — green, amber, red. Index 0 has no colour by design. */
  urgency: [string, string, string];
  /** The same three as a whole-note wash, quiet enough to read body text on. */
  urgencyFill: [string, string, string];
};

export const light: Palette = {
  board: '#fbf9f6',
  line: '#f1eeeb',
  surface: '#ffffff',
  ink: '#48454d',
  inkSoft: '#746f78',
  inkFaint: '#77727b',
  rule: '#ebe7e7',
  accent: '#795c91',
  warn: '#9c5d42',
  lanes: ['#fff5f0', '#f8f6f3', '#f4f6f1'],
  notes: ['#ffeba3', '#cdeed6', '#ded8f2', '#ffd4c2'],
  noteEdge: 'rgba(58,48,38,0.12)',
  // Chosen to clear 3:1 against every one of the four note colours above,
  // which is the contrast floor for a graphic that carries meaning.
  urgency: ['#1e7a48', '#9a6a00', '#b3261e'],
  // A whole note in a flat red would shout, and a board of shouting notes
  // says nothing. These are washes at roughly the weight of the stationery
  // colours, so ink stays at 7:1 and an urgent note reads as urgent without
  // taking the room over.
  urgencyFill: ['#e6f0e7', '#fff0d4', '#f9e3df'],
};

/** A separate night palette, with the same muted lavender accent. */
export const dark: Palette = {
  board: '#19171c',
  line: '#26232a',
  surface: '#252229',
  ink: '#f1edf3',
  inkSoft: '#c0b9c5',
  inkFaint: '#a69eab',
  rule: '#39343d',
  accent: '#c4a8d7',
  warn: '#e7aa8b',
  lanes: ['#2d2427', '#252329', '#242923'],
  notes: ['#4a3f1e', '#2d4031', '#37314f', '#4a3328'],
  noteEdge: 'rgba(0,0,0,0.4)',
  urgency: ['#6fd39b', '#e8c04e', '#ff8a7a'],
  urgencyFill: ['#1f3b2c', '#453516', '#4a2420'],
};

/** Shadows differ per theme: on cream a solid drop-edge reads as paper; on near-black it doesn't. */
export const elevation = {
  light: {
    shadowColor: '#48454d',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dark: {
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
} as const;

export const radius = { note: 14, card: 15, sheet: 22, pill: 999 } as const;

/** 8pt spacing scale. Anything that isn't on it needs a reason. */
export const space = { xs: 4, sm: 8, md: 12, lg: 18, xl: 26, xxl: 40 } as const;

/** The brief's floor for anything you tap. */
export const MIN_TAP = 48;

/**
 * What a control shorter than the floor needs underneath it.
 *
 * A few things genuinely have to be short — a row of four pills has to fit
 * across a phone — but what you aim at does not have to be what you can see.
 * Six above and below takes the shortest of them (38) past 48 with room over.
 */
export const TAP_SLOP = { top: 6, bottom: 6 } as const;
