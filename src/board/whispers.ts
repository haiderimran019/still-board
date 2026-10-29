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
