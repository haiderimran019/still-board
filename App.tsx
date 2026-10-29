// Imported one weight at a time, not from the package root: the root index
// pulls in every weight the family ships, which put ~5MB of unused fonts into
// the bundle. These five are the only faces the app actually draws with.
import { Gabarito_400Regular } from '@expo-google-fonts/gabarito/400Regular';
import { Gabarito_500Medium } from '@expo-google-fonts/gabarito/500Medium';
import { Gabarito_600SemiBold } from '@expo-google-fonts/gabarito/600SemiBold';
import { Gabarito_700Bold } from '@expo-google-fonts/gabarito/700Bold';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat/600SemiBold';
import { Mako_400Regular } from '@expo-google-fonts/mako/400Regular';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BoardScreen } from './src/screens/BoardScreen';
import { BootFailed, Booting } from './src/screens/BootScreens';
import { useBoard } from './src/store/useBoard';

/**
 * Fonts, then the board. All board state and every write lives in useBoard;
 * this file only decides which of the three screens is on show.
 */
export default function App() {
  const [fontsReady] = useFonts({
    Gabarito_400Regular,
    Gabarito_500Medium,
    Gabarito_600SemiBold,
    Gabarito_700Bold,
    Caveat_600SemiBold,
    Mako_400Regular,
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
  } = useBoard();

  if (bootError) return <BootFailed message={bootError} />;
  if (!fontsReady || notes === null) return <Booting />;

  return (
    <SafeAreaProvider>
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
        onReorder={reorder}
        onRefused={refuse}
        onRestore={restore}
        onExport={exportAll}
        onImport={importNotes}
      />
    </SafeAreaProvider>
  );
}
