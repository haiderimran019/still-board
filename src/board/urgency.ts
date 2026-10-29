import type { Priority } from '../db/schema';

/**
 * Urgency, in words as well as colour.
 *
 * Nobody should have to tell red from amber to know what a note means, so
 * every place a colour appears there is a label behind it — on the sheet in
 * plain text, and in the accessibility label of the note itself. Red-green
 * colour blindness is common enough that a board relying on the difference
 * would be unusable for a tenth of a class.
 */
export const URGENCY: Record<Priority, { label: string; short: string }> = {
  0: { label: 'No colour', short: '' },
  1: { label: 'Can wait', short: 'Low' },
  2: { label: 'Soon', short: 'Soon' },
  3: { label: 'Urgent', short: 'Urgent' },
};

/**
 * The urgency colour, or null when a note is carrying no urgency at all.
 *
 * Called twice for the same note: once against the strong palette for the
 * note's edge, once against the washes for its whole face. Keeping it one
 * function means the two can never disagree about which notes are coloured.
 */
export function urgencyColour(p: Priority, palette: readonly string[]): string | null {
  return p === 0 ? null : (palette[p - 1] ?? null);
}
