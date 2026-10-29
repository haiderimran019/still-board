// Imported one weight at a time, not from the package root: the root index
// pulls in every weight the family ships, which put ~5MB of unused fonts into
// the bundle. These five are the only faces the app actually draws with.
import { Gabarito_400Regular } from '@expo-google-fonts/gabarito/400Regular';
import { Gabarito_500Medium } from '@expo-google-fonts/gabarito/500Medium';
import { Gabarito_600SemiBold } from '@expo-google-fonts/gabarito/600SemiBold';
import { Gabarito_700Bold } from '@expo-google-fonts/gabarito/700Bold';
import { ShantellSans_500Medium } from '@expo-google-fonts/shantell-sans/500Medium';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as repo from './src/db/repository';
import type { Note } from './src/db/schema';
import { BoardScreen } from './src/screens/BoardScreen';
import { BootFailed, Booting } from './src/screens/BootScreens';

/**
 * Boot and board state. Everything the user sees lives under src/screens.
 *
 * The board is held here as one flat array and split by section where it is
 * drawn — the database already returns it in Now, Next, Someday order, so
 * there is nothing to sort and nothing that can disagree with the store.
 */
export default function App() {
  const [fontsReady] = useFonts({
    Gabarito_400Regular,
    Gabarito_500Medium,
    Gabarito_600SemiBold,
    Gabarito_700Bold,
    ShantellSans_500Medium,
  });

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

  // Temporary: step 4 replaces this with real capture. It exists now only so
  // the board can be filled past the seed while testing.
  const addPlaceholderNote = useCallback(async () => {
    const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await repo.create(`Written at ${stamp}`, 'next');
    await refresh();
  }, [refresh]);

  if (bootError) return <BootFailed message={bootError} />;
  if (!fontsReady || notes === null) return <Booting />;

  return (
    <SafeAreaProvider>
      <BoardScreen notes={notes} doneCount={doneCount} onAdd={addPlaceholderNote} />
    </SafeAreaProvider>
  );
}
