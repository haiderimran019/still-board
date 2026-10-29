import { DONE_WINDOW_DAYS } from '../config';

/**
 * Reading back what you have cleared.
 *
 * Grouped by day rather than listed flat, because the useful question is
 * never "what have I ever finished" — it is "did I get anywhere today".
 */

export type Done = { completedAt: number | null };
export type DayGroup<T> = { key: string; label: string; notes: T[] };

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Today and yesterday get names; anything older gets its date. */
export function dayLabel(at: number, now: Date): string {
  const today = startOfDay(now);
  const day = startOfDay(new Date(at));
  const back = Math.round((today - day) / 86_400_000);

  if (back <= 0) return 'Today';
  if (back === 1) return 'Yesterday';
  if (back < 7) return new Date(at).toLocaleDateString('en', { weekday: 'long' });

  const d = new Date(at);
  return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`;
}

/**
 * Newest day first, and newest note within each day. Notes with no
 * completion time can't be placed on a day and are left out rather than
 * being guessed into one.
 */
export function groupByDay<T extends Done>(notes: readonly T[], now: Date): DayGroup<T>[] {
  const byDay = new Map<number, T[]>();

  for (const n of notes) {
    if (n.completedAt === null) continue;
    const key = startOfDay(new Date(n.completedAt));
    const list = byDay.get(key);
    if (list) list.push(n);
    else byDay.set(key, [n]);
  }

  return [...byDay.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([key, list]) => ({
      key: String(key),
      label: dayLabel(key, now),
      notes: list.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    }));
}

/** The line at the bottom explaining why the list stops where it does. */
export function windowNote(count: number): string {
  if (count === 0) return 'Nothing cleared in the last month.';
  return `The last ${DONE_WINDOW_DAYS} days. Older ones are still saved, just not piled up here.`;
}
