import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import * as drive from '../backup/drive';
import * as repo from '../db/repository';
import { syncBoard, type SyncOutcome } from '../sync/sync';
import { googleConfigured, useGoogleAccount, type Account } from './google';

/**
 * One account for the whole app.
 *
 * The sign-in hook holds a token in memory, so there has to be exactly one of
 * it — two copies would mean the profile was signed in and the backup sheet
 * was not. Everything that needs the account reads it from here.
 *
 * The branch below looks like a conditional hook and isn't: `googleConfigured`
 * answers the same way for the whole life of the process, so the tree never
 * swaps between the two. It has to be a branch rather than an early return
 * inside one component, because the auth library throws outright on a
 * platform that has no client ID of its own.
 */

const LAST_SYNC = 'lastSyncedAt';

export type AccountState = {
  /** False when this build has no client ID for this platform. */
  available: boolean;
  ready: boolean;
  busy: boolean;
  account: Account | null;
  error: string | null;
  /** Epoch millis of the last sync that finished, or null. */
  lastSyncedAt: number | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  /** Pull anything new from the account, then put this board back. */
  sync: () => Promise<SyncOutcome>;
};

const INERT: AccountState = {
  available: false,
  ready: false,
  busy: false,
  account: null,
  error: null,
  lastSyncedAt: null,
  signIn: async () => {},
  signOut: () => {},
  sync: async () => ({ ok: false, reason: 'Signing in is not set up in this build.' }),
};

const Ctx = createContext<AccountState>(INERT);

export function AccountProvider({
  children,
  onChanged,
}: {
  children: ReactNode;
  /** Called when a sync brought notes down, so the board can re-read. */
  onChanged?: () => void;
}) {
  if (!googleConfigured()) return <Ctx.Provider value={INERT}>{children}</Ctx.Provider>;
  return <LiveAccount onChanged={onChanged}>{children}</LiveAccount>;
}

function LiveAccount({
  children,
  onChanged,
}: {
  children: ReactNode;
  onChanged?: () => void;
}) {
  const g = useGoogleAccount();
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async (): Promise<SyncOutcome> => {
    if (!g.token) return { ok: false, reason: 'Sign in first.' };
    if (syncing) return { ok: false, reason: 'Already working on it.' };
    setSyncing(true);
    try {
      const out = await syncBoard({
        download: () => drive.download(g.token as string),
        upload: (json) => drive.upload(g.token as string, json),
        exportAll: repo.exportAll,
        importNotes: repo.importNotes,
        now: Date.now,
      });
      if (out.ok) {
        setLastSyncedAt(out.at);
        // The notes went into the database underneath the board's copy of
        // them, so the board is told to look again.
        if (out.pulled > 0) onChanged?.();
        // Written down so the profile can say when, even after a relaunch
        // has thrown the token away.
        void repo.setPref(LAST_SYNC, String(out.at)).catch(() => {});
      }
      return out;
    } finally {
      setSyncing(false);
    }
  }, [g.token, syncing, onChanged]);

  // Signing in is the whole instruction: "wherever I sign in, my board is
  // there". Making someone then find a Sync button would be asking them to
  // say it twice. Guarded by a ref so a re-render cannot start a second one.
  const synced = useRef<string | null>(null);
  useEffect(() => {
    if (!g.token || !g.account) return;
    if (synced.current === g.account.email) return;
    synced.current = g.account.email;
    void sync();
  }, [g.token, g.account, sync]);

  // What the profile says before a sign-in has had time to happen.
  useEffect(() => {
    let alive = true;
    void lastSyncedFromDisk()
      .then((at) => {
        if (alive && at !== null) setLastSyncedAt((prev) => prev ?? at);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const value: AccountState = {
    available: true,
    ready: g.ready,
    busy: g.busy || syncing,
    account: g.account,
    error: g.error,
    lastSyncedAt,
    signIn: g.signIn,
    signOut: () => {
      g.signOut();
      synced.current = null;
      // The notes stay. Signing out of an account is not a reason to take
      // someone's board away from them, and the copy in Drive is still theirs.
    },
    sync,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount(): AccountState {
  return useContext(Ctx);
}

/** The stored time of the last sync, for a launch that hasn't signed in yet. */
export async function lastSyncedFromDisk(): Promise<number | null> {
  const raw = await repo.getPref(LAST_SYNC);
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) ? n : null;
}
