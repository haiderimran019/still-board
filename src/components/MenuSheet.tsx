import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TAP, radius, space } from '../theme/tokens';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/**
 * The two things that aren't the board.
 *
 * They live behind one quiet control rather than on the board itself —
 * finishing notes and backing up are things you do occasionally, and putting
 * them in front of the notes every single day was clutter.
 */
export function MenuSheet({
  visible,
  todayCount,
  doneCount,
  onClose,
  onDone,
  onBackup,
}: {
  visible: boolean;
  todayCount: number;
  doneCount: number;
  onClose: () => void;
  onDone: () => void;
  onBackup: () => void;
}) {
  const t = useTheme();

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
          <Row label="Keep a copy" hint="Save the board, or back it up" onPress={onBackup} />
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
});
