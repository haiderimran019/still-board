import type { Section } from '../db/schema';

/**
 * All the board's wording in one place. The three sections have to feel
 * different in tone, not just in name — Now asks something of you, Someday
 * deliberately asks nothing.
 */
export const SECTION_COPY: Record<Section, { name: string; sub: string; empty: string }> = {
  now: {
    name: 'Now',
    sub: "what you're carrying today",
    empty: 'Nothing here yet. What actually deserves today?',
  },
  next: {
    name: 'Next',
    sub: 'soon, but not today',
    empty: "Empty — and that's fine.",
  },
  someday: {
    name: 'Someday',
    sub: 'no pressure to act',
    empty: 'Room for the things that can wait.',
  },
};
