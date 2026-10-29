/**
 * The small things the board says about itself.
 *
 * Every line here has to pass one test: would it still feel kind on the worst
 * week of someone's term? So nothing counts streaks, nothing turns red, and
 * nothing tells the user they are behind. The board states facts and leaves
 * the judgement to the person holding the phone.
 *
 * Pure functions on purpose — the wording is the part most likely to be
 * argued about, so it should be the part easiest to test and change.
 */

import { SOMEDAY_BOX_DAYS, SOMEDAY_FADE_DAYS } from '../config';

const DAY = 86_400_000;

export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'late';

export function partOfDay(d: Date): PartOfDay {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'late';
}

const GREETING: Record<PartOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late: 'Late',
};

/**
 * The line under the wordmark. It replaces the tagline once there is a board
 * to describe — a tagline is for strangers, and by the second launch the user
 * is not one.
 */
export function headerLine(now: Date, nowCount: number, total: number): string {
  if (total === 0) return 'A clean board.';

  const part = partOfDay(now);

  // The one time the board offers an opinion, and it offers permission.
  if (part === 'late' && nowCount > 0) return 'Late — most of this can wait for tomorrow.';
  if (nowCount === 0) return `${GREETING[part]} — nothing in Now yet.`;

  return `${GREETING[part]} · ${nowCount} in Now`;
}

/** Whole days a note has been on the board. */
export function daysHeld(createdAt: number, now: number): number {
  return Math.max(0, Math.floor((now - createdAt) / DAY));
}

/**
 * A note that has sat in Now for days is worth noticing — Now is meant to
 * turn over. The wording states the age and stops there; "still not done" is
 * the user's conclusion to draw, not the app's to announce.
 *
 * Returns null for anything newer than four days, which is most notes.
 */
export function ageWhisper(createdAt: number, now: number): string | null {
  const d = daysHeld(createdAt, now);
  if (d >= 21) return 'here three weeks';
  if (d >= 14) return 'here two weeks';
  if (d >= 7) return 'here a week';
  if (d >= 4) return `here ${d} days`;
  return null;
}

/**
 * How many notes were cleared today. Today only — a running total would turn
 * into a score, and a score is a thing you can be losing at.
 */
export function clearedToday(completedAt: readonly number[], now: Date): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return completedAt.filter((t) => t >= start).length;
}

/**
 * How strongly a Someday note still asks to be seen.
 *
 * Someday is where you put something down. Anything that sits there for weeks
 * has answered its own question, so it quietly loses its grip on your
 * attention rather than being deleted behind your back — it is all still
 * there, just no longer shouting.
 *
 * 1 while it is fresh, easing to 0.4 by the time it is ready for the box.
 */
export function somedayFade(createdAt: number, now: number): number {
  const d = daysHeld(createdAt, now);
  if (d <= SOMEDAY_FADE_DAYS) return 1;
  if (d >= SOMEDAY_BOX_DAYS) return 0.4;
  const through = (d - SOMEDAY_FADE_DAYS) / (SOMEDAY_BOX_DAYS - SOMEDAY_FADE_DAYS);
  return Number((1 - through * 0.6).toFixed(3));
}

/**
 * Splits Someday into what is still on the board and what has folded itself
 * into the box. Nothing is ever deleted by age — the box is a drawer, not a
 * bin, and one tap opens it.
 */
export function splitSomeday<T extends { createdAt: number }>(
  notes: readonly T[],
  now: number
): { out: T[]; boxed: T[] } {
  const out: T[] = [];
  const boxed: T[] = [];
  for (const n of notes) (daysHeld(n.createdAt, now) >= SOMEDAY_BOX_DAYS ? boxed : out).push(n);
  return { out, boxed };
}

/** What the closed box says about itself. */
export function boxLabel(count: number): string {
  return count === 1 ? '1 idea resting' : `${count} ideas resting`;
}
