import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoogleAccount } from '../auth/google';
import * as drive from '../backup/drive';
import { backupFilename, parseBackup, toBackup } from '../backup/format';
import * as local from '../backup/local';
import { googleConfigured } from '../config';
import type { Note } from '../db/schema';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/**
 * Keeping a copy of the board.
 *
 * Two ways, and the order on screen is deliberate. A file you hold yourself
 * needs no account, no network and no trust — it works on a bad connection
 * and it is the one most people should use. Google Drive is offered second,
 * for a copy that survives losing the phone entirely.
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

          <Text style={[type.section, s.group, { color: t.c.ink }]}>Google Drive</Text>
          {/* Rendered as a separate component, and only when there are client
              IDs to use. The auth hook throws outright on a platform with no
              ID configured, so it must not run at all until one exists. */}
          {googleConfigured() ? (
            <GoogleBackup busy={busy} json={json} restoreFrom={restoreFrom} run={run} Button={Button} />
          ) : (
            <Text style={[type.caption, s.blurb, { color: t.c.inkFaint }]}>
              Not switched on in this build. Sending the board as a file above does the
              same job and needs no account.
            </Text>
          )}

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

/**
 * The Google half. Separated out so that `useGoogleAccount` — which throws
 * on a platform with no client ID configured — is never mounted until the
 * app actually has one.
 */
function GoogleBackup({
  busy,
  json,
  restoreFrom,
  run,
  Button,
}: {
  busy: boolean;
  json: () => Promise<string>;
  restoreFrom: (text: string) => Promise<string>;
  run: (job: () => Promise<string>) => Promise<void>;
  Button: (p: {
    label: string;
    hint?: string;
    onPress: () => void;
    disabled?: boolean;
  }) => React.ReactElement;
}) {
  const t = useTheme();
  const google = useGoogleAccount();

  const toDrive = () =>
    void run(async () => {
      if (!google.token) return 'Sign in first.';
      const r = await drive.upload(google.token, await json());
      return r.ok ? 'Backed up to your Drive.' : r.reason;
    });

  const fromDrive = () =>
    void run(async () => {
      if (!google.token) return 'Sign in first.';
      const r = await drive.download(google.token);
      if (!r.ok) return r.reason;
      if (r.value === null) return 'There is no backup in your Drive yet.';
      return restoreFrom(r.value);
    });

  return (
    <>
      <Text style={[type.caption, s.blurb, { color: t.c.inkSoft }]}>
        Kept in a private folder only this app can see. It can't read anything else in
        your Drive.
      </Text>
      {google.account ? (
        <>
          <Text style={[type.label, s.who, { color: t.c.inkSoft }]}>
            Signed in as {google.account.email}
          </Text>
          <Button label="Back up now" onPress={toDrive} />
          <Button label="Restore from Drive" onPress={fromDrive} />
          <Pressable
            onPress={google.signOut}
            accessibilityRole="button"
            style={({ pressed }) => [s.quiet, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={[type.caption, { color: t.c.inkFaint }]}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <Button
          label="Sign in with Google"
          hint="Only to reach this app's own backup folder"
          onPress={() => void google.signIn()}
          disabled={!google.ready || google.busy || busy}
        />
      )}
      {google.error && (
        <Text style={[type.caption, s.blurb, { color: t.c.warn }]}>{google.error}</Text>
      )}
    </>
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
