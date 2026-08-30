import type { CompanionOrder } from '@/lib/types/order';
import { formatCreatedAt, formatDoj } from '@/lib/firebase/orders';
import {
  formatIndianCurrencyRange,
  getCustomerPayableRange,
} from '@/lib/pricing/format';
import { JOURNEY_STATUS_COLORS, JOURNEY_STATUS_LABELS } from '@/lib/journey';
import { colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface JobCardProps {
  order: CompanionOrder;
  onPress: () => void;
}

export function JobCard({ order, onPress }: JobCardProps) {
  const journeyStatus = order.journeyStatus ?? 'unassigned';
  const statusColor = JOURNEY_STATUS_COLORS[journeyStatus] ?? colors.gray500;
  const customerPayable = getCustomerPayableRange(order.pricingSnapshot);
  const dojLabel = formatDoj(order.doj);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.bookingId}>{order.bookingId}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>
            {JOURNEY_STATUS_LABELS[journeyStatus] ?? order.status}
          </Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <Ionicons name="location" size={16} color={colors.primaryBlue} />
        <Text style={styles.routeText} numberOfLines={2}>
          {order.origin || 'Pickup'} → {order.destination || order.userAddress}
        </Text>
      </View>

      <View style={styles.metaRow}>
        {dojLabel ? (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.gray500} />
            <Text style={styles.meta}>DOJ: {dojLabel}</Text>
          </View>
        ) : null}
        {order.vehicleType ? (
          <Text style={styles.meta}>{order.vehicleType === 'car' ? 'Car' : 'Auto'}</Text>
        ) : null}
        {formatCreatedAt(order.createdAt) ? (
          <Text style={styles.meta}>{formatCreatedAt(order.createdAt)}</Text>
        ) : null}
      </View>

      {customerPayable ? (
        <Text style={styles.collectLabel}>
          Collect: {formatIndianCurrencyRange(customerPayable.min, customerPayable.max)}
        </Text>
      ) : null}

      {order.ImageUrl ? (
        <Image source={{ uri: order.ImageUrl }} style={styles.thumb} contentFit="cover" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bookingId: { fontSize: 16, fontWeight: '700', color: colors.gray900 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  routeRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: spacing.sm },
  routeText: { flex: 1, fontSize: 14, color: colors.gray700, lineHeight: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: colors.gray500 },
  collectLabel: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.headerBlue,
  },
  thumb: { marginTop: spacing.md, width: '100%', height: 120, borderRadius: 12 },
});
