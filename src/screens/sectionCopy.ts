import type { Section } from '../db/schema';

/**
 * All the board's wording in one place. The sections have to feel different
 * in tone, not just in name — Now asks something of you, Someday deliberately
 * asks nothing, and the two in between are a ladder away from today.
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
  nextweek: {
    name: 'Next week',
    sub: 'the week ahead',
    empty: 'Nothing waiting for next week.',
  },
  someday: {
    name: 'Someday',
    sub: 'no pressure to act',
    empty: 'Room for the things that can wait.',
  },
};
