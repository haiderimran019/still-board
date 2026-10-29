import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME, NOW_LIMIT, TAGLINE } from '../config';
import { SECTIONS } from '../db/schema';
import * as repo from '../db/repository';
import { ms, useReducedMotion } from '../feel/motion';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { SECTION_COPY } from './sectionCopy';

const PREF_KEY = 'welcomed';

/**
 * Whether this is the first time the board has been opened.
 *
 * Null while the answer is still coming off disk, which is the state that
 * matters: showing the welcome for one frame to someone on their hundredth
 * launch would be worse than never showing it at all.
 */
export function useWelcome(): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const seen = await repo.getPref(PREF_KEY);
        if (alive) setShow(seen === null);
      } catch {
        // If the preference cannot be read, say nothing. A welcome screen
        // that reappears every launch because of a disk error is a bug
        // people would uninstall over.
        if (alive) setShow(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    void repo.setPref(PREF_KEY, 'yes').catch(() => {});
  };

  return { show: show === true, dismiss };
}

/**
 * The first thirty seconds.
 *
 * One screen, not a carousel. Four panes with dots underneath would be four
 * chances to tap Skip, and the thing being explained here takes twenty
 * seconds to read: there are four places to put a thought, and today holds
 * seven. The sections are shown as the notes they will become rather than
 * described in a list, because the board teaches itself faster than any
 * sentence about it can.
 *
 * It appears over a board that has already loaded, so dismissing it reveals
 * something settled rather than a loading screen.
 */
export function Welcome({ visible, onStart }: { visible: boolean; onStart: () => void }) {
  const t = useTheme();
  const calm = useReducedMotion();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(rise, {
      toValue: 1,
      duration: ms(420, calm),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [calm, rise, visible]);

  if (!visible) return null;

  return (
    <Modal visible animationType={calm ? 'none' : 'fade'} onRequestClose={onStart}>
      <SafeAreaView style={[w.screen, { backgroundColor: t.c.board }]} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={w.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: rise,
              transform: [
                { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
              ],
            }}
          >
            <Text
              accessibilityRole="header"
              style={[type.wordmark, { color: t.c.ink }]}
              maxFontSizeMultiplier={1.4}
            >
              {APP_NAME}
            </Text>
            <Text style={[type.body, w.tagline, { color: t.c.inkSoft }]}>{TAGLINE}</Text>

            <Text style={[type.body, w.lead, { color: t.c.ink }]}>
              Four places for a thought to live. Write it down once, put it where it
              belongs, and stop carrying it in your head.
            </Text>

            {SECTIONS.map((section, i) => (
              <View
                key={section}
                accessible
                accessibilityLabel={`${SECTION_COPY[section].name}: ${SECTION_COPY[section].sub}`}
                style={[
                  w.note,
                  t.shadow,
                  {
                    backgroundColor: t.c.notes[i % t.c.notes.length],
                    borderColor: t.c.noteEdge,
                    // The same tiny alternating tilt the real notes have, so
                    // these read as the thing itself and not an illustration.
                    transform: [{ rotate: i % 2 === 0 ? '-0.4deg' : '0.4deg' }],
                  },
                ]}
              >
                <Text style={[type.note, { color: t.c.ink }]}>{SECTION_COPY[section].name}</Text>
                <Text style={[type.caption, w.noteSub, { color: t.c.ink }]}>
                  {SECTION_COPY[section].sub}
                </Text>
              </View>
            ))}

            <View style={[w.rule, { backgroundColor: t.c.line }]} />

            <Text style={[type.bodyStrong, { color: t.c.ink }]}>
              Now holds {NOW_LIMIT} things. That's the whole idea.
            </Text>
            <Text style={[type.body, w.body, { color: t.c.inkSoft }]}>
              When it's full, adding something means finishing, moving or dropping
              something else first. The board will ask you which. Everything else
              waits where you left it, and nothing here ever nags.
            </Text>

            <Text style={[type.caption, w.body, { color: t.c.inkFaint }]}>
              It all stays on your phone. No account needed, and it works with no
              signal at all.
            </Text>
          </Animated.View>
        </ScrollView>

        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Start using the board"
          style={({ pressed }) => [
            w.start,
            { backgroundColor: t.c.accent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[type.bodyStrong, { color: t.c.board }]} maxFontSizeMultiplier={1.5}>
            Open the board
          </Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const w = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: space.xl, paddingBottom: space.lg },
  tagline: { marginTop: space.xs },
  lead: { marginTop: space.xl, marginBottom: space.lg },
  note: {
    borderWidth: 1,
    borderRadius: radius.note,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  noteSub: { marginTop: 2, opacity: 0.75 },
  rule: { height: 1, marginVertical: space.xl },
  body: { marginTop: space.sm },
  start: {
    marginHorizontal: space.xl,
    marginBottom: space.lg,
    minHeight: MIN_TAP,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
