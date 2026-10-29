import type { Section } from '../db/schema';

/**
 * Where a dragged note would land.
 *
 * Kept apart from the gesture code and from React entirely, because this is
 * the part that is easy to get subtly wrong — off-by-one insertions, a note
 * that can't be dropped at the very bottom, a dead zone between sections —
 * and nearly impossible to check by hand on a phone.
 *
 * All coordinates are screen coordinates, measured once when the drag starts.
 */

export type NoteRect = { id: string; section: Section; y: number; h: number };
export type SectionRect = { section: Section; y: number; h: number };
export type Drop = { section: Section; index: number };

/**
 * The section under the finger. Above the first or below the last, the
 * nearest one wins rather than nothing: a drag that ends slightly off the
 * board should still do what the user plainly meant.
 */
export function sectionAt(sections: readonly SectionRect[], pageY: number): Section | null {
  if (sections.length === 0) return null;

  for (const s of sections) {
    if (pageY >= s.y && pageY < s.y + s.h) return s.section;
  }

  const ordered = [...sections].sort((a, b) => a.y - b.y);
  if (pageY < ordered[0].y) return ordered[0].section;
  const last = ordered[ordered.length - 1];
  if (pageY >= last.y + last.h) return last.section;

  // Between two sections — a gap or a divider. Take the one just above.
  let best = ordered[0].section;
  for (const s of ordered) if (s.y <= pageY) best = s.section;
  return best;
}

/**
 * The index the note would take within that section, counting only the notes
 * that will still be there — the dragged note itself is excluded, so moving a
 * note down within its own section doesn't land one place short.
 */
export function dropTarget(
  sections: readonly SectionRect[],
  notes: readonly NoteRect[],
  pageY: number,
  draggedId: string
): Drop | null {
  const section = sectionAt(sections, pageY);
  if (section === null) return null;

  const others = notes
    .filter((n) => n.section === section && n.id !== draggedId)
    .sort((a, b) => a.y - b.y);

  // Past the middle of a note means "after it".
  let index = 0;
  for (const n of others) {
    if (pageY >= n.y + n.h / 2) index++;
    else break;
  }
  return { section, index };
}

/** True when the drop would change nothing, so the write can be skipped. */
export function isNoOp(drop: Drop, from: Section, currentIndex: number): boolean {
  return drop.section === from && drop.index === currentIndex;
}
