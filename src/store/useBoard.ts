import { useCallback, useEffect, useMemo, useState } from 'react';

import * as repo from '../db/repository';
import type { FreeUp } from '../db/repository';
import type { Note, Section } from '../db/schema';

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
  const [doneCount, setDoneCount] = useState(0);
  const [bootError, setBootError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [board, done] = await Promise.all([repo.listBoard(), repo.listDone()]);
    setNotes(board);
    setDoneCount(done.length);
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

  const nowNotes = useMemo(() => (notes ?? []).filter((n) => n.section === 'now'), [notes]);

  return { notes, nowNotes, doneCount, bootError, refresh, create, swapIntoNow };
}
