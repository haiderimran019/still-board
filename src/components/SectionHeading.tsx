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
  const showCount = section === 'now' || count > 0;

  return (
    <View>
      <View style={s.row}>
        <Text accessibilityRole="header" style={[type.section, { color: t.c.ink }]}>
          {copy.name}
        </Text>
        {showCount && (
          <Text
            style={[
              type.label,
              s.count,
              { color: full ? t.c.warn : t.c.accent, backgroundColor: t.c.surface, borderColor: t.c.rule },
            ]}
          >
            {section === 'now' ? `${count} / ${NOW_LIMIT}` : count}
          </Text>
        )}
      </View>
      <Text style={[type.caption, { color: t.c.inkFaint }]}>{copy.sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  count: { borderWidth: 1, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 2 },
});
