import {
  Gabarito_400Regular,
  Gabarito_500Medium,
  Gabarito_600SemiBold,
  Gabarito_700Bold,
} from '@expo-google-fonts/gabarito';
import { ShantellSans_500Medium } from '@expo-google-fonts/shantell-sans';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME, NOW_LIMIT, TAGLINE } from './src/config';
import * as repo from './src/db/repository';
import type { Note, Section } from './src/db/schema';
import { MIN_TAP, radius, space } from './src/theme/tokens';
import { type } from './src/theme/typography';
import { useTheme } from './src/theme/useTheme';

const SECTION_META: Record<Section, { name: string; sub: string }> = {
  now: { name: 'Now', sub: "what you're focusing on" },
  next: { name: 'Next', sub: 'soon, but not today' },
  someday: { name: 'Someday', sub: 'no pressure to act' },
};

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
        // A board that never loads must say so. Failing to a blank screen is
        // the worst outcome: it looks like the app lost everything.
        setBootError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [refresh]);

  if (bootError) return <BootFailed message={bootError} />;
  if (!fontsReady || notes === null) return <Boot />;

  return (
    <SafeAreaProvider>
      <Board notes={notes} doneCount={doneCount} onChange={refresh} />
    </SafeAreaProvider>
  );
}

/** Hold on the board colour rather than flashing white before the fonts land. */
function Boot() {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.c.board }} />;
}

/** Your notes are still on the device; this screen just couldn't reach them. */
function BootFailed({ message }: { message: string }) {
  const t = useTheme();
  return (
    <View style={[s.failed, { backgroundColor: t.c.board }]}>
      <Text style={[type.section, { color: t.c.ink, marginBottom: space.sm }]}>
        The board didn't open
      </Text>
      <Text style={[type.body, { color: t.c.inkSoft, textAlign: 'center', marginBottom: space.lg }]}>
        Your notes are still saved on this device. Reopening the app usually fixes this.
      </Text>
      <Text style={[type.caption, { color: t.c.inkFaint, textAlign: 'center' }]}>{message}</Text>
    </View>
  );
}

function Board({
  notes,
  doneCount,
  onChange,
}: {
  notes: Note[];
  doneCount: number;
  onChange: () => Promise<void>;
}) {
  const t = useTheme();

  const add = async () => {
    const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await repo.create(`Written at ${stamp}`, 'next');
    await onChange();
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: t.c.board }]} edges={['top', 'bottom']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={[type.wordmark, { color: t.c.ink }]}>{APP_NAME}</Text>
            <Text style={[type.caption, { color: t.c.inkSoft }]}>{TAGLINE}</Text>
          </View>
          {doneCount > 0 && (
            <View style={[s.chip, { backgroundColor: t.c.accent + '22' }]}>
              <Text style={[type.caption, { color: t.c.accent }]}>{doneCount} done</Text>
            </View>
          )}
        </View>

        {/* Step 4 turns this into real capture. For now it proves writes persist. */}
        <Pressable
          onPress={add}
          style={({ pressed }) => [
            s.composer,
            t.shadow,
            { backgroundColor: t.c.surface, borderColor: t.c.rule, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[type.body, { color: t.c.inkFaint }]}>Add a note to Next</Text>
          <View style={[s.plus, { backgroundColor: t.c.accent }]}>
            <Text style={{ color: t.c.board, fontSize: 19, lineHeight: 22 }}>+</Text>
          </View>
        </Pressable>

        {(Object.keys(SECTION_META) as Section[]).map((key) => {
          const meta = SECTION_META[key];
          const items = notes.filter((n) => n.section === key);
          const full = key === 'now' && items.length >= NOW_LIMIT;
          return (
            <View key={key} style={s.section}>
              <View style={s.sectionHead}>
                <Text style={[type.section, { color: t.c.ink }]}>{meta.name}</Text>
                <Text style={[type.label, { color: full ? t.c.warn : t.c.inkSoft }]}>
                  {key === 'now' ? `${items.length} / ${NOW_LIMIT}` : items.length}
                </Text>
              </View>
              <Text style={[type.caption, { color: t.c.inkFaint }]}>{meta.sub}</Text>

              {key === 'now' && (
                <View style={s.gauge}>
                  {Array.from({ length: NOW_LIMIT }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.pip,
                        {
                          backgroundColor:
                            i < items.length ? (full ? t.c.warn : t.c.accent) : t.c.rule,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              <View style={s.notes}>
                {items.length === 0 && (
                  <Text style={[type.caption, { color: t.c.inkFaint, fontStyle: 'italic' }]}>
                    {key === 'now' ? 'Nothing here. What deserves today?' : "Empty — and that's fine."}
                  </Text>
                )}
                {items.map((n, i) => (
                  <View
                    key={n.id}
                    style={[
                      s.note,
                      t.shadow,
                      {
                        backgroundColor: t.c.notes[n.tint % 4],
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
            </View>
          );
        })}

        <Text style={[type.caption, s.foot, { color: t.c.inkFaint }]}>
          Step 2 · {notes.length} notes read from SQLite. Force-quit and reopen — they stay.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: space.xxl },
  head: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: space.lg, paddingTop: space.md },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
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
    minHeight: MIN_TAP,
  },
  plus: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: space.xl, paddingHorizontal: space.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  gauge: { flexDirection: 'row', gap: 3, paddingTop: 9 },
  pip: { height: 3, flex: 1, borderRadius: 2 },
  notes: { gap: 10, marginTop: space.md },
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
  foot: { textAlign: 'center', paddingHorizontal: space.lg },
  failed: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
});
