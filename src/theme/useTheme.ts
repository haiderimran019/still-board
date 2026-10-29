import { useColorScheme } from 'react-native';
import { dark, elevation, light, Palette } from './tokens';

export type Theme = {
  c: Palette;
  isDark: boolean;
  shadow: typeof elevation.light | typeof elevation.dark;
};

/**
 * Follows the system. There is no in-app theme switch yet and the brief doesn't
 * ask for one — if it ever does, this is the only hook that changes.
 */
export function useTheme(): Theme {
  const isDark = useColorScheme() === 'dark';
  return {
    c: isDark ? dark : light,
    isDark,
    shadow: isDark ? elevation.dark : elevation.light,
  };
}
