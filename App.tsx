// Imported one weight at a time, not from the package root: the root index
// pulls in every weight the family ships, which put ~5MB of unused fonts into
// the bundle. These five are the only faces the app actually draws with.
import { Gabarito_400Regular } from '@expo-google-fonts/gabarito/400Regular';
import { Gabarito_500Medium } from '@expo-google-fonts/gabarito/500Medium';
import { Gabarito_600SemiBold } from '@expo-google-fonts/gabarito/600SemiBold';
import { Gabarito_700Bold } from '@expo-google-fonts/gabarito/700Bold';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat/600SemiBold';
import { Mako_400Regular } from '@expo-google-fonts/mako/400Regular';
import { ShantellSans_500Medium } from '@expo-google-fonts/shantell-sans/500Medium';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BoardScreen } from './src/screens/BoardScreen';
import { BootFailed, Booting } from './src/screens/BootScreens';
import { Welcome, useWelcome } from './src/screens/Welcome';
import { useBoard } from './src/store/useBoard';
import { AccountProvider } from './src/auth/account';
import { ThemeProvider } from './src/theme/useTheme';

/**
 * Fonts, then the board. All board state and every write lives in useBoard;
 * this file only decides which of the three screens is on show, and puts the
 * two providers above it — the theme, and the account.
 *
 * useBoard is called here rather than below the providers because the account
 * has to be able to tell the board to re-read after a sync has written notes
 * underneath it.
 */
export default function App() {
  const [fontsReady] = useFonts({
    Gabarito_400Regular,
    Gabarito_500Medium,
    Gabarito_600SemiBold,
    Gabarito_700Bold,
    Caveat_600SemiBold,
    Mako_400Regular,
    ShantellSans_500Medium,
  });

  const {
    notes,
    nowNotes,
    doneCount,
    done,
    todayCount,
    bootError,
    notice,
    hush,
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
    setUrgency,
    refresh,
  } = useBoard();

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AccountProvider onChanged={() => void refresh()}>
          <Shell ready={fontsReady && notes !== null} bootError={bootError}>
            {notes !== null && (
              <>
              <BoardScreen
                notes={notes}
                nowNotes={nowNotes}
                doneCount={doneCount}
                done={done}
                todayCount={todayCount}
                notice={notice}
                onHush={hush}
                onCreate={create}
                onSwap={swapIntoNow}
                onEdit={edit}
                onMove={move}
                onComplete={complete}
                onDelete={remove}
                onRemind={remind}
                onUrgency={setUrgency}
                onReorder={reorder}
                onRefused={refuse}
                onRestore={restore}
                onExport={exportAll}
                onImport={importNotes}
              />
              <FirstRun />
              </>
            )}
          </Shell>
        </AccountProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * The welcome, on the first launch and never again.
 *
 * Kept in its own component so the question "has this person been here
 * before?" — which involves a read off disk — cannot hold up the board
 * behind it. It sits over a board that has already loaded, so dismissing it
 * reveals something settled rather than a spinner.
 */
function FirstRun() {
  const { show, dismiss } = useWelcome();
  return <Welcome visible={show} onStart={dismiss} />;
}

/**
 * The three things that can be on screen before the board is: a failure, a
 * wait, or the board itself. Kept inside the providers so that even the
 * waiting screen is in the right theme.
 */
function Shell({
  ready,
  bootError,
  children,
}: {
  ready: boolean;
  bootError: string | null;
  children: React.ReactNode;
}) {
  if (bootError) return <BootFailed message={bootError} />;
  if (!ready) return <Booting />;
  return <>{children}</>;
}
