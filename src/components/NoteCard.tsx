import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActionSpec } from '../board/noteActions';
import { reminderLabel } from '../board/schedule';
import { URGENCY, urgencyColour } from '../board/urgency';
import { ageWhisper } from '../board/whispers';
import type { Note } from '../db/schema';
import { feel } from '../feel/haptics';
import { ms, useReducedMotion } from '../feel/motion';
import { SECTION_COPY } from '../screens/sectionCopy';
import { MIN_TAP, radius } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/** How long the whole finishing sequence takes, end to end. */
const SETTLE_IN = 300;
const MARK = 170;
const HOLD = 130;
const LEAVE = 260;

/**
 * One sticky note.
 *
 * The tilt is tiny on purpose — enough to read as paper rather than as a row
 * in a list, small enough that a column of them still looks tidy. It comes
 * from the note's own position in the section, so a note doesn't jump to a
 * new angle every time the board re-renders.
 *
 * Two animations, and only two. Notes arrive by rising into place, lightly
 * staggered, so opening the app feels like a board settling rather than a
 * list appearing. And finishing a note is given its due: the circle fills,
 * the note is held for a beat so you see it happen, and only then does it
 * lift away. Clearing something you have been carrying should land.
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
  actions,
  onAction,
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
  /** The same things a drag or a swipe does, for people who can do neither. */
  actions?: ActionSpec[];
  onAction?: (name: string) => void;
}) {
  const t = useTheme();
  const calm = useReducedMotion();
  const tilt = index % 2 === 0 ? '-0.35deg' : '0.35deg';

  // Only Now gets the age line. Next and Someday are allowed to sit there —
  // that is what they are for, and marking their age would be nagging.
  const age = note.section === 'now' ? ageWhisper(note.createdAt, Date.now()) : null;
  const due = note.remindAt !== null ? reminderLabel(note.remindAt, new Date()) : null;
  // Urgency takes the whole note, not a stripe down its edge: at arm's
  // length on a board of twenty, a 4pt line is invisible and a coloured
  // card is not. The edge keeps the stronger tone so the two read as one
  // thing, and the word is still in the label — colour is never the only
  // signal the note carries.
  const urgent = urgencyColour(note.priority, t.c.urgency);
  const wash = urgencyColour(note.priority, t.c.urgencyFill);

  const [finishing, setFinishing] = useState(false);

  // Separate values because height cannot run on the native driver and the
  // rest should. Mixing them on one value is the usual way this breaks.
  const enter = useRef(new Animated.Value(0)).current;
  const leave = useRef(new Animated.Value(0)).current;
  const mark = useRef(new Animated.Value(0)).current;
  const height = useRef<number | null>(null);
  const collapse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: ms(SETTLE_IN, calm),
      // Capped, or a long board would still be arriving when you reach for it.
      delay: calm ? 0 : Math.min(index, 6) * 35,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [calm, enter, index]);

  const finish = () => {
    if (finishing || !onComplete) return;
    setFinishing(true);
    feel.resolved();

    Animated.sequence([
      Animated.timing(mark, {
        toValue: 1,
        duration: ms(MARK, calm),
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
      Animated.delay(HOLD),
      Animated.parallel([
        Animated.timing(leave, {
          toValue: 1,
          duration: ms(LEAVE, calm),
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(collapse, {
          toValue: 0,
          duration: ms(LEAVE, calm),
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => onComplete(note));
  };

  const body = (
    <Animated.View
      style={[
        s.note,
        t.shadow,
        {
          backgroundColor: wash ?? t.c.notes[note.tint % t.c.notes.length],
          borderColor: urgent ?? t.c.noteEdge,
          borderWidth: urgent ? 1.5 : 1,
          opacity: Animated.multiply(
            enter,
            leave.interpolate({ inputRange: [0, 1], outputRange: [fade, 0] })
          ),
          transform: [
            { rotate: tilt },
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            // It drifts up and to the right as it goes, the way paper does
            // when you lift it off a board.
            { translateX: leave.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) },
            { scale: leave.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) },
          ],
        },
      ]}
    >
      {/* The one action worth a direct tap. Its hit area is padded out to
          the 48dp floor without the circle itself having to be that big.

          Hidden from the screen reader on purpose, and not because it does
          not matter: the whole note is one accessibility element, so a
          control nested inside it can never be focused anyway. Leaving a
          label on it would only promise something that is not there.
          Finishing is offered as an action on the note instead. */}
      <Pressable
        onPress={finish}
        disabled={!onComplete || finishing}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        hitSlop={14}
        style={({ pressed }) => [s.checkTap, { opacity: pressed ? 0.4 : 1 }]}
      >
        <View style={[s.check, { borderColor: finishing ? t.c.accent : t.c.inkFaint }]}>
          <Animated.View
            style={[
              s.fill,
              {
                backgroundColor: t.c.accent,
                opacity: mark,
                transform: [{ scale: mark }],
              },
            ]}
          />
        </View>
      </Pressable>

      <View style={s.text}>
        <Text style={[type.note, { color: t.c.ink }]}>{note.text}</Text>
        {(due || age) && (
          <View style={s.footnotes}>
            {due && <Text style={[type.caption, s.age, { color: t.c.accent }]}>⏱ {due}</Text>}
            {age && <Text style={[type.caption, s.age, { color: t.c.inkFaint }]}>{age}</Text>}
          </View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <Animated.View
      onLayout={(e) => {
        if (height.current === null) height.current = e.nativeEvent.layout.height;
      }}
      // Only constrained once it is leaving, so a note can grow with its text.
      style={
        finishing && height.current !== null
          ? {
              height: collapse.interpolate({
                inputRange: [0, 1],
                outputRange: [0, height.current],
              }),
              overflow: 'hidden',
            }
          : undefined
      }
    >
      <Pressable
        accessible
        onPress={
          onPress
            ? () => {
                if (suppressPress?.() || finishing) return;
                onPress(note);
              }
            : undefined
        }
        onLongPress={onLongPress}
        onPressOut={onPressOut}
        delayLongPress={450}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityActions={actions}
        onAccessibilityAction={(e) => onAction?.(e.nativeEvent.actionName)}
        accessibilityHint={
          actions && actions.length > 0 ? 'Opens the note. More actions available.' : undefined
        }
        // Read aloud, a note should place itself without the listener having
        // to track which section heading came last.
        accessibilityLabel={
          `${note.text}. In ${SECTION_COPY[note.section].name}.` +
          (note.priority > 0 ? ` ${URGENCY[note.priority].label}.` : '') +
          (due ? ` Reminder ${due}.` : '') +
          (age ? ` Written ${age}.` : '')
        }
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

/** A board of 20-odd notes re-renders on every refresh; none of them change. */
export const NoteCard = memo(NoteCardBase);

const s = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: radius.note,
    paddingVertical: 14,
    paddingHorizontal: 15,
    minHeight: MIN_TAP,
  },
  checkTap: { paddingRight: 2, paddingTop: 1 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { width: 12, height: 12, borderRadius: 6 },
  text: { flex: 1 },
  footnotes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  age: { fontSize: 11 },
});
