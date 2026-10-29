import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useAccount } from '../auth/account';
import { THEME_MODES, useTheme, useThemeMode } from '../theme/useTheme';

/**
 * Everything that isn't the board.
 *
 * It lives behind one quiet control rather than on the board itself —
 * finishing notes, backing up and choosing a theme are things you do
 * occasionally, and putting them in front of the notes every single day was
 * clutter. Nothing here moves anything on the board.
 */
export function MenuSheet({
  visible,
  todayCount,
  doneCount,
  onClose,
  onDone,
  onBackup,
  onProfile,
}: {
  visible: boolean;
  todayCount: number;
  doneCount: number;
  onClose: () => void;
  onDone: () => void;
  onBackup: () => void;
  onProfile: () => void;
}) {
  const t = useTheme();
  const { mode, setMode } = useThemeMode();
  const a = useAccount();

  const Row = ({
    label,
    hint,
    onPress,
  }: {
    label: string;
    hint: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={() => {
        onClose();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      style={({ pressed }) => [
        s.row,
        { borderColor: t.c.rule, backgroundColor: t.c.board, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[type.bodyStrong, { color: t.c.ink }]}>{label}</Text>
      <Text style={[type.caption, s.hint, { color: t.c.inkFaint }]}>{hint}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close this menu" />
      <View style={s.lift} pointerEvents="box-none">
        <View style={[s.sheet, { backgroundColor: t.c.surface, borderColor: t.c.rule }]}>
          <View style={[s.grab, { backgroundColor: t.c.rule }]} />
          <Row
            label="Finished"
            hint={
              todayCount > 0
                ? `${todayCount} cleared today`
                : doneCount > 0
                  ? `${doneCount} in the last month`
                  : 'Nothing yet'
            }
            onPress={onDone}
          />
          <Row label="Your board, elsewhere" hint="Move it to another phone, or keep a copy" onPress={onBackup} />
          <Row
            label="You"
            hint={
              a.account
                ? a.account.email
                : a.available
                  ? 'Sign in and your board follows you'
                  : 'This board lives on this phone'
            }
            onPress={onProfile}
          />

          {/* The theme. Three states, not a switch: "Auto" is a real answer
              and the commonest one, and a two-position switch cannot say it.
              Changing it does not close the menu — you want to see it land. */}
          <View style={[s.segment, { borderColor: t.c.rule, backgroundColor: t.c.board }]}>
            <Text style={[type.bodyStrong, s.segmentLabel, { color: t.c.ink }]}>Look</Text>
            <View style={s.segmentTrack}>
              {THEME_MODES.map((m) => {
                const on = m.key === mode;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMode(m.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={
                      m.key === 'system' ? 'Follow the phone' : `Always ${m.label.toLowerCase()}`
                    }
                    style={({ pressed }) => [
                      s.segmentOption,
                      {
                        backgroundColor: on ? t.c.accent : 'transparent',
                        borderColor: on ? t.c.accent : t.c.rule,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={[type.label, { color: on ? t.c.board : t.c.inkSoft }]}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
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
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  grab: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: space.md },
  row: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    minHeight: MIN_TAP,
    justifyContent: 'center',
  },
  hint: { marginTop: 2 },
  segment: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  segmentLabel: { marginBottom: 2 },
  segmentTrack: { flexDirection: 'row', gap: space.sm },
  segmentOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.card - 4,
    minHeight: MIN_TAP - 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
