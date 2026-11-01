import type { Section } from '../db/schema';

/**
 * All the board's wording in one place. The sections have to feel different
 * in tone, not just in name — Now asks something of you, Someday deliberately
 * asks nothing, and the two in between are a ladder away from today.
 */
export const SECTION_COPY: Record<Section, { name: string; sub: string; empty: string }> = {
  now: {
    name: 'Now',
    sub: 'Just today. The rest can wait.',
    empty: 'A little space for what matters.',
  },
  next: {
    name: 'Next',
    sub: 'Soon, but not all at once.',
    empty: "Nothing waiting right now. That's fine.",
  },
  nextweek: {
    name: 'Next week',
    sub: 'the week ahead',
    empty: 'Nothing waiting for next week.',
  },
  someday: {
    name: 'Someday',
    sub: 'A soft landing for your maybes.',
    empty: 'Good things can take their sweet time.',
  },
};
