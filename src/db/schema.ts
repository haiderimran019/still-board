/**
 * One table. Completed notes stay in it with `completed_at` set, so the Done
 * list is a query rather than a second store and Undo is a single UPDATE.
 *
 * `position` is a REAL, not an INTEGER: dropping a note between two others
 * writes one row instead of renumbering the section. See docs/10-mobile-plan.md.
 */
export const SCHEMA_VERSION = 4;

export const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS notes (
  id           TEXT    PRIMARY KEY NOT NULL,
  text         TEXT    NOT NULL,
  section      TEXT    NOT NULL CHECK (section IN ('now','next','nextweek','someday')),
  position     REAL    NOT NULL,
  tint         INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  completed_at INTEGER,
  remind_at    INTEGER,
  priority     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS notes_board
  ON notes (section, position) WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS notes_due
  ON notes (remind_at) WHERE remind_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS notes_done
  ON notes (completed_at DESC) WHERE completed_at IS NOT NULL;

-- Settings that have to outlive a launch: which theme you picked, when the
-- board last reached your Drive. Deliberately not a second notes table —
-- anything that belongs to a note belongs in the row with it.
CREATE TABLE IF NOT EXISTS prefs (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

export type Section = 'now' | 'next' | 'nextweek' | 'someday';

/**
 * How much a note is on fire. 0 is the honest default and most notes stay
 * there — a board where everything is urgent says nothing at all.
 */
export const PRIORITIES = [0, 1, 2, 3] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SECTIONS: readonly Section[] = ['now', 'next', 'nextweek', 'someday'] as const;

export type Note = {
  id: string;
  text: string;
  section: Section;
  position: number;
  tint: number;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  /** Only ever set on a note in Now — see repository.setReminder. */
  remindAt: number | null;
  priority: Priority;
};

/** The shape SQLite hands back: snake_case columns, no nulls coerced. */
export type NoteRow = {
  id: string;
  text: string;
  section: Section;
  position: number;
  tint: number;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  remind_at: number | null;
  priority: number | null;
};

export function toNote(r: NoteRow): Note {
  return {
    id: r.id,
    text: r.text,
    section: r.section,
    position: r.position,
    tint: r.tint,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at,
    remindAt: r.remind_at,
    // Anything unexpected reads as "no priority" rather than throwing a
    // whole board away over one bad number.
    priority: ([0, 1, 2, 3] as number[]).includes(r.priority ?? 0)
      ? ((r.priority ?? 0) as Priority)
      : 0,
  };
}
