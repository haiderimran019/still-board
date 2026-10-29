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
