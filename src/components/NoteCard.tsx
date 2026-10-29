import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { reminderLabel } from '../board/schedule';
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
function NoteCardBase({
  note,
  index,
  fade = 1,
  onPress,
  onComplete,
  onLongPress,
  onPressOut,
  suppressPress,
}: {
  note: Note;
  index: number;
  /** Someday notes lose their grip on your attention as they age. */
  fade?: number;
  onPress?: (note: Note) => void;
  onComplete?: (note: Note) => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
  /** True once a drag has taken over, so the release isn't read as a tap. */
  suppressPress?: () => boolean;
}) {
  const t = useTheme();
  const tilt = index % 2 === 0 ? '-0.35deg' : '0.35deg';

  // Only Now gets the age line. Next and Someday are allowed to sit there —
  // that is what they are for, and marking their age would be nagging.
  const age = note.section === 'now' ? ageWhisper(note.createdAt, Date.now()) : null;
  const due = note.remindAt !== null ? reminderLabel(note.remindAt, new Date()) : null;

  return (
    <Pressable
      accessible
      onPress={
        onPress
          ? () => {
              if (suppressPress?.()) return;
              onPress(note);
            }
          : undefined
      }
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      delayLongPress={450}
      accessibilityRole={onPress ? 'button' : 'text'}
      // Read aloud, a note should place itself without the listener having to
      // track which section heading came last.
      accessibilityLabel={
        `${note.text}. In ${SECTION_COPY[note.section].name}.` +
        (due ? ` Reminder ${due}.` : '') +
        (age ? ` Written ${age}.` : '')
      }
      style={[
        s.note,
        t.shadow,
        {
          opacity: fade,
          backgroundColor: t.c.notes[note.tint % t.c.notes.length],
          borderColor: t.c.noteEdge,
          transform: [{ rotate: tilt }],
        },
      ]}
    >
      {/* The one action worth a direct tap. Its hit area is padded out to
          the 48dp floor without the circle itself having to be that big. */}
      <Pressable
        onPress={onComplete ? () => onComplete(note) : undefined}
        disabled={!onComplete}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false }}
        accessibilityLabel={`Finish: ${note.text}`}
        hitSlop={14}
        style={({ pressed }) => [s.checkTap, { opacity: pressed ? 0.4 : 1 }]}
      >
        <View style={[s.check, { borderColor: t.c.inkFaint }]} />
      </Pressable>
      <View style={s.text}>
        <Text style={[type.note, { color: t.c.ink }]}>{note.text}</Text>
        {(due || age) && (
          <View style={s.footnotes}>
            {due && (
              <Text style={[type.caption, s.age, { color: t.c.accent }]}>⏱ {due}</Text>
            )}
            {age && <Text style={[type.caption, s.age, { color: t.c.inkFaint }]}>{age}</Text>}
          </View>
        )}
      </View>
    </Pressable>
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
  checkTap: { paddingRight: 2, paddingTop: 1 },
  check: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  text: { flex: 1 },
  footnotes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  age: { fontSize: 11 },
});
