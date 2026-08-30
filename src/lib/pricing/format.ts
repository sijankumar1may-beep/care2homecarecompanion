export type PriceRange = { min: number; max: number };

export type OrderPricing = {
  careCompanionFee?: number;
  careCompanionFeeRange?: PriceRange;
  transportationFee?: number;
  transportationFeeRange?: PriceRange;
  totalPrice?: number;
  totalPriceRange?: PriceRange;
  discountedTotalPriceRange?: PriceRange;
  discountPercent?: number;
  vehicleType?: string;
  distanceKm?: number;
};

export function formatIndianCurrency(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '₹0';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatIndianCurrencyRange(min: number, max: number): string {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return '₹0';
  const roundedMin = Math.round(min);
  const roundedMax = Math.round(max);
  if (roundedMin === roundedMax) return formatIndianCurrency(roundedMin);
  return `${formatIndianCurrency(roundedMin)} – ${formatIndianCurrency(roundedMax)}`;
}

export function formatDistanceKm(distanceKm: number | undefined): string {
  if (!distanceKm || !Number.isFinite(distanceKm)) return '—';
  const rounded = Math.round(distanceKm * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function getVehicleLabel(vehicleType?: string): string {
  return vehicleType === 'auto' ? 'Auto' : 'Car';
}

export function getCustomerPayableRange(pricing: OrderPricing | null | undefined): PriceRange | null {
  if (!pricing) return null;
  if (pricing.discountedTotalPriceRange) return pricing.discountedTotalPriceRange;
  if (pricing.totalPriceRange) return pricing.totalPriceRange;
  if (typeof pricing.totalPrice === 'number') {
    return { min: pricing.totalPrice, max: pricing.totalPrice };
  }
  return null;
}
