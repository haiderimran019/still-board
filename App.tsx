import {
  Gabarito_400Regular,
  Gabarito_500Medium,
  Gabarito_600SemiBold,
  Gabarito_700Bold,
} from '@expo-google-fonts/gabarito';
import { ShantellSans_500Medium } from '@expo-google-fonts/shantell-sans';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { APP_NAME, NOW_LIMIT, TAGLINE } from './src/config';
import { MIN_TAP, radius, space } from './src/theme/tokens';
import { type } from './src/theme/typography';
import { useTheme } from './src/theme/useTheme';

/** Stand-ins until the database lands in step 2. */
const SAMPLE = [
  { id: '1', text: 'Finish data structures assignment', tint: 0 },
  { id: '2', text: 'Reply to Ayesha about the group project', tint: 1 },
  { id: '3', text: 'Pay hostel fee', tint: 2 },
];

export default function App() {
  const t = useTheme();
  const [ready] = useFonts({
    Gabarito_400Regular,
    Gabarito_500Medium,
    Gabarito_600SemiBold,
    Gabarito_700Bold,
    ShantellSans_500Medium,
  });

  // Hold on the board colour rather than flashing white, then swapping fonts.
  if (!ready) return <View style={{ flex: 1, backgroundColor: t.c.board }} />;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: t.c.board }]}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      <View style={s.head}>
        <Text style={[type.wordmark, { color: t.c.ink }]}>{APP_NAME}</Text>
        <Text style={[type.caption, { color: t.c.inkSoft, marginTop: 1 }]}>{TAGLINE}</Text>
      </View>

      <View style={[s.composer, { backgroundColor: t.c.surface, borderColor: t.c.rule }, t.shadow]}>
        <Text style={[type.body, { color: t.c.inkFaint }]}>What's on your mind?</Text>
        <View style={[s.plus, { backgroundColor: t.c.accent }]}>
          <Text style={{ color: t.c.board, fontSize: 19, lineHeight: 22 }}>+</Text>
        </View>
      </View>

      <View style={s.sectionHead}>
        <Text style={[type.section, { color: t.c.ink }]}>Now</Text>
        <Text style={[type.label, { color: t.c.inkSoft }]}>
          {SAMPLE.length} / {NOW_LIMIT}
        </Text>
      </View>
      <Text style={[type.caption, { color: t.c.inkFaint, paddingHorizontal: space.lg }]}>
        what you're focusing on
      </Text>

      {/* The gauge repeats the count; it never carries it alone. */}
      <View style={s.gauge}>
        {Array.from({ length: NOW_LIMIT }).map((_, i) => (
          <View
            key={i}
            style={[s.pip, { backgroundColor: i < SAMPLE.length ? t.c.accent : t.c.rule }]}
          />
        ))}
      </View>

      <View style={s.notes}>
        {SAMPLE.map((n, i) => (
          <View
            key={n.id}
            style={[
              s.note,
              t.shadow,
              {
                backgroundColor: t.c.notes[n.tint],
                borderColor: t.c.noteEdge,
                transform: [{ rotate: i % 2 ? '0.35deg' : '-0.35deg' }],
              },
            ]}
          >
            <View style={[s.check, { borderColor: t.c.inkFaint }]} />
            <Text style={[type.note, { color: t.c.ink, flex: 1 }]}>{n.text}</Text>
          </View>
        ))}
      </View>

      <Text style={[type.caption, { color: t.c.inkFaint, textAlign: 'center', marginTop: 'auto' }]}>
        Step 1 · fonts and theme. {t.isDark ? 'Dark' : 'Light'}, following your system.
      </Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  head: { paddingHorizontal: space.lg, paddingTop: space.md },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: space.lg,
    marginTop: space.lg,
    marginBottom: space.xl,
    paddingVertical: 13,
    paddingLeft: 16,
    paddingRight: 9,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  plus: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  gauge: { flexDirection: 'row', gap: 3, paddingHorizontal: space.lg, paddingTop: 9, paddingBottom: space.md },
  pip: { height: 3, flex: 1, borderRadius: 2 },
  notes: { paddingHorizontal: space.lg, gap: 10 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.note,
    paddingVertical: 14,
    paddingHorizontal: 15,
    minHeight: MIN_TAP,
  },
  check: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, marginTop: 1 },
});
