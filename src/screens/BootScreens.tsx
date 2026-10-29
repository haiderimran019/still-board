import { StyleSheet, Text, View } from 'react-native';

import { space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/** Hold on the board colour rather than flashing white before the fonts land. */
export function Booting() {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.c.board }} />;
}

/**
 * Your notes are still on the device; this screen just couldn't reach them.
 * Saying so matters: a blank board is indistinguishable from having lost
 * everything, and this app's whole promise is that it holds what you put in it.
 */
export function BootFailed({ message }: { message: string }) {
  const t = useTheme();
  return (
    <View style={[s.wrap, { backgroundColor: t.c.board }]}>
      <Text style={[type.section, s.title, { color: t.c.ink }]}>The board didn't open</Text>
      <Text style={[type.body, s.body, { color: t.c.inkSoft }]}>
        Your notes are still saved on this device. Reopening the app usually fixes this.
      </Text>
      <Text style={[type.caption, s.detail, { color: t.c.inkFaint }]}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  title: { marginBottom: space.sm },
  body: { textAlign: 'center', marginBottom: space.lg },
  detail: { textAlign: 'center' },
});
