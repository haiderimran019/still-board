import { StatusBar } from 'expo-status-bar';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaptureSheet } from '../components/CaptureSheet';
import { DragProvider, DraggableNote, useDrag } from '../components/DragBoard';
import { MenuSheet } from '../components/MenuSheet';
import { NoteCard } from '../components/NoteCard';
import { NoteSheet } from '../components/NoteSheet';
import { SomedayBox } from '../components/SomedayBox';
import { BackupSheet } from './BackupSheet';
import { ProfileSheet } from './ProfileSheet';
import { DoneScreen } from './DoneScreen';
import { NowGauge } from '../components/NowGauge';
import { SectionHeading } from '../components/SectionHeading';
import { DAY_FILTERS, filterCounts, matchesFilter, type DayFilter } from '../board/dayFilter';
import { headerLine, somedayFade, splitSomeday } from '../board/whispers';
import type { Notice } from '../store/useBoard';
import { APP_NAME, NOW_LIMIT } from '../config';
import type { FreeUp } from '../db/repository';
import { SECTIONS, type Note, type Priority, type Section } from '../db/schema';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { SECTION_COPY } from './sectionCopy';

type Props = {
  notes: Note[];
  nowNotes: Note[];
  doneCount: number;
  done: Note[];
  /** Cleared since midnight — today only, because a running total is a score. */
  todayCount: number;
  notice: Notice | null;
  onHush: () => void;
  onCreate: (text: string, section: Section) => Promise<void>;
  onSwap: (text: string, outgoingId: string, how: FreeUp) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onMove: (id: string, section: Section) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRemind: (id: string, at: number | null) => Promise<void>;
  onUrgency: (id: string, priority: Priority) => Promise<void>;
  onReorder: (id: string, section: Section, index: number) => Promise<void>;
  onRefused: (section: Section) => void;
  onRestore: (id: string) => Promise<void>;
  onExport: () => Promise<Note[]>;
  onImport: (notes: Note[]) => Promise<number>;
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
  done,
  todayCount,
  notice,
  onHush,
  onCreate,
  onSwap,
  onEdit,
  onMove,
  onComplete,
  onDelete,
  onRemind,
  onUrgency,
  onReorder,
  onRefused,
  onRestore,
  onExport,
  onImport,
}: Props) {
  const t = useTheme();
  const [capturing, setCapturing] = useState(false);
  const [boxOpen, setBoxOpen] = useState(false);
  const [opened, setOpened] = useState<Note | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [filter, setFilter] = useState<DayFilter>('all');
  const now = new Date();
  const counts = filterCounts(notes, now);
  const shown = notes.filter((n) => matchesFilter(n.createdAt, now, filter));
  const bySection = (s: Section) => shown.filter((n) => n.section === s);

  // The tagline is for strangers; by the second launch the user isn't one, so
  // the line under the wordmark describes the board instead.
  const subtitle = headerLine(now, nowNotes.length, notes.length);

  return (
    <DragProvider
      enabled={filter === 'all'}
      canDrop={(to) => to !== 'now' || nowNotes.length < NOW_LIMIT}
      onDrop={(id, section, index) => void onReorder(id, section, index)}
      onRefused={onRefused}
    >
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
            {/* Text scales with the phone's setting everywhere on this
                board except here: at 200% the wordmark alone would fill the
                screen, and it is the one piece of text nobody needs to read
                twice. */}
            <Text style={[type.wordmark, { color: t.c.ink }]} maxFontSizeMultiplier={1.4}>
              {APP_NAME}
            </Text>
            <Text style={[type.caption, { color: t.c.inkSoft }]}>{subtitle}</Text>
          </View>
          <Pressable
            onPress={() => setShowMenu(true)}
            accessibilityRole="button"
            accessibilityLabel="More: what you've finished, and keeping a copy"
            hitSlop={12}
            style={({ pressed }) => [
              s.more,
              { borderColor: t.c.rule, opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Text style={[type.label, { color: t.c.inkSoft }]}>•••</Text>
          </Pressable>
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

        {/* A lens over the board, not a second board. It resets to All on
            every launch: a filter that persists is how someone loses half
            their notes and blames the app. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filters}
          keyboardShouldPersistTaps="handled"
        >
          {DAY_FILTERS.map((f) => {
            const on = f.key === filter;
            const empty = counts[f.key] === 0 && f.key !== 'all';
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                disabled={empty}
                // The chip is 36 high because four of them have to fit across
                // a phone; the hit area underneath it is not.
                hitSlop={{ top: 6, bottom: 6 }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on, disabled: empty }}
                accessibilityLabel={`${f.label}, ${counts[f.key]} notes`}
                style={({ pressed }) => [
                  s.filter,
                  {
                    backgroundColor: on ? t.c.accent : 'transparent',
                    borderColor: on ? t.c.accent : t.c.rule,
                    opacity: empty ? 0.35 : pressed ? 0.6 : 1,
                  },
                ]}
              >
                {/* The word only. The tally was answering a question nobody
                    asked, and four numbers across the top of a board meant
                    to feel calm is three too many. The count still decides
                    whether a filter is worth offering — see `empty`. */}
                <Text
                  style={[type.label, { color: on ? t.c.board : t.c.inkSoft }]}
                  maxFontSizeMultiplier={1.6}
                  numberOfLines={1}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filter !== 'all' && (
          <Text style={[type.caption, s.lensNote, { color: t.c.inkFaint }]}>
            Showing part of the board, so notes can't be reordered. Tap All to put it back.
          </Text>
        )}

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
                  onDrop={(n) => void onDelete(n.id)}
                  onMoveTo={(n, to) => void onMove(n.id, to)}
                  onReorder={(n, i) => void onReorder(n.id, n.section, i)}
                />
              </View>
            </Fragment>
          );
        })}


      </ScrollView>

      {/* Whatever just happened is said out loud as well as shown. Without
          the live region a screen reader announces nothing at all when a
          note is finished or dropped, and Undo would sit there unmentioned
          until it timed out. */}
      {notice && (
        <View
          accessibilityLiveRegion="polite"
          style={[s.notice, { backgroundColor: t.c.ink }]}
        >
          <Text style={[type.caption, s.noticeText, { color: t.c.board }]}>{notice.text}</Text>
          {notice.undo && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo that"
              hitSlop={12}
              onPress={() => {
                onHush();
                void notice.undo?.();
              }}
            >
              <Text style={[type.bodyStrong, { color: t.c.notes[0] }]}>Undo</Text>
            </Pressable>
          )}
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
        onUrgency={onUrgency}
      />

      <MenuSheet
        visible={showMenu}
        todayCount={todayCount}
        doneCount={doneCount}
        onClose={() => setShowMenu(false)}
        onDone={() => setShowDone(true)}
        onBackup={() => setShowBackup(true)}
        onProfile={() => setShowProfile(true)}
      />

      <ProfileSheet
        visible={showProfile}
        boardCount={notes.length}
        onClose={() => setShowProfile(false)}
      />

      <BackupSheet
        visible={showBackup}
        onClose={() => setShowBackup(false)}
        onExport={onExport}
        onImport={onImport}
      />

      <DoneScreen
        visible={showDone}
        notes={done}
        onClose={() => setShowDone(false)}
        onRestore={onRestore}
      />

      <CaptureSheet
        visible={capturing}
        nowNotes={nowNotes}
        onClose={() => setCapturing(false)}
        onCreate={onCreate}
        onSwap={onSwap}
      />
    </SafeAreaView>
    </DragProvider>
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
  onDrop,
  onMoveTo,
  onReorder,
}: {
  section: Section;
  items: Note[];
  open: boolean;
  onToggleBox: () => void;
  onOpen: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDrop: (note: Note) => void;
  onMoveTo: (note: Note, to: Section) => void;
  onReorder: (note: Note, index: number) => void;
}) {
  const t = useTheme();
  const drag = useDrag();

  const now = Date.now();
  const { out, boxed } = section === 'someday' ? splitSomeday(items, now) : { out: items, boxed: [] };

  // Where the drop line sits among the notes actually on screen. The target
  // index counts the notes that will remain, so if the note being carried
  // came from this section it has to be added back in.
  const carriedHere = out.findIndex((n) => n.id === drag.draggingId);
  const line =
    drag.draggingId && drag.target?.section === section
      ? drag.target.index + (carriedHere >= 0 && carriedHere <= drag.target.index ? 1 : 0)
      : -1;

  const dropLine = (
    <View
      key="drop-line"
      style={[s.drop, { backgroundColor: drag.allowed ? t.c.accent : t.c.warn }]}
    />
  );

  return (
    // The whole section is the drop zone, empty space included, so a note can
    // be dropped into a section that has nothing in it yet.
    <View
      ref={(v) => drag.registerSection(section, v)}
      collapsable={false}
      style={[s.notes, items.length === 0 && s.notesEmpty]}
    >
      {items.length === 0 && (
        <Text style={[type.caption, s.empty, { color: t.c.inkFaint }]}>
          {line >= 0 ? 'Drop it here' : SECTION_COPY[section].empty}
        </Text>
      )}

      {out.map((note, i) => (
        <Fragment key={note.id}>
          {line === i && dropLine}
          <DraggableNote
            note={note}
            index={i}
            count={out.length}
            fade={section === 'someday' ? somedayFade(note.createdAt, now) : undefined}
            onPress={onOpen}
            onComplete={onComplete}
            onDelete={onDrop}
            onMove={onMoveTo}
            onReorder={onReorder}
          />
        </Fragment>
      ))}
      {line >= out.length && out.length > 0 && dropLine}

      {section === 'someday' && out.length === 0 && boxed.length > 0 && (
        <Text style={[type.caption, s.empty, { color: t.c.inkFaint }]}>
          Everything here has settled into the box.
        </Text>
      )}
      {section === 'someday' && (
        <SomedayBox notes={boxed} open={open} onToggle={onToggleBox} onOpen={onOpen} />
      )}
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
  more: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: 'center',
  },
  filters: { gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.lg },
  filter: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  lensNote: { paddingHorizontal: space.lg, paddingBottom: space.lg },
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
  // An empty section still needs somewhere to aim at.
  notesEmpty: { minHeight: 64, justifyContent: 'center' },
  drop: { height: 3, borderRadius: 2, marginVertical: 1 },
  empty: { fontStyle: 'italic' },

  noticeText: { flex: 1 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.xl,
    borderRadius: radius.card,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
});
