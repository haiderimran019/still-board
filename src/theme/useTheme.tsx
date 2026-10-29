import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import * as repo from '../db/repository';
import { dark, elevation, light, Palette } from './tokens';

export type Theme = {
  c: Palette;
  isDark: boolean;
  shadow: typeof elevation.light | typeof elevation.dark;
};

/** What you chose, which is not the same as what you are looking at. */
export type ThemeMode = 'system' | 'light' | 'dark';
export const THEME_MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'Auto' },
  { key: 'light', label: 'Day' },
  { key: 'dark', label: 'Night' },
];

const PREF_KEY = 'theme';

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void };
const ThemeCtx = createContext<Ctx>({ mode: 'system', setMode: () => {} });

/**
 * The theme, and the one choice about it.
 *
 * 'system' is the default and stays the default — a board that is dark at
 * midnight without being asked is the behaviour most people want and none of
 * them have to configure. The other two are for the rest, and the choice is
 * remembered in the same database as the notes rather than in a second store.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Read once at mount. Until it arrives the board follows the system, which
  // is both the default and the least startling thing to show for one frame.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const saved = await repo.getPref(PREF_KEY);
        if (alive && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setModeState(saved);
        }
      } catch {
        // A board that cannot read a preference still has to show the board.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    // Applied now, written behind: the switch should never wait on a disk.
    void repo.setPref(PREF_KEY, m).catch(() => {});
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** The chosen mode, for the control that changes it. */
export function useThemeMode(): Ctx {
  return useContext(ThemeCtx);
}

/** The palette to draw with. Every component asks this and nothing else. */
export function useTheme(): Theme {
  const { mode } = useContext(ThemeCtx);
  const system = useColorScheme() === 'dark';
  const isDark = mode === 'system' ? system : mode === 'dark';
  return {
    c: isDark ? dark : light,
    isDark,
    shadow: isDark ? elevation.dark : elevation.light,
  };
}
