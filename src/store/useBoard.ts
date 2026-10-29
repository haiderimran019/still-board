import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clearedToday } from '../board/whispers';
import * as repo from '../db/repository';
import type { FreeUp } from '../db/repository';
import type { Note, Section } from '../db/schema';

/** A line the board says, and optionally the way to take it back. */
export type Notice = { text: string; undo?: () => Promise<void> };
import { feel } from '../feel/haptics';
import * as reminders from '../feel/reminders';

/**
 * The board, and everything that changes it.
 *
 * Screens read from here and call these actions; nothing above this hook
 * touches the repository. Every action writes first and re-reads after, so
 * what is on screen is always what is on disk — no optimistic copy that can
 * drift out of step with the database.
 */
export function useBoard() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [done, setDone] = useState<Note[]>([]);
  const [bootError, setBootError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * One line, briefly, for the few things the board has to say out loud —
   * and, where something was taken away, the way to get it back.
   */
  const say = useCallback((text: string, undo?: () => Promise<void>) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ text, undo });
    noticeTimer.current = setTimeout(() => setNotice(null), undo ? 6000 : 4000);
  }, []);

  const hush = useCallback(() => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(null);
  }, []);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const refresh = useCallback(async () => {
    const [board, cleared] = await Promise.all([repo.listBoard(), repo.listDone()]);
    setNotes(board);
    setDone(cleared);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await repo.init();
        await repo.seedIfEmpty();
        await refresh();
      } catch (e) {
        setBootError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [refresh]);

  const create = useCallback(
    async (text: string, section: Section) => {
      await repo.create(text, section);
      await refresh();
    },
    [refresh]
  );

  /** Used only when Now is full: one note leaves, the new one takes its place. */
  const swapIntoNow = useCallback(
    async (text: string, outgoingId: string, how: FreeUp) => {
      await repo.createInNowBySwapping(text, outgoingId, how);
      await refresh();
    },
    [refresh]
  );

  const edit = useCallback(
    async (id: string, text: string) => {
      await repo.edit(id, text);
      await refresh();
    },
    [refresh]
  );

  /** Moving out of Now drops the reminder, so the scheduled one has to go too. */
  const move = useCallback(
    async (id: string, section: Section) => {
      if (section !== 'now') await reminders.cancel(id);
      await repo.moveToEnd(id, section);
      await refresh();
    },
    [refresh]
  );

  /**
   * The note card plays the finishing animation and its own haptic, then
   * calls this. Nothing is destroyed — the note keeps its place in the table
   * with a completed_at, so Undo is one write and costs nothing.
   */
  const complete = useCallback(
    async (id: string) => {
      await reminders.cancel(id);
      await repo.complete(id);
      await refresh();
      say('Cleared.', async () => {
        await repo.uncomplete(id);
        await refresh();
      });
    },
    [refresh, say]
  );

  /** Deleting is the one thing here that cannot be taken back, so the sheet
   *  asks twice before it gets this far. */
  const remove = useCallback(
    async (id: string) => {
      await reminders.cancel(id);
      await repo.remove(id);
      await refresh();
      say('Dropped.');
    },
    [refresh, say]
  );

  /**
   * Stores the reminder and schedules the notification together, or does
   * neither. Showing "today 6pm" on a note that can never fire would be the
   * app lying to someone who is relying on it.
   */
  const remind = useCallback(
    async (id: string, at: number | null) => {
      if (at === null) {
        await reminders.cancel(id);
        await repo.setReminder(id, null);
        await refresh();
        return;
      }
      const allowed = await reminders.ensureAllowed();
      if (!allowed) {
        say('Notifications are off for this app, so the reminder was not set.');
        return;
      }
      const note = (notes ?? []).find((n) => n.id === id);
      await repo.setReminder(id, at);
      await reminders.schedule(id, note?.text ?? 'A note is waiting for you', at);
      feel.added();
      await refresh();
    },
    [notes, refresh, say]
  );

  const exportAll = useCallback(() => repo.exportAll(), []);

  const importNotes = useCallback(
    async (incoming: Note[]) => {
      const added = await repo.importNotes(incoming);
      if (added > 0) await refresh();
      return added;
    },
    [refresh]
  );

  /** Back onto the board, at the end of the section it came from. */
  const restore = useCallback(
    async (id: string) => {
      await repo.uncomplete(id);
      await refresh();
    },
    [refresh]
  );

  /** Where a drag ends up: section and position in one write. */
  const reorder = useCallback(
    async (id: string, section: Section, index: number) => {
      if (section !== 'now') await reminders.cancel(id);
      await repo.place(id, section, index);
      await refresh();
    },
    [refresh]
  );

  /** A drag that Now could not accept. Said once, quietly, then gone. */
  const refuse = useCallback(() => {
    say('Now is full. Finish or move something first.');
  }, [say]);

  const nowNotes = useMemo(() => (notes ?? []).filter((n) => n.section === 'now'), [notes]);

  /** Recomputed on every refresh rather than stored, so it can't go stale at midnight. */
  const todayCount = useMemo(
    () => clearedToday(done.map((n) => n.completedAt ?? 0), new Date()),
    [done]
  );

  return {
    notes,
    nowNotes,
    done,
    doneCount: done.length,
    todayCount,
    bootError,
    notice,
    hush,
    refresh,
    create,
    swapIntoNow,
    edit,
    move,
    complete,
    remove,
    remind,
    reorder,
    refuse,
    restore,
    exportAll,
    importNotes,
  };
}
