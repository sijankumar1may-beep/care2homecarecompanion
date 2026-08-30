import {
  formatDistanceKm,
  formatIndianCurrency,
  formatIndianCurrencyRange,
  getCustomerPayableRange,
  getVehicleLabel,
} from '@/lib/pricing/format';
import type { OrderPricingSnapshot } from '@/lib/types/order';
import { colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type OrderPriceBreakdownProps = {
  pricing: OrderPricingSnapshot | null | undefined;
};

export function OrderPriceBreakdown({ pricing }: OrderPriceBreakdownProps) {
  if (!pricing) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>Pricing not available for this order.</Text>
      </View>
    );
  }

  const customerPayable = getCustomerPayableRange(pricing);
  const vehicleLabel = getVehicleLabel(pricing.vehicleType);
  const distanceLabel = formatDistanceKm(pricing.distanceKm);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Payment details</Text>
      <Text style={styles.sectionHint}>
        Amount the customer / family should pay for this journey (as quoted at booking).
      </Text>

      {customerPayable ? (
        <View style={styles.collectCard}>
          {pricing.discountPercent && pricing.totalPriceRange ? (
            <View style={styles.collectMetaRow}>
              <Text style={styles.collectStrikethrough}>
                Quoted:{' '}
                {formatIndianCurrencyRange(
                  pricing.totalPriceRange.min,
                  pricing.totalPriceRange.max,
                )}
              </Text>
              <Text style={styles.collectDiscountBadge}>
                {pricing.discountPercent}% off
              </Text>
            </View>
          ) : null}
          <Text style={styles.collectLabel}>Collect from customer</Text>
          <Text style={styles.collectAmount}>
            {formatIndianCurrencyRange(customerPayable.min, customerPayable.max)}
          </Text>
          <Text style={styles.collectHint}>
            Full journey payment — transportation plus Care Companion service (cash or as agreed
            with ops).
          </Text>
        </View>
      ) : null}

      <View style={styles.breakdownCard}>
        {pricing.transportationFeeRange ? (
          <View style={styles.row}>
            <Ionicons name="car-outline" size={18} color={colors.primaryBlue} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{vehicleLabel} transportation</Text>
              <Text style={styles.rowDesc}>{distanceLabel} km journey</Text>
            </View>
            <Text style={styles.rowPrice}>
              {formatIndianCurrencyRange(
                pricing.transportationFeeRange.min,
                pricing.transportationFeeRange.max,
              )}
            </Text>
          </View>
        ) : pricing.transportationFee ? (
          <View style={styles.row}>
            <Ionicons name="car-outline" size={18} color={colors.primaryBlue} />
            <Text style={styles.rowTitle}>Transportation</Text>
            <Text style={styles.rowPrice}>{formatIndianCurrency(pricing.transportationFee)}</Text>
          </View>
        ) : null}

        {pricing.careCompanionFeeRange ? (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={18} color={colors.ctaGreen} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Care Companion service</Text>
              <Text style={styles.rowDesc}>Companion service (part of customer payment)</Text>
            </View>
            <Text style={styles.rowPrice}>
              {formatIndianCurrencyRange(
                pricing.careCompanionFeeRange.min,
                pricing.careCompanionFeeRange.max,
              )}
            </Text>
          </View>
        ) : pricing.careCompanionFee ? (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={18} color={colors.ctaGreen} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Care Companion service</Text>
              <Text style={styles.rowDesc}>Companion service (part of customer payment)</Text>
            </View>
            <Text style={styles.rowPrice}>{formatIndianCurrency(pricing.careCompanionFee)}</Text>
          </View>
        ) : null}

        {pricing.totalPriceRange && !customerPayable ? (
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={18} color={colors.gray700} />
            <Text style={styles.rowTitle}>Estimated total</Text>
            <Text style={styles.rowPrice}>
              {formatIndianCurrencyRange(pricing.totalPriceRange.min, pricing.totalPriceRange.max)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.finePrint}>
        Confirm final payment with Care2Home ops on WhatsApp if the journey changes (extra stops,
        delays, or vehicle upgrade).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray900, marginBottom: spacing.xs },
  sectionHint: { fontSize: 13, color: colors.gray500, lineHeight: 18, marginBottom: spacing.md },
  collectCard: {
    backgroundColor: colors.headerBlue,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  collectMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  collectStrikethrough: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textDecorationLine: 'line-through',
    flex: 1,
  },
  collectDiscountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  collectLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  collectAmount: { fontSize: 28, fontWeight: '700', color: colors.white, marginTop: 4 },
  collectHint: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: spacing.sm, lineHeight: 17 },
  breakdownCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.gray900 },
  rowDesc: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  rowPrice: { fontSize: 14, fontWeight: '700', color: colors.gray900 },
  finePrint: { fontSize: 12, color: colors.gray500, lineHeight: 18, marginTop: spacing.md },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.lg,
  },
  emptyText: { fontSize: 14, color: colors.gray500, textAlign: 'center' },
});
