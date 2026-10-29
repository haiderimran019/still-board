/**
 * When a reminder goes off, and how that reads back to you.
 *
 * Three presets and nothing else. A date-and-time picker turns "remind me"
 * into a small planning exercise, which is the opposite of what someone
 * reaching for a sticky note wants. If none of the three fit, the honest
 * answer is that the note probably isn't a Now.
 */

const HOUR = 3_600_000;

export type ReminderChoice = {
  key: 'hour' | 'evening' | 'morning';
  label: string;
  at: number;
};

/** The same clock time on today or, if it has gone, tomorrow. */
export function nextAtHour(now: Date, hour: number): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function inHours(now: Date, hours: number): number {
  return now.getTime() + hours * HOUR;
}

/** 18:30 reads as "6:30 pm" — the way people say it out loud. */
export function clockTime(at: number): string {
  const d = new Date(at);
  const h24 = d.getHours();
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${h24 < 12 ? 'am' : 'pm'}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** How a set reminder is shown back on the note. */
export function reminderLabel(at: number, now: Date): string {
  const when = new Date(at);
  if (at <= now.getTime()) return 'due';
  if (sameDay(when, now)) return `today ${clockTime(at)}`;

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (sameDay(when, tomorrow)) return `tomorrow ${clockTime(at)}`;

  const month = when.toLocaleString('en', { month: 'short' });
  return `${when.getDate()} ${month} ${clockTime(at)}`;
}

/** The three buttons, with the labels already resolved against the clock. */
export function reminderChoices(now: Date): ReminderChoice[] {
  const evening = nextAtHour(now, 18);
  const morning = nextAtHour(now, 8);
  return [
    { key: 'hour', label: 'In an hour', at: inHours(now, 1) },
    { key: 'evening', label: sameDay(new Date(evening), now) ? 'This evening' : 'Tomorrow evening', at: evening },
    { key: 'morning', label: 'Tomorrow morning', at: morning },
  ];
}
