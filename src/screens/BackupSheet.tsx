import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { backupFilename, parseBackup, toBackup } from '../backup/format';
import * as local from '../backup/local';
import type { Note } from '../db/schema';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/**
 * Moving the board, and keeping a copy of it.
 *
 * A file you hold yourself needs no account, no network and no trust in us —
 * it works on a bad connection, it works for someone who will never sign in
 * to anything, and it is the one most people should use. The account does the
 * same job without being asked, and is pointed at rather than repeated here.
 *
 * Restoring only ever adds notes that aren't here. It cannot overwrite what
 * is on this phone and it cannot delete anything, so there is no version of
 * pressing the wrong button that costs you work.
 */
export function BackupSheet({
  visible,
  onClose,
  onExport,
  onImport,
}: {
  visible: boolean;
  onClose: () => void;
  /** The whole board, finished notes included, as a JSON string. */
  onExport: () => Promise<Note[]>;
  /** Returns how many notes were added. */
  onImport: (notes: Note[]) => Promise<number>;
}) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<string | null>(null);

  const run = async (job: () => Promise<string>) => {
    if (busy) return;
    setBusy(true);
    setSaid(null);
    try {
      setSaid(await job());
    } catch (e) {
      setSaid(e instanceof Error ? e.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  };

  const json = async () => JSON.stringify(toBackup(await onExport(), Date.now()), null, 2);

  /** Shared by both restore paths, so they can never disagree. */
  const restoreFrom = async (text: string): Promise<string> => {
    const parsed = parseBackup(text);
    if (!parsed.ok) return parsed.reason;
    const added = await onImport(parsed.notes);
    if (added === 0) return 'Everything in that backup was already here.';
    return added === 1 ? '1 note came back.' : `${added} notes came back.`;
  };

  const saveFile = () =>
    run(async () => {
      const r = await local.saveToFile(await json(), backupFilename(Date.now()));
      return r.ok ? 'Saved.' : r.reason;
    });

  const openFile = () =>
    run(async () => {
      const text = await local.readFromFile();
      if (text === null) return 'Nothing chosen.';
      return restoreFrom(text);
    });

  const Button = ({
    label,
    hint,
    onPress,
    disabled,
  }: {
    label: string;
    hint?: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled: disabled || busy }}
      style={({ pressed }) => [
        s.button,
        {
          borderColor: t.c.rule,
          backgroundColor: t.c.surface,
          opacity: disabled || busy ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[type.bodyStrong, { color: t.c.ink }]}>{label}</Text>
      {hint && <Text style={[type.caption, s.hint, { color: t.c.inkFaint }]}>{hint}</Text>}
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[s.screen, { backgroundColor: t.c.board }]} edges={['top', 'bottom']}>
        <View style={s.head}>
          <View style={s.headText}>
            <Text accessibilityRole="header" style={[type.wordmark, s.title, { color: t.c.ink }]}>
              Your board, elsewhere
            </Text>
            <Text style={[type.caption, { color: t.c.inkSoft }]}>
              Restoring only adds what's missing. It never overwrites or deletes.
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Back to the board"
            hitSlop={12}
            style={({ pressed }) => [s.close, { borderColor: t.c.rule, opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[type.label, { color: t.c.inkSoft }]}>Back</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={[type.section, s.group, { color: t.c.ink }]}>Move to another phone</Text>
          <Text style={[type.caption, s.blurb, { color: t.c.inkSoft }]}>
            Send the board to yourself — WhatsApp, email, AirDrop, anything — then open
            still. on the other phone and tap Receive. No account, no connection to us.
          </Text>
          <Button
            label="Send the board"
            hint="Share the whole board as one file"
            onPress={saveFile}
          />
          <Button
            label="Receive a board"
            hint="Pick the file you sent yourself"
            onPress={openFile}
          />

          <Text style={[type.section, s.group, { color: t.c.ink }]}>Without the file</Text>
          <Text style={[type.caption, s.blurb, { color: t.c.inkFaint }]}>
            Signing in to your Google account does this on its own — your board is on
            every phone you sign in on. It's under You, in the same menu as this.
          </Text>

          {(busy || said) && (
            <View style={s.status}>
              {busy && <ActivityIndicator color={t.c.accent} />}
              {said && <Text style={[type.body, { color: t.c.inkSoft }]}>{said}</Text>}
            </View>
          )}
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
  headText: { flex: 1, paddingRight: space.md },
  title: { fontSize: 28 },
  close: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  group: { marginTop: space.lg, marginBottom: space.xs },
  blurb: { marginBottom: space.md },
  who: { marginBottom: space.sm },
  button: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
    minHeight: MIN_TAP,
    justifyContent: 'center',
  },
  hint: { marginTop: 2 },
  quiet: { minHeight: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
  status: { marginTop: space.xl, alignItems: 'center', gap: space.md },
});
