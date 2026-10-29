import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the phone has been asked to cut down on animation.
 *
 * Motion on this board is decoration with one exception — the drag, which
 * follows your finger and is the thing itself rather than a flourish on top
 * of it. Everything else (notes rising into place, a finished note lifting
 * away, sheets sliding up) exists to make the board feel like paper, and for
 * someone who gets motion sick from it, that trade is a bad one. iOS calls
 * the setting Reduce Motion; Android calls it Remove animations.
 *
 * One subscription for the whole app rather than one per note: a board of
 * twenty notes would otherwise hold twenty listeners for a value that is the
 * same for every one of them. The listener is never removed, because it
 * lives exactly as long as the app does.
 */
let reduced = false;
let listening = false;
const watchers = new Set<(v: boolean) => void>();

function announce(v: boolean): void {
  if (v === reduced) return;
  reduced = v;
  for (const w of watchers) w(v);
}

function listen(): void {
  if (listening) return;
  listening = true;
  // A phone that will not answer the question is treated as not having asked
  // for less motion, which is the same as the default.
  void AccessibilityInfo.isReduceMotionEnabled().then(announce).catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', announce);
}

export function useReducedMotion(): boolean {
  const [v, setV] = useState(reduced);
  useEffect(() => {
    listen();
    watchers.add(setV);
    // The first answer may have landed between the initial state and here.
    setV(reduced);
    return () => {
      watchers.delete(setV);
    };
  }, []);
  return v;
}

/**
 * A duration, or none at all.
 *
 * Written this way so the animations below stay readable as animations —
 * `duration: ms(260, calm)` rather than an `if` wrapped around every call,
 * and a value of 0 means Animated still runs the sequence and still fires its
 * callback, so nothing downstream has to know the difference.
 */
export const ms = (normal: number, reduce: boolean): number => (reduce ? 0 : normal);

/**
 * How a sheet should arrive. Sliding is most of the character of this app's
 * sheets, and the first thing to go when someone has asked for less movement.
 */
export function useSheetAnimation(normal: 'slide' | 'fade'): 'slide' | 'fade' | 'none' {
  return useReducedMotion() ? 'none' : normal;
}
