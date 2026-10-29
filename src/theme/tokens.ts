/**
 * Direction B, pulled back. Ported from the web prototype, where the contrast
 * ratios below were measured rather than guessed — every text colour clears
 * 4.5:1 against the surface it sits on, in both themes.
 *
 * See docs/07-design-tokens.md for the reasoning and the measurements.
 */

export type Palette = {
  board: string;        // the board surface
  line: string;         // the faint grid on it
  surface: string;      // composer, sheets, anything raised
  ink: string;          // primary text
  inkSoft: string;      // secondary text
  inkFaint: string;     // subtitles, placeholders
  rule: string;         // hairlines and borders
  accent: string;       // buttons, focus, the Now gauge
  warn: string;         // Now at its limit — never the only signal
  notes: [string, string, string, string];  // yellow, mint, lilac, peach
  noteEdge: string;
  /** Urgency 1, 2, 3 — green, amber, red. Index 0 has no colour by design. */
  urgency: [string, string, string];
  /** The same three as a whole-note wash, quiet enough to read body text on. */
  urgencyFill: [string, string, string];
};

export const light: Palette = {
  board: '#fdf7ec',
  line: '#f3e8d6',
  surface: '#fffdf8',
  ink: '#3a3026',
  inkSoft: '#6b5f4c',
  inkFaint: '#7c6e58',
  rule: '#ece0cd',
  accent: '#6e5220',
  warn: '#9c5d12',
  notes: ['#ffeba3', '#cdeed6', '#ded8f2', '#ffd4c2'],
  noteEdge: 'rgba(58,48,38,0.12)',
  // Chosen to clear 3:1 against every one of the four note colours above,
  // which is the contrast floor for a graphic that carries meaning.
  urgency: ['#1e7a48', '#9a6a00', '#b3261e'],
  // A whole note in a flat red would shout, and a board of shouting notes
  // says nothing. These are washes at roughly the weight of the stationery
  // colours, so ink stays at 7:1 and an urgent note reads as urgent without
  // taking the room over.
  urgencyFill: ['#d7eedd', '#ffe6b4', '#ffd5cd'],
};

/** Designed, not inverted: the same four stationery hues taken down to night. */
export const dark: Palette = {
  board: '#1a1713',
  line: '#241f19',
  surface: '#241f19',
  ink: '#f2eae0',
  inkSoft: '#b5a897',
  inkFaint: '#8d8273',
  rule: '#302922',
  accent: '#e8c892',
  warn: '#e8a74e',
  notes: ['#4a3f1e', '#2d4031', '#37314f', '#4a3328'],
  noteEdge: 'rgba(0,0,0,0.4)',
  urgency: ['#6fd39b', '#e8c04e', '#ff8a7a'],
  urgencyFill: ['#1f3b2c', '#453516', '#4a2420'],
};

/** Shadows differ per theme: on cream a solid drop-edge reads as paper; on near-black it doesn't. */
export const elevation = {
  light: {
    shadowColor: '#3a3026',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dark: {
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
} as const;

export const radius = { note: 12, card: 15, sheet: 22, pill: 999 } as const;

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
