import { JOURNEY_STATUS_LABELS } from '@/lib/journey';
import { colors, spacing } from '@/lib/theme';
import type { JourneyUpdate } from '@/lib/types/order';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

function formatUpdateTime(createdAt: JourneyUpdate['createdAt']): string {
  if (!createdAt) return '';
  if (typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function') {
    return createdAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return '';
}

interface JourneyTimelineProps {
  updates: JourneyUpdate[];
}

export function JourneyTimeline({ updates }: JourneyTimelineProps) {
  if (!updates.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No journey updates yet. Tap a milestone to send the first update.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {updates.map((update, index) => (
        <View key={`${update.status}-${index}`} style={styles.item}>
          <View style={styles.dotCol}>
            <View style={styles.dot} />
            {index < updates.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.ctaGreen} />
              <Text style={styles.title}>
                {JOURNEY_STATUS_LABELS[update.status] ?? update.status}
              </Text>
              <Text style={styles.time}>{formatUpdateTime(update.createdAt)}</Text>
            </View>
            <Text style={styles.message}>{update.message}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.md },
  empty: {
    padding: spacing.lg,
    backgroundColor: colors.careBlueLight,
    borderRadius: 12,
  },
  emptyText: { color: colors.gray700, fontSize: 14, lineHeight: 20 },
  item: { flexDirection: 'row', gap: spacing.md },
  dotCol: { alignItems: 'center', width: 20 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryBlue,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.gray200,
    marginVertical: 4,
  },
  content: { flex: 1, paddingBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '700', color: colors.gray900, flex: 1 },
  time: { fontSize: 12, color: colors.gray500 },
  message: { fontSize: 14, color: colors.gray700, lineHeight: 20 },
});
