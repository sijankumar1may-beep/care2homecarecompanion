import { MIN_COMPANION_HOURLY_RATE_INR } from '@/lib/constants/companion';
import type { CompanionOrder, OrderPricingSnapshot, PriceRange } from '@/lib/types/order';

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asPriceRange(value: unknown): PriceRange | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const min = asNumber(record.min);
  const max = asNumber(record.max);
  if (min === undefined || max === undefined) return undefined;
  return { min, max };
}

function nestedFee(record: Record<string, unknown>, key: string): number | undefined {
  const nested = record[key];
  if (!nested || typeof nested !== 'object') return undefined;
  return asNumber((nested as Record<string, unknown>).fee ?? (nested as Record<string, unknown>).amount);
}

export function normalizeOrderPricing(raw: unknown): OrderPricingSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;

  const pricing = raw as Record<string, unknown>;
  const careCompanionFee =
    asNumber(pricing.careCompanionFee) ??
    asNumber(pricing.companionFee) ??
    asNumber(pricing.care_companion_fee) ??
    asNumber(pricing.companionPayout) ??
    nestedFee(pricing, 'careCompanion') ??
    nestedFee(pricing, 'companion');

  const careCompanionFeeRange =
    asPriceRange(pricing.careCompanionFeeRange) ??
    asPriceRange(pricing.companionFeeRange) ??
    asPriceRange(pricing.care_companion_fee_range) ??
    asPriceRange(pricing.companionPayoutRange);

  const hasPricing =
    careCompanionFee !== undefined ||
    careCompanionFeeRange !== undefined ||
    asNumber(pricing.transportationFee) !== undefined ||
    asPriceRange(pricing.transportationFeeRange) !== undefined ||
    asNumber(pricing.totalPrice) !== undefined ||
    asPriceRange(pricing.totalPriceRange) !== undefined;

  if (!hasPricing) return null;

  return {
    careCompanionFee,
    careCompanionFeeRange,
    transportationFee: asNumber(pricing.transportationFee),
    transportationFeeRange: asPriceRange(pricing.transportationFeeRange),
    totalPrice: asNumber(pricing.totalPrice),
    totalPriceRange: asPriceRange(pricing.totalPriceRange),
    discountedTotalPriceRange: asPriceRange(pricing.discountedTotalPriceRange),
    discountPercent: asNumber(pricing.discountPercent),
    vehicleType: typeof pricing.vehicleType === 'string' ? pricing.vehicleType : undefined,
    distanceKm: asNumber(pricing.distanceKm),
  };
}

export function resolveCompanionFee(order: Pick<CompanionOrder, 'companionFeeEarned' | 'pricingSnapshot'>): number {
  if (typeof order.companionFeeEarned === 'number' && order.companionFeeEarned > 0) {
    return order.companionFeeEarned;
  }

  const snapshot = order.pricingSnapshot;
  if (snapshot) {
    if (typeof snapshot.careCompanionFee === 'number' && snapshot.careCompanionFee > 0) {
      return snapshot.careCompanionFee;
    }
    if (snapshot.careCompanionFeeRange) {
      const { min, max } = snapshot.careCompanionFeeRange;
      if (min > 0) return min;
      if (max > 0) return max;
    }
  }

  return MIN_COMPANION_HOURLY_RATE_INR;
}

export function getOrderEarningsDateMs(order: CompanionOrder): number {
  const candidates = [order.completedAt, order.updatedAt, order.createdAt];
  for (const value of candidates) {
    if (!value) continue;
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;
    if (typeof (value as { seconds?: number }).seconds === 'number') {
      return (value as { seconds: number }).seconds * 1000;
    }
  }
  return 0;
}
