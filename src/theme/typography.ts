/**
 * The rule: the app speaks in Gabarito, you write in Caveat.
 * Note text is the only thing set in the handwriting face.
 *
 * Caveat replaced Shantell Sans: Shantell is rounded and comic-ish, which
 * read as cheerful rather than calm, and its wide letterforms cost a lot of
 * line length on a phone. Caveat is a real pen hand — warmer, narrower, and
 * it makes a note look written rather than typed in a friendly font.
 *
 * Swapping it again is this one line plus the import in App.tsx. It is set
 * larger than the UI text because handwriting faces carry a smaller x-height
 * at the same nominal size and would otherwise read as the quieter voice.
 */

export const fonts = {
  ui: 'Gabarito_400Regular',
  uiMedium: 'Gabarito_500Medium',
  uiSemi: 'Gabarito_600SemiBold',
  uiBold: 'Gabarito_700Bold',
  hand: 'Caveat_600SemiBold',
} as const;

export const type = {
  wordmark:  { fontFamily: fonts.uiBold,  fontSize: 32, letterSpacing: -1.1 },
  section:   { fontFamily: fonts.uiBold,  fontSize: 21, letterSpacing: -0.4 },
  body:      { fontFamily: fonts.ui,      fontSize: 15 },
  bodyStrong:{ fontFamily: fonts.uiSemi,  fontSize: 15 },
  note:      { fontFamily: fonts.hand,    fontSize: 19, lineHeight: 24 },
  label:     { fontFamily: fonts.uiMedium,fontSize: 13 },
  caption:   { fontFamily: fonts.ui,      fontSize: 12.5 },
} as const;
