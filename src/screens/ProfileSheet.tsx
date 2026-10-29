import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAccount } from '../auth/account';
import { syncSaid } from '../sync/sync';
import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/**
 * You, on this board.
 *
 * Signed out, it is one sentence and one button — there is nothing to manage
 * until there is an account. Signed in, it says the three things worth
 * knowing: who you are, how many notes are on the account, and when the two
 * last agreed with each other.
 *
 * It never claims to be more than it is. The sync only adds notes, so this
 * screen says so in plain words rather than letting someone assume a delete
 * on one phone reaches the other.
 */
export function ProfileSheet({
  visible,
  boardCount,
  onClose,
}: {
  visible: boolean;
  boardCount: number;
  onClose: () => void;
}) {
  const t = useTheme();
  const a = useAccount();
  const [said, setSaid] = useState<string | null>(null);

  const when = (at: number | null): string => {
    if (at === null) return 'Not yet';
    const mins = Math.floor((Date.now() - at) / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  const initial = (a.account?.name ?? a.account?.email ?? '?').trim().charAt(0).toUpperCase();

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
      disabled={disabled || a.busy}
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled: disabled || a.busy }}
      style={({ pressed }) => [
        s.button,
        {
          borderColor: t.c.rule,
          backgroundColor: t.c.surface,
          opacity: disabled || a.busy ? 0.4 : pressed ? 0.7 : 1,
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
          <Text accessibilityRole="header" style={[type.wordmark, s.title, { color: t.c.ink }]}>
            You
          </Text>
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
          {!a.available ? (
            <Text style={[type.body, s.blurb, { color: t.c.inkSoft }]}>
              Signing in isn't switched on in this build. Your board is on this phone, and
              "Your board, elsewhere" will move it to another one as a file.
            </Text>
          ) : a.account ? (
            <>
              <View style={[s.card, t.shadow, { backgroundColor: t.c.surface, borderColor: t.c.rule }]}>
                <View style={[s.avatar, { backgroundColor: t.c.accent }]}>
                  <Text style={[type.wordmark, s.initial, { color: t.c.board }]}>{initial}</Text>
                </View>
                <View style={s.who}>
                  {a.account.name && (
                    <Text style={[type.bodyStrong, { color: t.c.ink }]}>{a.account.name}</Text>
                  )}
                  <Text style={[type.caption, { color: t.c.inkSoft }]}>{a.account.email}</Text>
                </View>
              </View>

              <View style={s.facts}>
                <Fact label="On this board" value={String(boardCount)} />
                <Fact label="Last brought together" value={when(a.lastSyncedAt)} />
              </View>

              <Text style={[type.caption, s.blurb, { color: t.c.inkFaint }]}>
                Signing in on another phone brings these notes over to it. It only ever
                adds — nothing you have is overwritten, and a note deleted on one phone
                stays on the other.
              </Text>

              <Button
                label="Bring it together now"
                hint="Pull anything new, then put this board back"
                onPress={() => void a.sync().then((o) => setSaid(syncSaid(o)))}
              />
              <Pressable
                onPress={() => {
                  setSaid(null);
                  a.signOut();
                }}
                accessibilityRole="button"
                accessibilityLabel="Sign out. Your notes stay on this phone."
                style={({ pressed }) => [s.quiet, { opacity: pressed ? 0.5 : 1 }]}
              >
                <Text style={[type.caption, { color: t.c.inkFaint }]}>
                  Sign out — your notes stay here
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[type.body, s.blurb, { color: t.c.inkSoft }]}>
                Sign in and this board goes with you. Open still. on another phone, sign in
                with the same account, and your notes are already there.
              </Text>
              <Text style={[type.caption, s.blurb, { color: t.c.inkFaint }]}>
                It uses a private folder in your own Google Drive that only this app can
                see. It cannot read anything else in your Drive — not one other file.
              </Text>
              <Button
                label="Sign in with Google"
                hint="Brings your board to every phone you sign in on"
                onPress={() => void a.signIn()}
                disabled={!a.ready}
              />
            </>
          )}

          {a.error && (
            <Text style={[type.caption, s.blurb, { color: t.c.warn }]}>{a.error}</Text>
          )}

          {(a.busy || said) && (
            <View style={s.status}>
              {a.busy && <ActivityIndicator color={t.c.accent} />}
              {said && <Text style={[type.body, { color: t.c.inkSoft }]}>{said}</Text>}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={[s.fact, { borderColor: t.c.rule }]}>
      <Text style={[type.caption, { color: t.c.inkFaint }]}>{label}</Text>
      <Text style={[type.bodyStrong, s.factValue, { color: t.c.ink }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  title: { letterSpacing: -1 },
  close: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    minHeight: MIN_TAP - 14,
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 24, letterSpacing: 0 },
  who: { flex: 1, gap: 2 },
  facts: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  fact: { flex: 1, borderWidth: 1, borderRadius: radius.card, padding: space.md, gap: 2 },
  factValue: { marginTop: 1 },
  blurb: { marginTop: space.sm, marginBottom: space.xs },
  button: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    minHeight: MIN_TAP,
    justifyContent: 'center',
    marginTop: space.xs,
  },
  hint: { marginTop: 2 },
  quiet: { alignItems: 'center', paddingVertical: space.md, minHeight: MIN_TAP },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
});
