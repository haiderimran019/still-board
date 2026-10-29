/**
 * The rule: the app speaks in Gabarito, you write in your own face.
 * Note text is the only thing set in it.
 *
 * Shantell Sans is the default — the face the board was designed around.
 * Each face needs its own metrics: Shantell is drawn wide and sits large,
 * Mako is a narrow grotesque, Caveat is handwriting and reads small. So the
 * sizing follows the choice rather than being one compromise that suits none
 * of them. Set NOTE_FACE in config.ts.
 */
import { NOTE_FACE } from '../config';

export const fonts = {
  ui: 'Gabarito_400Regular',
  uiMedium: 'Gabarito_500Medium',
  uiSemi: 'Gabarito_600SemiBold',
  uiBold: 'Gabarito_700Bold',
  hand:
    NOTE_FACE === 'shantell'
      ? 'ShantellSans_500Medium'
      : NOTE_FACE === 'mako'
        ? 'Mako_400Regular'
        : 'Caveat_600SemiBold',
} as const;

export const type = {
  wordmark:  { fontFamily: fonts.uiBold,  fontSize: 32, letterSpacing: -1.1 },
  section:   { fontFamily: fonts.uiBold,  fontSize: 21, letterSpacing: -0.4 },
  body:      { fontFamily: fonts.ui,      fontSize: 15 },
  bodyStrong:{ fontFamily: fonts.uiSemi,  fontSize: 15 },
  note:
    NOTE_FACE === 'shantell'
      ? { fontFamily: fonts.hand, fontSize: 15.5, lineHeight: 23, letterSpacing: 0 }
      : NOTE_FACE === 'mako'
        ? { fontFamily: fonts.hand, fontSize: 16.5, lineHeight: 24, letterSpacing: 0.15 }
        : { fontFamily: fonts.hand, fontSize: 19, lineHeight: 24, letterSpacing: 0 },
  label:     { fontFamily: fonts.uiMedium,fontSize: 13 },
  caption:   { fontFamily: fonts.ui,      fontSize: 12.5 },
} as const;
