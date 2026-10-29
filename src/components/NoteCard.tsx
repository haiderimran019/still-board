import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ageWhisper } from '../board/whispers';
import type { Note } from '../db/schema';
import { MIN_TAP, radius } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { SECTION_COPY } from '../screens/sectionCopy';

/**
 * One sticky note.
 *
 * The tilt is tiny on purpose — enough to read as paper rather than as a row
 * in a list, small enough that a column of them still looks tidy. It comes
 * from the note's own position in the section, so a note doesn't jump to a new
 * angle every time the board re-renders.
 */
function NoteCardBase({ note, index }: { note: Note; index: number }) {
  const t = useTheme();
  const tilt = index % 2 === 0 ? '-0.35deg' : '0.35deg';

  // Only Now gets the age line. Next and Someday are allowed to sit there —
  // that is what they are for, and marking their age would be nagging.
  const age = note.section === 'now' ? ageWhisper(note.createdAt, Date.now()) : null;

  return (
    <View
      accessible
      accessibilityRole="text"
      // Read aloud, a note should place itself without the listener having to
      // track which section heading came last.
      accessibilityLabel={
        `${note.text}. In ${SECTION_COPY[note.section].name}.` + (age ? ` Written ${age}.` : '')
      }
      style={[
        s.note,
        t.shadow,
        {
          backgroundColor: t.c.notes[note.tint % t.c.notes.length],
          borderColor: t.c.noteEdge,
          transform: [{ rotate: tilt }],
        },
      ]}
    >
      {/* Inert until step 6 gives it the tap target that completes a note. */}
      <View style={[s.check, { borderColor: t.c.inkFaint }]} />
      <View style={s.text}>
        <Text style={[type.note, { color: t.c.ink }]}>{note.text}</Text>
        {age && <Text style={[type.caption, s.age, { color: t.c.inkFaint }]}>{age}</Text>}
      </View>
    </View>
  );
}

/** A board of 20-odd notes re-renders on every refresh; none of them change. */
export const NoteCard = memo(NoteCardBase);

const s = StyleSheet.create({
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
  text: { flex: 1 },
  age: { marginTop: 5, fontSize: 11 },
});
