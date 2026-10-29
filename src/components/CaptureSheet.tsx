import { useEffect, useRef, useState, type ComponentRef } from 'react';
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

import { NOW_LIMIT } from '../config';
import type { FreeUp } from '../db/repository';
import { SECTIONS, type Note, type Section } from '../db/schema';
import { feel } from '../feel/haptics';
import { SECTION_COPY } from '../screens/sectionCopy';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

type Props = {
  visible: boolean;
  /** The notes currently in Now — only needed when it turns out to be full. */
  nowNotes: Note[];
  onClose: () => void;
  onCreate: (text: string, section: Section) => Promise<void>;
  onSwap: (text: string, outgoingId: string, how: FreeUp) => Promise<void>;
};

/**
 * Writing a note, and the one moment the app ever says no.
 *
 * Capture defaults to **Now**, deliberately. Quietly sending notes to Next
 * once Now is full would spare the user a decision — and that decision is the
 * entire product. So instead the sheet turns around and shows the seven notes
 * already there, and one tap resolves it. The refusal is the feature.
 */
export function CaptureSheet({ visible, nowNotes, onClose, onCreate, onSwap }: Props) {
  const t = useTheme();
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const [text, setText] = useState('');
  const [section, setSection] = useState<Section>('now');
  // 'write' is the normal sheet; 'full' is the Now-is-full turn it can take.
  const [stage, setStage] = useState<'write' | 'full'>('write');
  const [busy, setBusy] = useState(false);

  // A sheet that remembers last time's half-written note is a small betrayal.
  useEffect(() => {
    if (visible) {
      setText('');
      setSection('now');
      setStage('write');
      setBusy(false);
    }
  }, [visible]);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !busy;
  const nowFull = nowNotes.length >= NOW_LIMIT;

  const submit = async () => {
    if (!canSubmit) return;
    if (section === 'now' && nowFull) {
      feel.refused();
      setStage('full');
      return;
    }
    setBusy(true);
    await onCreate(trimmed, section);
    feel.added();
    onClose();
  };

  const resolve = async (outgoingId: string, how: FreeUp) => {
    if (busy) return;
    setBusy(true);
    await onSwap(trimmed, outgoingId, how);
    feel.resolved();
    onClose();
  };

  const divert = async () => {
    if (busy) return;
    setBusy(true);
    await onCreate(trimmed, 'next');
    feel.added();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => input.current?.focus()}
    >
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close without saving" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.lift}
        pointerEvents="box-none"
      >
        <View style={[s.sheet, { backgroundColor: t.c.surface, borderColor: t.c.rule }]}>
          <View style={[s.grab, { backgroundColor: t.c.rule }]} />

          {stage === 'write' ? (
            <>
              <TextInput
                ref={input}
                value={text}
                onChangeText={setText}
                placeholder="What's on your mind?"
                placeholderTextColor={t.c.inkFaint}
                multiline
                autoFocus
                maxLength={280}
                style={[type.note, s.input, { color: t.c.ink }]}
                accessibilityLabel="Note text"
                onSubmitEditing={submit}
                blurOnSubmit={false}
              />

              <View style={s.pills}>
                {SECTIONS.map((key) => {
                  const on = key === section;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setSection(key)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={
                        key === 'now' && nowFull
                          ? `Now, which is full at ${NOW_LIMIT} notes`
                          : SECTION_COPY[key].name
                      }
                      style={[
                        s.pill,
                        {
                          backgroundColor: on ? t.c.accent : 'transparent',
                          borderColor: on ? t.c.accent : t.c.rule,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          type.label,
                          { color: on ? t.c.board : t.c.inkSoft },
                        ]}
                      >
                        {SECTION_COPY[key].name}
                        {key === 'now' && ` ${nowNotes.length}/${NOW_LIMIT}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityLabel="Add this note"
                accessibilityState={{ disabled: !canSubmit }}
                style={({ pressed }) => [
                  s.primary,
                  {
                    backgroundColor: t.c.accent,
                    opacity: !canSubmit ? 0.35 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[type.bodyStrong, { color: t.c.board }]}>Add it</Text>
              </Pressable>
            </>
          ) : (
            <FullNow
              text={trimmed}
              notes={nowNotes}
              busy={busy}
              onResolve={resolve}
              onDivert={divert}
              onBack={() => setStage('write')}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * The seven notes already in Now, each with the three honest ways out. No
 * scolding and no blocked button — every path here ends with the new note
 * somewhere sensible.
 */
function FullNow({
  text,
  notes,
  busy,
  onResolve,
  onDivert,
  onBack,
}: {
  text: string;
  notes: Note[];
  busy: boolean;
  onResolve: (id: string, how: FreeUp) => void;
  onDivert: () => void;
  onBack: () => void;
}) {
  const t = useTheme();

  const actions: Array<{ how: FreeUp; label: string; verb: string }> = [
    { how: 'complete', label: 'Done', verb: 'Mark as done' },
    { how: 'move', label: 'Next', verb: 'Move to Next' },
    { how: 'delete', label: 'Drop', verb: 'Delete' },
  ];

  return (
    <View>
      <Text accessibilityRole="header" style={[type.section, { color: t.c.ink }]}>
        Now is full
      </Text>
      <Text style={[type.body, s.lede, { color: t.c.inkSoft }]}>
        Seven is the whole point of it. Something has to come out before
        “{text}” goes in.
      </Text>

      <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
        {notes.map((n) => (
          <View key={n.id} style={[s.row, { borderColor: t.c.rule }]}>
            <Text style={[type.note, s.rowText, { color: t.c.ink }]} numberOfLines={2}>
              {n.text}
            </Text>
            <View style={s.rowActions}>
              {actions.map((a) => (
                <Pressable
                  key={a.how}
                  disabled={busy}
                  onPress={() => onResolve(n.id, a.how)}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.verb}: ${n.text}`}
                  style={({ pressed }) => [
                    s.rowBtn,
                    {
                      borderColor: a.how === 'delete' ? t.c.warn : t.c.rule,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[type.label, { color: a.how === 'delete' ? t.c.warn : t.c.inkSoft }]}
                  >
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={onDivert}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Put this note in Next instead"
        style={({ pressed }) => [s.secondary, { borderColor: t.c.rule, opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[type.bodyStrong, { color: t.c.ink }]}>Put it in Next instead</Text>
      </Pressable>

      <Pressable onPress={onBack} accessibilityRole="button" style={s.back}>
        <Text style={[type.caption, { color: t.c.inkFaint }]}>Back to the note</Text>
      </Pressable>
    </View>
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
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  grab: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: space.lg },
  input: { minHeight: 72, maxHeight: 160, textAlignVertical: 'top', fontSize: 17, lineHeight: 24 },
  pills: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  pill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    justifyContent: 'center',
    minHeight: 38,
  },
  primary: {
    marginTop: space.lg,
    minHeight: MIN_TAP,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lede: { marginTop: space.sm },
  list: { marginTop: space.lg, maxHeight: 300 },
  row: { borderBottomWidth: 1, paddingVertical: space.md },
  rowText: {},
  rowActions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  rowBtn: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: 'center',
  },
  secondary: {
    marginTop: space.lg,
    minHeight: MIN_TAP,
    borderWidth: 1,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { minHeight: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
});
