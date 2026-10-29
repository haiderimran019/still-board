/**
 * Fractional positions. Kept separate from the database so the ordering rules
 * can be reasoned about — and tested — without opening SQLite.
 */

/** The gap between notes appended one after another. */
export const STEP = 1024;

/**
 * Where a note goes when dropped between `before` and `after`, either of which
 * may be missing at the ends of a list.
 */
export function between(before: number | null, after: number | null): number {
  if (before == null && after == null) return STEP;
  if (before == null) return (after as number) - STEP;
  if (after == null) return before + STEP;
  return (before + after) / 2;
}

/**
 * Floats run out of room if you keep halving the same gap. After ~50 inserts
 * between the same two notes the midpoint stops moving, so the caller
 * renumbers that section instead. This reports when that has happened.
 */
export function needsRenumber(before: number | null, after: number | null): boolean {
  if (before == null || after == null) return false;
  const mid = (before + after) / 2;
  return mid <= before || mid >= after;
}

/** Evenly spaced positions for a section being renumbered. */
export function renumber(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * STEP);
}
