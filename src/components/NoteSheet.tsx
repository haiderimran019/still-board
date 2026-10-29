import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { reminderChoices, reminderLabel } from '../board/schedule';
import { SECTIONS, type Note, type Section } from '../db/schema';
import { SECTION_COPY } from '../screens/sectionCopy';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type Props = {
  note: Note | null;
  onClose: () => void;
  onEdit: (id: string, text: string) => Promise<void>;
  onMove: (id: string, section: Section) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRemind: (id: string, at: number | null) => Promise<void>;
};

/**
 * Everything you can do to one note, on one sheet.
 *
 * Deliberately not a menu of menus: edit the words in place, move it, set a
 * reminder, finish it, or drop it — all visible at once, so there is never a
 * second tap to find out what the options were.
 */
export function NoteSheet({
  note,
  onClose,
  onEdit,
  onMove,
  onComplete,
  onDelete,
  onRemind,
}: Props) {
  const t = useTheme();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (note) {
      setText(note.text);
      setBusy(false);
    }
  }, [note]);

  if (!note) return null;

  /** Edits are kept on the way out — there is no Save button to forget. */
  const closeKeepingEdits = async () => {
    const next = text.trim();
    if (next.length > 0 && next !== note.text) await onEdit(note.id, next);
    onClose();
  };

  const act = async (run: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    await run();
    onClose();
  };

  const now = new Date();
  const elsewhere = SECTIONS.filter((s) => s !== note.section);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={closeKeepingEdits}>
      <Pressable
        style={s.backdrop}
        onPress={closeKeepingEdits}
        accessibilityLabel="Close the note"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.lift}
        pointerEvents="box-none"
      >
        <View style={[s.sheet, { backgroundColor: t.c.surface, borderColor: t.c.rule }]}>
          <View style={[s.grab, { backgroundColor: t.c.rule }]} />

          <ScrollView keyboardShouldPersistTaps="handled">
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              maxLength={280}
              accessibilityLabel="Note text"
              style={[type.note, s.input, { color: t.c.ink }]}
            />

            {/* Reminders are a Now thing only: being nudged about something
                you have already decided isn't today is just an interruption. */}
            {note.section === 'now' && (
              <View style={s.block}>
                <Text style={[type.label, s.blockTitle, { color: t.c.inkSoft }]}>
                  {note.remindAt ? `Reminder · ${reminderLabel(note.remindAt, now)}` : 'Remind me'}
                </Text>
                <View style={s.pills}>
                  {reminderChoices(now).map((c) => (
                    <Pressable
                      key={c.key}
                      disabled={busy}
                      onPress={() => act(() => onRemind(note.id, c.at))}
                      accessibilityRole="button"
                      accessibilityLabel={`Remind me ${c.label.toLowerCase()}`}
                      style={({ pressed }) => [
                        s.pill,
                        { borderColor: t.c.rule, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={[type.label, { color: t.c.inkSoft }]}>{c.label}</Text>
                    </Pressable>
                  ))}
                  {note.remindAt !== null && (
                    <Pressable
                      disabled={busy}
                      onPress={() => act(() => onRemind(note.id, null))}
                      accessibilityRole="button"
                      accessibilityLabel="Clear the reminder"
                      style={({ pressed }) => [
                        s.pill,
                        { borderColor: t.c.warn, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={[type.label, { color: t.c.warn }]}>Clear</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            <View style={s.block}>
              <Text style={[type.label, s.blockTitle, { color: t.c.inkSoft }]}>Move to</Text>
              <View style={s.pills}>
                {elsewhere.map((section) => (
                  <Pressable
                    key={section}
                    disabled={busy}
                    onPress={() => act(() => onMove(note.id, section))}
                    accessibilityRole="button"
                    accessibilityLabel={`Move to ${SECTION_COPY[section].name}`}
                    style={({ pressed }) => [
                      s.pill,
                      { borderColor: t.c.rule, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Text style={[type.label, { color: t.c.inkSoft }]}>
                      {SECTION_COPY[section].name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              disabled={busy}
              onPress={() => act(() => onComplete(note.id))}
              accessibilityRole="button"
              accessibilityLabel="Mark this note as done"
              style={({ pressed }) => [
                s.primary,
                { backgroundColor: t.c.accent, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[type.bodyStrong, { color: t.c.board }]}>Done with it</Text>
            </Pressable>

            <Pressable
              disabled={busy}
              onPress={() => act(() => onDelete(note.id))}
              accessibilityRole="button"
              accessibilityLabel="Delete this note"
              style={({ pressed }) => [s.quiet, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Text style={[type.caption, { color: t.c.warn }]}>Drop it instead</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  lift: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  grab: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: space.lg },
  input: { minHeight: 60, fontSize: 21, lineHeight: 28, textAlignVertical: 'top' },
  block: { marginTop: space.lg },
  blockTitle: { marginBottom: space.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
  },
  primary: {
    marginTop: space.xl,
    minHeight: MIN_TAP,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quiet: { minHeight: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
});
