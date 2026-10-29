import { Pressable, StyleSheet, Text, View } from 'react-native';

import { boxLabel } from '../board/whispers';
import type { Note } from '../db/schema';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { NoteCard } from './NoteCard';

/**
 * Where Someday notes go when they have sat long enough to have answered
 * their own question.
 *
 * A drawer, not a bin. Nothing is deleted and nothing expires — the box just
 * stops the bottom of the board turning into a wall of things you were never
 * going to do. One tap opens it, and anything inside can be dragged back out.
 */
export function SomedayBox({
  notes,
  open,
  onToggle,
  onOpen,
}: {
  notes: Note[];
  open: boolean;
  onToggle: () => void;
  onOpen: (note: Note) => void;
}) {
  const t = useTheme();
  if (notes.length === 0) return null;

  return (
    <View style={s.wrap}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${boxLabel(notes.length)}. ${open ? 'Close' : 'Open'} the box.`}
        style={({ pressed }) => [
          s.lid,
          {
            backgroundColor: t.c.board,
            borderColor: t.c.rule,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[type.label, { color: t.c.inkSoft }]}>{boxLabel(notes.length)}</Text>
        <Text style={[type.caption, { color: t.c.inkFaint }]}>{open ? 'close' : 'open'}</Text>
      </Pressable>

      {open && (
        <View style={s.inside}>
          {notes.map((n, i) => (
            <NoteCard key={n.id} note={n} index={i} fade={0.55} onPress={onOpen} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: space.md },
  lid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TAP,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    // A drawer front: square at the top, rounded where it meets the board.
    borderRadius: radius.card,
    borderStyle: 'dashed',
  },
  inside: { gap: 10, marginTop: space.md, paddingHorizontal: space.xs },
});
