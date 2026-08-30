import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type JourneyStatus =
  | 'unassigned'
  | 'accepted'
  | 'met_parent'
  | 'luggage_collected'
  | 'in_vehicle'
  | 'approaching_home'
  | 'handover_complete';

export type JourneyUpdate = {
  status: JourneyStatus;
  message: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue;
  location?: { lat: number; lng: number };
};

export type PriceRange = { min: number; max: number };

export type OrderPricingSnapshot = {
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

export type CompanionOrder = {
  id: string;
  bookingId: string;
  phone: string;
  email?: string;
  userAddress: string;
  loggedUserId?: string;
  ImageUrl?: string;
  origin?: string;
  destination?: string;
  vehicleType?: string;
  doj?: string;
  pricingSnapshot?: OrderPricingSnapshot | null;
  companionFeeEarned?: number;
  status: string;
  companionId?: string | null;
  assignedAt?: FirebaseFirestoreTypes.Timestamp | null;
  parentName?: string;
  parentPhone?: string;
  scheduledAt?: FirebaseFirestoreTypes.Timestamp;
  journeyStatus?: JourneyStatus;
  journeyUpdates?: JourneyUpdate[];
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
  completedAt?: FirebaseFirestoreTypes.Timestamp;
};

export type JobsTab = 'available' | 'mine' | 'completed';
