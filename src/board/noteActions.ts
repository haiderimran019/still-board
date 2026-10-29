import { SECTIONS, type Note, type Section } from '../db/schema';
import { SECTION_COPY } from '../screens/sectionCopy';

/**
 * Everything you can do to a note without aiming at it.
 *
 * Dragging and swiping are the best part of this board with a finger, and
 * completely unavailable with a screen reader: TalkBack and VoiceOver take
 * the touch gestures over for their own navigation, so a note that can only
 * be moved by dragging cannot be moved at all. The same goes for a hand that
 * cannot hold a press steady for 450ms.
 *
 * So every gesture has a twin here, offered through the platform's actions
 * menu. This is not a lesser path to bolt on and forget — for some people it
 * is the only path, so it covers the whole set: finish, reorder, move
 * between sections, delete. Tapping already opens the note, which is why
 * there is no "edit" action; that one is reachable either way.
 */
export type NoteAction =
  | { kind: 'finish' }
  | { kind: 'delete' }
  /** Up or down within the section it is already in. */
  | { kind: 'shift'; by: -1 | 1 }
  | { kind: 'move'; to: Section };

/** What React Native wants: a stable name, and words for the person. */
export type ActionSpec = { name: string; label: string };

const MOVE = 'move:';

/**
 * The actions this particular note can offer, in the order they are read out.
 * Reordering is left out at the ends of a list, where it would do nothing and
 * only lengthen the menu.
 */
export function actionsFor(note: Note, index: number, count: number): ActionSpec[] {
  const out: ActionSpec[] = [{ name: 'finish', label: 'Finish it' }];
  if (index > 0) out.push({ name: 'up', label: 'Move up' });
  if (index < count - 1) out.push({ name: 'down', label: 'Move down' });
  for (const s of SECTIONS) {
    if (s !== note.section) out.push({ name: MOVE + s, label: `Move to ${SECTION_COPY[s].name}` });
  }
  out.push({ name: 'delete', label: 'Drop it' });
  return out;
}

/**
 * Back from the name the platform hands us. Unknown names return null rather
 * than throwing: the actions menu is outside our control, and an action we do
 * not recognise should do nothing at all rather than take the app down.
 */
export function readAction(name: string): NoteAction | null {
  if (name === 'finish') return { kind: 'finish' };
  if (name === 'delete') return { kind: 'delete' };
  if (name === 'up') return { kind: 'shift', by: -1 };
  if (name === 'down') return { kind: 'shift', by: 1 };
  if (name.startsWith(MOVE)) {
    const to = name.slice(MOVE.length) as Section;
    return SECTIONS.includes(to) ? { kind: 'move', to } : null;
  }
  return null;
}

/**
 * What to say once it has happened. A screen reader gives no feedback of its
 * own for a custom action, so without this the note simply moves and the
 * person is told nothing.
 */
export function actionSaid(action: NoteAction, note: Note): string {
  switch (action.kind) {
    case 'finish':
      return `Finished: ${note.text}`;
    case 'delete':
      return `Dropped: ${note.text}. You can undo it.`;
    case 'shift':
      return action.by < 0 ? 'Moved up' : 'Moved down';
    case 'move':
      return `Moved to ${SECTION_COPY[action.to].name}`;
  }
}
