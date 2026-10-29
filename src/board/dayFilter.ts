const DAY = 86_400_000;

/**
 * The strip of filters across the top of the board.
 *
 * It answers "what did I take on today?" without hiding anything
 * permanently — the board is still one board, this is just a lens over it.
 * `all` is the default and stays the default: a filter that persists between
 * launches is how someone loses half their notes and blames the app.
 */
export type DayFilter = 'all' | 'today' | 'week' | 'older';

export const DAY_FILTERS: { key: DayFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'older', label: 'Older' },
];

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Measured from midnight, not from 24 hours ago — "today" means today. */
export function matchesFilter(createdAt: number, now: Date, filter: DayFilter): boolean {
  if (filter === 'all') return true;
  const midnight = startOfDay(now);
  if (filter === 'today') return createdAt >= midnight;
  if (filter === 'week') return createdAt >= midnight - 6 * DAY;
  return createdAt < midnight - 6 * DAY;
}

/**
 * How many notes each filter would show. Used to grey out a filter that
 * would land you on an empty board, which is a dead end rather than an
 * answer.
 */
export function filterCounts<T extends { createdAt: number }>(
  notes: readonly T[],
  now: Date
): Record<DayFilter, number> {
  const counts: Record<DayFilter, number> = { all: notes.length, today: 0, week: 0, older: 0 };
  for (const n of notes) {
    if (matchesFilter(n.createdAt, now, 'today')) counts.today++;
    if (matchesFilter(n.createdAt, now, 'week')) counts.week++;
    if (matchesFilter(n.createdAt, now, 'older')) counts.older++;
  }
  return counts;
}
