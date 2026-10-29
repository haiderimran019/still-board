import {
  createContext,
  type ComponentRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

/** What a measured view is, in this version of React Native. */
type Measurable = ComponentRef<typeof View>;

import { dropTarget, isNoOp, type Drop, type NoteRect, type SectionRect } from '../board/drag';
import { actionSaid, actionsFor, readAction } from '../board/noteActions';
import type { Note, Section } from '../db/schema';
import { feel } from '../feel/haptics';
import { ms, useReducedMotion } from '../feel/motion';
import { space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { NoteCard } from './NoteCard';

/**
 * Press and hold a note, then move it.
 *
 * Built on React Native's own Animated and PanResponder rather than a gesture
 * library: a board of this size does not need the extra machinery, and the
 * whole feature stays readable in one file.
 *
 * The approach is to measure once. When a note is picked up, every note and
 * every section is measured in screen coordinates and kept as a snapshot. The
 * board does not scroll or reflow during a drag, so that snapshot stays true
 * for the whole gesture and the maths in board/drag.ts — which is tested —
 * does the rest.
 */

type Registry = Map<string, { view: Measurable | null; section: Section }>;

type DragApi = {
  /** The note being carried, if any. */
  draggingId: string | null;
  /** Where it would land, and whether it is allowed to. */
  target: Drop | null;
  allowed: boolean;
  registerNote: (id: string, section: Section, view: Measurable | null) => void;
  registerSection: (section: Section, view: Measurable | null) => void;
  begin: (note: Note, index: number) => void;
  move: (pageY: number) => void;
  end: () => void;
  cancel: () => void;
};

const DragContext = createContext<DragApi | null>(null);

function measure(view: Measurable | null): Promise<{ y: number; h: number } | null> {
  return new Promise((resolve) => {
    if (!view) return resolve(null);
    view.measureInWindow((_x: number, y: number, _w: number, h: number) => resolve({ y, h }));
  });
}

export function DragProvider({
  children,
  enabled = true,
  canDrop,
  onDrop,
  onRefused,
}: {
  children: ReactNode;
  /** False while the board is filtered, when an index would mean nothing. */
  enabled?: boolean;
  /** The Now limit lives above this component; drag just asks. */
  canDrop: (to: Section, from: Section) => boolean;
  onDrop: (noteId: string, to: Section, index: number) => void;
  onRefused: (to: Section) => void;
}) {
  const notes = useRef<Registry>(new Map()).current;
  const sections = useRef<Map<Section, Measurable | null>>(new Map()).current;

  const snapshot = useRef<{ notes: NoteRect[]; sections: SectionRect[] }>({
    notes: [],
    sections: [],
  });
  const from = useRef<{ section: Section; index: number } | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [target, setTarget] = useState<Drop | null>(null);
  const [allowed, setAllowed] = useState(true);

  const registerNote = useCallback(
    (id: string, section: Section, view: Measurable | null) => {
      if (view) notes.set(id, { view, section });
      else notes.delete(id);
    },
    [notes]
  );

  const registerSection = useCallback(
    (section: Section, view: Measurable | null) => {
      sections.set(section, view);
    },
    [sections]
  );

  const begin = useCallback(
    (note: Note, index: number) => {
      if (!enabled) return;
      from.current = { section: note.section, index };
      setDraggingId(note.id);
      setTarget(null);
      setAllowed(true);
      feel.resolved();

      // Measuring is asynchronous; the first few moves before it lands simply
      // find an empty snapshot and do nothing, which is the right behaviour.
      (async () => {
        const noteRects = await Promise.all(
          [...notes.entries()].map(async ([id, e]) => {
            const m = await measure(e.view);
            return m && { id, section: e.section, y: m.y, h: m.h };
          })
        );
        const sectionRects = await Promise.all(
          [...sections.entries()].map(async ([section, view]) => {
            const m = await measure(view);
            return m && { section, y: m.y, h: m.h };
          })
        );
        snapshot.current = {
          notes: noteRects.filter((r): r is NoteRect => r !== null && r !== undefined),
          sections: sectionRects.filter((r): r is SectionRect => r !== null && r !== undefined),
        };
      })();
    },
    [enabled, notes, sections]
  );

  const move = useCallback(
    (pageY: number) => {
      const id = draggingId;
      if (!id || !from.current) return;

      const next = dropTarget(snapshot.current.sections, snapshot.current.notes, pageY, id);
      if (!next) return;

      const ok = next.section === from.current.section || canDrop(next.section, from.current.section);

      setTarget((prev) => {
        // A small tick when the landing place changes, so the drag can be
        // followed without staring at the screen.
        if (!prev || prev.section !== next.section || prev.index !== next.index) {
          if (!prev || prev.section !== next.section) feel.added();
          return next;
        }
        return prev;
      });
      setAllowed(ok);
    },
    [canDrop, draggingId]
  );

  const finish = useCallback(
    (commit: boolean) => {
      const id = draggingId;
      const t = target;
      const start = from.current;

      setDraggingId(null);
      setTarget(null);
      setAllowed(true);
      from.current = null;

      if (!commit || !id || !t || !start) return;

      if (t.section !== start.section && !canDrop(t.section, start.section)) {
        feel.refused();
        onRefused(t.section);
        return;
      }
      if (isNoOp(t, start.section, start.index)) return;

      feel.resolved();
      onDrop(id, t.section, t.index);
    },
    [canDrop, draggingId, onDrop, onRefused, target]
  );

  const api = useMemo<DragApi>(
    () => ({
      draggingId,
      target,
      allowed,
      registerNote,
      registerSection,
      begin,
      move,
      end: () => finish(true),
      cancel: () => finish(false),
    }),
    [allowed, begin, draggingId, finish, move, registerNote, registerSection, target]
  );

  return <DragContext.Provider value={api}>{children}</DragContext.Provider>;
}

export function useDrag(): DragApi {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('useDrag must be used inside a DragProvider');
  return ctx;
}

/** How far sideways before a swipe counts as meant. */
const SWIPE_ARMED = 88;
const SWIPE_MAX = 150;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A note you can pick up, or swipe.
 *
 * Three gestures share one view, and which one you get is decided by how you
 * start:
 *
 *  - a tap opens the note
 *  - press and hold, then move, and you are carrying it
 *  - move sideways straight away and you are swiping it
 *
 * Everything else — a plain vertical drag — is left alone so the board
 * scrolls normally. That is the whole trick: the pan responder only claims
 * the gesture once it is sure, so scrolling never feels sticky.
 */
export function DraggableNote({
  note,
  index,
  count,
  fade,
  onPress,
  onComplete,
  onDelete,
  onMove,
  onReorder,
}: {
  note: Note;
  index: number;
  /** How many notes are in this section, so the ends know not to offer a move. */
  count: number;
  fade?: number;
  onPress: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onMove: (note: Note, to: Section) => void;
  onReorder: (note: Note, index: number) => void;
}) {
  const t = useTheme();
  const calm = useReducedMotion();
  const drag = useDrag();
  const view = useRef<Measurable | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;

  // The drag api is a new object every time the target changes. The pan
  // responder must NOT be rebuilt mid-gesture — React Native would lose the
  // active responder and the note would stick to the screen — so the handlers
  // read the latest api through a ref and are created exactly once.
  const latest = useRef(drag);
  latest.current = drag;
  const act = useRef({ onPress, onDelete });
  act.current = { onPress, onDelete };
  // Read through a ref for the same reason as `latest` above: the pan
  // responder is built exactly once and must not be rebuilt if the setting
  // changes while the app is open.
  const calmRef = useRef(calm);
  calmRef.current = calm;

  const lifted = useRef(false);
  const moved = useRef(false);
  const mode = useRef<'drag' | 'swipe' | null>(null);

  const dragging = drag.draggingId === note.id;

  /**
   * The same four things the gestures do, reached through the platform's
   * actions menu instead. A screen reader gives no feedback of its own for a
   * custom action, so each one says what it did afterwards — otherwise the
   * note moves and the person is told nothing.
   */
  const perform = (name: string) => {
    const a = readAction(name);
    if (!a) return;
    switch (a.kind) {
      case 'finish':
        onComplete(note);
        break;
      case 'delete':
        onDelete(note);
        break;
      case 'shift':
        onReorder(note, index + a.by);
        break;
      case 'move':
        onMove(note, a.to);
        break;
    }
    AccessibilityInfo.announceForAccessibility(actionSaid(a, note));
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => {
          if (lifted.current) return true;
          // Decisively sideways, or the scroll view keeps it.
          return Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6;
        },
        onPanResponderGrant: () => {
          mode.current = lifted.current ? 'drag' : 'swipe';
        },
        onPanResponderMove: (e, g) => {
          moved.current = true;
          if (mode.current === 'drag') {
            // Sideways movement is damped: the board is a column, so a drag
            // is really only ever up or down, but a little give feels alive.
            pan.setValue({ x: g.dx * 0.25, y: g.dy });
            latest.current.move(e.nativeEvent.pageY);
          } else {
            pan.setValue({ x: clamp(g.dx, -SWIPE_MAX, SWIPE_MAX), y: 0 });
          }
        },
        onPanResponderRelease: (_e, g) => {
          const was = mode.current;
          lifted.current = false;
          moved.current = false;
          mode.current = null;

          if (was === 'drag') {
            pan.setValue({ x: 0, y: 0 });
            latest.current.end();
            return;
          }

          const settle = () =>
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              bounciness: 4,
            }).start();

          if (g.dx >= SWIPE_ARMED) {
            feel.added();
            settle();
            act.current.onPress(note);
          } else if (g.dx <= -SWIPE_ARMED) {
            feel.refused();
            // It leaves the way it was pushed, then the board catches up.
            Animated.timing(pan, {
              toValue: { x: -600, y: 0 },
              duration: ms(180, calmRef.current),
              useNativeDriver: true,
            }).start(() => {
              act.current.onDelete(note);
              pan.setValue({ x: 0, y: 0 });
            });
          } else {
            settle();
          }
        },
        onPanResponderTerminate: () => {
          const was = mode.current;
          lifted.current = false;
          moved.current = false;
          mode.current = null;
          pan.setValue({ x: 0, y: 0 });
          if (was === 'drag') latest.current.cancel();
        },
      }),
    [note, pan]
  );

  // The two actions waiting behind the note, each fading up as you reach it.
  const reveal = (from: number, to: number) =>
    pan.x.interpolate({
      inputRange: from < to ? [from, to] : [to, from],
      outputRange: from < to ? [0, 1] : [1, 0],
      extrapolate: 'clamp',
    });

  return (
    <View>
      <View style={b.behind} pointerEvents="none">
        <Animated.View style={[b.side, { opacity: reveal(10, SWIPE_ARMED) }]}>
          <Text style={[type.label, { color: t.c.accent }]}>Edit</Text>
        </Animated.View>
        <Animated.View style={[b.side, b.right, { opacity: reveal(-10, -SWIPE_ARMED) }]}>
          <Text style={[type.label, { color: t.c.warn }]}>Drop</Text>
        </Animated.View>
      </View>

      <Animated.View
        ref={(v) => {
          // Animated.View forwards its ref to the underlying view, which is
          // what measureInWindow needs.
          view.current = v as unknown as Measurable | null;
          drag.registerNote(note.id, note.section, view.current);
        }}
        {...responder.panHandlers}
        style={[
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: dragging ? 1.03 : 1 },
            ],
          },
          // Lift it above its neighbours so it is never clipped by the next note.
          dragging && { zIndex: 10, elevation: 10 },
        ]}
      >
        <NoteCard
          note={note}
          index={index}
          fade={dragging ? 0.92 : fade}
          onPress={onPress}
          onComplete={onComplete}
          actions={actionsFor(note, index, count)}
          onAction={perform}
          onLongPress={() => {
            lifted.current = true;
            drag.begin(note, index);
          }}
          onPressOut={() => {
            // Held, then let go without moving: nothing to commit.
            if (lifted.current && !moved.current) {
              lifted.current = false;
              drag.cancel();
            }
          }}
          suppressPress={() => lifted.current || moved.current}
        />
      </Animated.View>
    </View>
  );
}

const b = StyleSheet.create({
  behind: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  side: { justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
});
