import { StatusBar } from 'expo-status-bar';
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteCard } from '../components/NoteCard';
import { NowGauge } from '../components/NowGauge';
import { SectionHeading } from '../components/SectionHeading';
import { APP_NAME, TAGLINE } from '../config';
import { SECTIONS, type Note, type Section } from '../db/schema';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { SECTION_COPY } from './sectionCopy';

type Props = {
  notes: Note[];
  doneCount: number;
  /** Temporary, and only so the board can be filled while testing step 3. */
  onAdd: () => void;
};

/**
 * The whole board on one screen: Now, Next, Someday, in that order, always.
 *
 * Nothing on this screen is interactive yet beyond scrolling — capture lands
 * in step 4, tapping a note in step 5, completing it in step 6. What is being
 * checked here is that a real board, read from the database, is calm to look
 * at and legible at any length.
 */
export function BoardScreen({ notes, doneCount, onAdd }: Props) {
  const t = useTheme();
  const bySection = (s: Section) => notes.filter((n) => n.section === s);

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: t.c.board }]} edges={['top', 'bottom']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        // The board should feel like paper under a finger, not a web page.
        overScrollMode="never"
      >
        <View style={s.head}>
          <View style={s.headText}>
            <Text style={[type.wordmark, { color: t.c.ink }]}>{APP_NAME}</Text>
            <Text style={[type.caption, { color: t.c.inkSoft }]}>{TAGLINE}</Text>
          </View>
          {doneCount > 0 && (
            <View style={[s.chip, { backgroundColor: t.c.accent + '22' }]}>
              <Text style={[type.caption, { color: t.c.accent }]}>{doneCount} done</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add a note to Next"
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

        {SECTIONS.map((section, sectionIndex) => {
          const items = bySection(section);
          return (
            <Fragment key={section}>
              {sectionIndex > 0 && <View style={[s.rule, { backgroundColor: t.c.line }]} />}
              <View style={s.section}>
                <SectionHeading section={section} count={items.length} />
                {section === 'now' && <NowGauge count={items.length} />}

                <View style={s.notes}>
                  {items.length === 0 ? (
                    <Text style={[type.caption, s.empty, { color: t.c.inkFaint }]}>
                      {SECTION_COPY[section].empty}
                    </Text>
                  ) : (
                    items.map((note, i) => <NoteCard key={note.id} note={note} index={i} />)
                  )}
                </View>
              </View>
            </Fragment>
          );
        })}

        <Text style={[type.caption, s.foot, { color: t.c.inkFaint }]}>
          Step 3 · the board, read from the database. The + button is a stand-in until step 4.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: space.xxl },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  headText: { flex: 1 },
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
  rule: { height: 1, marginHorizontal: space.lg, marginBottom: space.xl },
  section: { marginBottom: space.xl, paddingHorizontal: space.lg },
  notes: { gap: 10, marginTop: space.md },
  empty: { fontStyle: 'italic' },
  foot: { textAlign: 'center', paddingHorizontal: space.lg },
});
