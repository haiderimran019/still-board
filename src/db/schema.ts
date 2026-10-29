/**
 * One table. Completed notes stay in it with `completed_at` set, so the Done
 * list is a query rather than a second store and Undo is a single UPDATE.
 *
 * `position` is a REAL, not an INTEGER: dropping a note between two others
 * writes one row instead of renumbering the section. See docs/10-mobile-plan.md.
 */
export const SCHEMA_VERSION = 2;

export const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS notes (
  id           TEXT    PRIMARY KEY NOT NULL,
  text         TEXT    NOT NULL,
  section      TEXT    NOT NULL CHECK (section IN ('now','next','someday')),
  position     REAL    NOT NULL,
  tint         INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  completed_at INTEGER,
  remind_at    INTEGER
);

CREATE INDEX IF NOT EXISTS notes_board
  ON notes (section, position) WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS notes_due
  ON notes (remind_at) WHERE remind_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS notes_done
  ON notes (completed_at DESC) WHERE completed_at IS NOT NULL;
`;

export type Section = 'now' | 'next' | 'someday';

export const SECTIONS: readonly Section[] = ['now', 'next', 'someday'] as const;

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
  };
}
