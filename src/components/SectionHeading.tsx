import { StyleSheet, Text, View } from 'react-native';

import { NOW_LIMIT } from '../config';
import type { Section } from '../db/schema';
import { SECTION_COPY } from '../screens/sectionCopy';
import { type } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

/**
 * A section's name, its one-line reason for existing, and how many notes are
 * in it. Only Now shows a denominator, because only Now has a ceiling.
 */
export function SectionHeading({ section, count }: { section: Section; count: number }) {
  const t = useTheme();
  const copy = SECTION_COPY[section];
  const full = section === 'now' && count >= NOW_LIMIT;

  return (
    <View>
      <View style={s.row}>
        <Text accessibilityRole="header" style={[type.section, { color: t.c.ink }]}>
          {copy.name}
        </Text>
        <Text style={[type.label, { color: full ? t.c.warn : t.c.inkSoft }]}>
          {section === 'now' ? `${count} / ${NOW_LIMIT}` : count === 0 ? '' : count}
        </Text>
      </View>
      <Text style={[type.caption, { color: t.c.inkFaint }]}>{copy.sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
