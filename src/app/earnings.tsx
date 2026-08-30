import { useAuth } from '@/auth/AuthContext';
import { getCompanionFee, subscribeCompletedOrders } from '@/lib/firebase/orders';
import { getOrderEarningsDateMs } from '@/lib/pricing/companionFee';
import { useContentBottomPadding } from '@/hooks/useContentBottomPadding';
import { colors, spacing } from '@/lib/theme';
import type { CompanionOrder } from '@/lib/types/order';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function EarningsScreen() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<CompanionOrder[]>([]);
  const listBottomPadding = useContentBottomPadding();

  useEffect(() => {
    if (!user?.phoneNumber) return;
    return subscribeCompletedOrders(user.phoneNumber, setCompleted);
  }, [user?.phoneNumber]);

  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return completed
      .filter((order) => {
        const ms = getOrderEarningsDateMs(order);
        return ms >= monthStart;
      })
      .reduce((sum, order) => sum + getCompanionFee(order), 0);
  }, [completed]);

  const allTimeTotal = useMemo(
    () => completed.reduce((sum, order) => sum + getCompanionFee(order), 0),
    [completed],
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This month</Text>
          <Text style={styles.summaryValue}>₹{monthlyTotal}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>All time</Text>
          <Text style={styles.summaryValue}>₹{allTimeTotal}</Text>
        </View>
      </View>

      <FlatList
        data={completed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPadding }]}
        ListEmptyComponent={
          <Text style={styles.empty}>Completed journeys will appear here with companion fees.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.bookingId}>{item.bookingId}</Text>
              <Text style={styles.fee}>₹{getCompanionFee(item)}</Text>
            </View>
            <Text style={styles.route} numberOfLines={2}>
              {item.origin || 'Pickup'} → {item.destination || item.userAddress}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  summaryRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  summaryLabel: { fontSize: 13, color: colors.gray500 },
  summaryValue: { fontSize: 24, fontWeight: '700', color: colors.headerBlue, marginTop: 4 },
  list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 },
  empty: { textAlign: 'center', color: colors.gray500, padding: spacing.xxxl, lineHeight: 22 },
  item: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  bookingId: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  fee: { fontSize: 15, fontWeight: '700', color: colors.ctaGreen },
  route: { fontSize: 14, color: colors.gray700, lineHeight: 20 },
});
