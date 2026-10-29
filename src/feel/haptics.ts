import * as Haptics from 'expo-haptics';

/**
 * The board's sense of touch.
 *
 * Three moments only. Haptics are easy to overdo and a buzzing task app is
 * the opposite of calm, so there is no feedback for scrolling, opening,
 * closing, or typing — only for the three times something actually changed.
 *
 * Every call is fire-and-forget and swallows its error: a device with the
 * motor disabled, or no motor at all, must not take the write down with it.
 */
function quietly(run: () => Promise<unknown>): void {
  try {
    run().catch(() => {});
  } catch {
    // Older Androids throw synchronously rather than rejecting.
  }
}

export const feel = {
  /** A note landed on the board. */
  added: () => quietly(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** Now is full. Firmer than 'added', because something is being asked of you. */
  refused: () => quietly(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  /** A note made room for another one. */
  resolved: () => quietly(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
};
