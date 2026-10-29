import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { groupByDay, windowNote } from '../board/done';
import { clockTime } from '../board/schedule';
import type { Note } from '../db/schema';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/**
 * What you have cleared, newest first, grouped by day.
 *
 * Not a trophy cabinet and not a backlog — it is bounded to the last 30 days
 * on purpose, and it says so. Anything on this screen can be put back on the
 * board in one tap, which is the real reason it exists: the point is that
 * finishing something is safe, not that it is permanent.
 */
export function DoneScreen({
  visible,
  notes,
  onClose,
  onRestore,
}: {
  visible: boolean;
  notes: Note[];
  onClose: () => void;
  onRestore: (id: string) => Promise<void>;
}) {
  const t = useTheme();
  const groups = groupByDay(notes, new Date());

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[s.screen, { backgroundColor: t.c.board }]} edges={['top', 'bottom']}>
        <View style={s.head}>
          <View style={s.headText}>
            <Text accessibilityRole="header" style={[type.wordmark, s.title, { color: t.c.ink }]}>
              Done
            </Text>
            <Text style={[type.caption, { color: t.c.inkSoft }]}>
              {notes.length === 0
                ? 'Nothing yet.'
                : `${notes.length} cleared in the last month.`}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Back to the board"
            hitSlop={12}
            style={({ pressed }) => [
              s.close,
              { borderColor: t.c.rule, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[type.label, { color: t.c.inkSoft }]}>Back</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {groups.map((g) => (
            <View key={g.key} style={s.group}>
              <Text accessibilityRole="header" style={[type.label, s.day, { color: t.c.inkSoft }]}>
                {g.label}
              </Text>
              {g.notes.map((n) => (
                <View key={n.id} style={[s.row, { borderColor: t.c.rule }]}>
                  <View style={s.rowText}>
                    <Text style={[type.note, s.struck, { color: t.c.inkFaint }]}>{n.text}</Text>
                    {n.completedAt !== null && (
                      <Text style={[type.caption, s.when, { color: t.c.inkFaint }]}>
                        {clockTime(n.completedAt)}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => void onRestore(n.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Put back on the board: ${n.text}`}
                    style={({ pressed }) => [
                      s.restore,
                      { borderColor: t.c.rule, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Text style={[type.label, { color: t.c.accent }]}>Put back</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))}

          <Text style={[type.caption, s.foot, { color: t.c.inkFaint }]}>
            {windowNote(notes.length)}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
  },
  headText: { flex: 1 },
  title: { fontSize: 28 },
  close: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  scroll: { paddingBottom: space.xxl },
  group: { marginBottom: space.xl, paddingHorizontal: space.lg },
  day: { marginBottom: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderBottomWidth: 1,
    paddingVertical: space.md,
    minHeight: MIN_TAP,
  },
  rowText: { flex: 1 },
  // Struck through, because a finished thing should look finished.
  struck: { textDecorationLine: 'line-through' },
  when: { marginTop: 3, fontSize: 11 },
  restore: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: 'center',
  },
  foot: { textAlign: 'center', paddingHorizontal: space.lg },
});
