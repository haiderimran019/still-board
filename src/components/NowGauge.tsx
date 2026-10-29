import { StyleSheet, Text, View } from 'react-native';

import { NOW_LIMIT } from '../config';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/**
 * How full Now is, shown three ways at once: the filled pips, the count, and —
 * at the limit — a word. Colour alone never carries the meaning, which is the
 * accessibility rule this board is held to, and also just clearer in sunlight.
 *
 * Nothing here scolds. A full Now is a fact about the board, not a mistake.
 */
export function NowGauge({ count }: { count: number }) {
  const t = useTheme();
  const full = count >= NOW_LIMIT;
  const colour = full ? t.c.warn : t.c.accent;

  return (
    <View
      accessible
      accessibilityLabel={
        full
          ? `Now is full: ${count} of ${NOW_LIMIT} notes.`
          : `${count} of ${NOW_LIMIT} notes in Now.`
      }
    >
      <View style={s.pips} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: NOW_LIMIT }).map((_, i) => (
          <View key={i} style={[s.pip, { backgroundColor: i < count ? colour : t.c.rule }]} />
        ))}
      </View>
      {full && (
        <Text style={[type.label, s.word, { color: t.c.warn }]}>
          Now is full — that's the point of it
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  pips: { flexDirection: 'row', gap: 3, paddingTop: 9 },
  pip: { height: 3, flex: 1, borderRadius: 2 },
  word: { paddingTop: 7 },
});
