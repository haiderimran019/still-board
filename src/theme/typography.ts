/**
 * The rule: the app speaks in Gabarito, you write in Shantell.
 * Note text is the only thing set in the handwriting face.
 */

export const fonts = {
  ui: 'Gabarito_400Regular',
  uiMedium: 'Gabarito_500Medium',
  uiSemi: 'Gabarito_600SemiBold',
  uiBold: 'Gabarito_700Bold',
  hand: 'ShantellSans_500Medium',
} as const;

export const type = {
  wordmark:  { fontFamily: fonts.uiBold,  fontSize: 32, letterSpacing: -1.1 },
  section:   { fontFamily: fonts.uiBold,  fontSize: 21, letterSpacing: -0.4 },
  body:      { fontFamily: fonts.ui,      fontSize: 15 },
  bodyStrong:{ fontFamily: fonts.uiSemi,  fontSize: 15 },
  note:      { fontFamily: fonts.hand,    fontSize: 15, lineHeight: 21 },
  label:     { fontFamily: fonts.uiMedium,fontSize: 13 },
  caption:   { fontFamily: fonts.ui,      fontSize: 12.5 },
} as const;
