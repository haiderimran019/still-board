import { StatusBar } from 'expo-status-bar';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaptureSheet } from '../components/CaptureSheet';
import { NoteCard } from '../components/NoteCard';
import { NoteSheet } from '../components/NoteSheet';
import { SomedayBox } from '../components/SomedayBox';
import { NowGauge } from '../components/NowGauge';
import { SectionHeading } from '../components/SectionHeading';
import { headerLine, somedayFade, splitSomeday } from '../board/whispers';
import { APP_NAME } from '../config';
import type { FreeUp } from '../db/repository';
import { SECTIONS, type Note, type Section } from '../db/schema';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { SECTION_COPY } from './sectionCopy';

type Props = {
  notes: Note[];
  nowNotes: Note[];
  doneCount: number;
  /** Cleared since midnight — today only, because a running total is a score. */
  todayCount: number;
  notice: string | null;
  onCreate: (text: string, section: Section) => Promise<void>;
  onSwap: (text: string, outgoingId: string, how: FreeUp) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onMove: (id: string, section: Section) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRemind: (id: string, at: number | null) => Promise<void>;
};

/**
 * The whole board on one screen: Now, Next, Someday, in that order, always.
 *
 * The composer bar at the top is the only way in: tapping it opens the
 * capture sheet. Tapping a note comes in step 5, completing it in step 6.
 */
export function BoardScreen({
  notes,
  nowNotes,
  doneCount,
  todayCount,
  notice,
  onCreate,
  onSwap,
  onEdit,
  onMove,
  onComplete,
  onDelete,
  onRemind,
}: Props) {
  const t = useTheme();
  const [capturing, setCapturing] = useState(false);
  const [boxOpen, setBoxOpen] = useState(false);
  const [opened, setOpened] = useState<Note | null>(null);
  const bySection = (s: Section) => notes.filter((n) => n.section === s);

  // The tagline is for strangers; by the second launch the user isn't one, so
  // the line under the wordmark describes the board instead.
  const subtitle = headerLine(new Date(), nowNotes.length, notes.length);
  const chip = todayCount > 0 ? `${todayCount} cleared today` : doneCount > 0 ? `${doneCount} done` : null;

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
            <Text style={[type.caption, { color: t.c.inkSoft }]}>{subtitle}</Text>
          </View>
          {chip && (
            <View style={[s.chip, { backgroundColor: t.c.accent + '22' }]}>
              <Text style={[type.caption, { color: t.c.accent }]}>{chip}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setCapturing(true)}
          accessibilityRole="button"
          accessibilityLabel="Write a note"
          style={({ pressed }) => [
            s.composer,
            t.shadow,
            { backgroundColor: t.c.surface, borderColor: t.c.rule, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[type.body, { color: t.c.inkFaint }]}>What's on your mind?</Text>
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

                <SectionNotes
                  section={section}
                  items={items}
                  open={boxOpen}
                  onToggleBox={() => setBoxOpen((v) => !v)}
                  onOpen={setOpened}
                  onComplete={(n) => onComplete(n.id)}
                />
              </View>
            </Fragment>
          );
        })}

        <Text style={[type.caption, s.foot, { color: t.c.inkFaint }]}>
          Step 4 · tap the bar to write. Fill Now to seven and try adding one more.
        </Text>
      </ScrollView>

      {notice && (
        <View style={[s.notice, { backgroundColor: t.c.ink }]} pointerEvents="none">
          <Text style={[type.caption, { color: t.c.board }]}>{notice}</Text>
        </View>
      )}

      <NoteSheet
        note={opened}
        onClose={() => setOpened(null)}
        onEdit={onEdit}
        onMove={onMove}
        onComplete={onComplete}
        onDelete={onDelete}
        onRemind={onRemind}
      />

      <CaptureSheet
        visible={capturing}
        nowNotes={nowNotes}
        onClose={() => setCapturing(false)}
        onCreate={onCreate}
        onSwap={onSwap}
      />
    </SafeAreaView>
  );
}

/**
 * The notes of one section. Now and Next are a plain list; Someday is the
 * only one that ages — its notes fade, and the oldest fold into the box.
 */
function SectionNotes({
  section,
  items,
  open,
  onToggleBox,
  onOpen,
  onComplete,
}: {
  section: Section;
  items: Note[];
  open: boolean;
  onToggleBox: () => void;
  onOpen: (note: Note) => void;
  onComplete: (note: Note) => void;
}) {
  const t = useTheme();

  if (items.length === 0) {
    return (
      <View style={s.notes}>
        <Text style={[type.caption, s.empty, { color: t.c.inkFaint }]}>
          {SECTION_COPY[section].empty}
        </Text>
      </View>
    );
  }

  if (section !== 'someday') {
    return (
      <View style={s.notes}>
        {items.map((note, i) => (
          <NoteCard key={note.id} note={note} index={i} onPress={onOpen} onComplete={onComplete} />
        ))}
      </View>
    );
  }

  const now = Date.now();
  const { out, boxed } = splitSomeday(items, now);

  return (
    <View style={s.notes}>
      {out.map((note, i) => (
        <NoteCard
          key={note.id}
          note={note}
          index={i}
          fade={somedayFade(note.createdAt, now)}
          onPress={onOpen}
          onComplete={onComplete}
        />
      ))}
      {out.length === 0 && boxed.length > 0 && (
        <Text style={[type.caption, s.empty, { color: t.c.inkFaint }]}>
          Everything here has settled into the box.
        </Text>
      )}
      <SomedayBox notes={boxed} open={open} onToggle={onToggleBox} onOpen={onOpen} />
    </View>
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
  notice: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.xl,
    borderRadius: radius.card,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
});
