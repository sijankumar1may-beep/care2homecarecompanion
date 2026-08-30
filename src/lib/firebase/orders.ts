import { getCompanionProfile, incrementCompletedJourneys } from '@/lib/firebase/profile';
import { normalizeOrderPricing, resolveCompanionFee } from '@/lib/pricing/companionFee';
import type { CompanionOrder, JourneyStatus } from '@/lib/types/order';
import firestore, {
  arrayUnion,
  deleteField,
  serverTimestamp,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

const AVAILABLE_STATUSES = new Set(['pending', 'confirmed', 'active']);

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

type RawJourney = {
  origin?: string;
  destination?: string;
  source?: string;
  doj?: unknown;
};

function companionPhoneVariants(phone: string): string[] {
  const digits = normalizePhone(phone);
  const variants = new Set<string>();
  if (phone) variants.add(phone);
  if (digits) {
    variants.add(digits);
    variants.add(`+${digits}`);
    if (digits.startsWith('91') && digits.length > 10) {
      variants.add(`+${digits}`);
      variants.add(digits.slice(2));
      variants.add(`+91${digits.slice(2)}`);
    }
  }
  return [...variants];
}

function matchesCompanionPhone(storedPhone: string | null | undefined, companionPhone: string): boolean {
  if (!storedPhone) return false;
  return companionPhoneVariants(companionPhone).some(
    (variant) => normalizePhone(variant) === normalizePhone(storedPhone) || variant === storedPhone,
  );
}

export function formatBookingId(docId: string): string {
  return `#CH${docId.slice(0, 6).toUpperCase()}`;
}

function normalizeDoj(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const maybeTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().toISOString();
    }
    if (typeof maybeTimestamp.seconds === 'number') {
      return new Date(maybeTimestamp.seconds * 1000).toISOString();
    }
    if (typeof maybeTimestamp._seconds === 'number') {
      return new Date(maybeTimestamp._seconds * 1000).toISOString();
    }
  }

  const asString = String(value).trim();
  return asString || undefined;
}

function mapOrderDoc(doc: FirebaseFirestoreTypes.DocumentSnapshot): CompanionOrder {
  const data = doc.data() ?? {};
  const journey = (data.journey as RawJourney | undefined) ?? undefined;
  const pricing = normalizeOrderPricing(data.pricingSnapshot ?? data.pricing);

  const origin = (data.origin as string | undefined) ?? journey?.origin;
  const destination = (data.destination as string | undefined) ?? journey?.destination;
  const userAddress =
    (data.userAddress as string | undefined) ??
    (data.address as string | undefined) ??
    destination ??
    '';

  return {
    id: doc.id,
    bookingId: formatBookingId(doc.id),
    phone: (data.contact?.phone as string) ?? (data.phone as string) ?? '',
    email: (data.contact?.email as string) ?? (data.email as string) ?? '',
    userAddress,
    loggedUserId: data.loggedUserId as string | undefined,
    ImageUrl: (data.ImageUrl as string | undefined) ?? (data.ticketImageUrl as string | undefined),
    origin,
    destination,
    vehicleType: (data.vehicleType as string | undefined) ?? pricing?.vehicleType,
    doj: normalizeDoj(data.doj) ?? normalizeDoj(journey?.doj),
    pricingSnapshot: pricing,
    companionFeeEarned:
      typeof data.companionFeeEarned === 'number'
        ? data.companionFeeEarned
        : typeof data.companionFee === 'number'
          ? data.companionFee
          : undefined,
    status: (data.status as string) ?? 'pending',
    companionId: (data.companionId as string | null | undefined) ?? null,
    assignedAt: data.assignedAt ?? null,
    parentName: data.parentName as string | undefined,
    parentPhone: data.parentPhone as string | undefined,
    scheduledAt: data.scheduledAt as CompanionOrder['scheduledAt'],
    journeyStatus: (data.journeyStatus as JourneyStatus | undefined) ?? 'unassigned',
    journeyUpdates: data.journeyUpdates ?? [],
    createdAt: data.createdAt as CompanionOrder['createdAt'],
    updatedAt: data.updatedAt as CompanionOrder['updatedAt'],
    completedAt: data.completedAt as CompanionOrder['completedAt'],
  };
}

function isAvailableOrder(order: CompanionOrder): boolean {
  if (order.companionId) return false;
  if (!AVAILABLE_STATUSES.has(order.status.toLowerCase())) return false;
  if (order.journeyStatus === 'handover_complete') return false;
  return true;
}

/** Unassigned orders from web (`pricing`, `journey`, `ticketImageUrl`) and customer app (`pricingSnapshot`, `ImageUrl`). */
export function subscribeAvailableOrders(onChange: (orders: CompanionOrder[]) => void) {
  return firestore()
    .collection('Orders')
    .where('status', 'in', ['pending', 'confirmed', 'active'])
    .onSnapshot(
      (snapshot) => {
        const orders = snapshot.docs
          .map(mapOrderDoc)
          .filter(isAvailableOrder)
          .sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt));
        onChange(orders);
      },
      (error) => {
        console.warn('subscribeAvailableOrders failed', error);
        onChange([]);
      },
    );
}

export function subscribeMyOrders(
  companionPhone: string,
  onChange: (orders: CompanionOrder[]) => void,
) {
  const variants = companionPhoneVariants(companionPhone);
  const query =
    variants.length > 1
      ? firestore().collection('Orders').where('companionId', 'in', variants.slice(0, 10))
      : firestore().collection('Orders').where('companionId', '==', companionPhone);

  return query.onSnapshot(
      (snapshot) => {
        const orders = snapshot.docs
          .map(mapOrderDoc)
          .filter(
            (order) =>
              matchesCompanionPhone(order.companionId, companionPhone) &&
              order.journeyStatus !== 'handover_complete',
          )
          .sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt));
        onChange(orders);
      },
      (error) => {
        console.warn('subscribeMyOrders failed', error);
        onChange([]);
      },
    );
}

export function subscribeCompletedOrders(
  companionPhone: string,
  onChange: (orders: CompanionOrder[]) => void,
) {
  const variants = companionPhoneVariants(companionPhone);
  const query =
    variants.length > 1
      ? firestore().collection('Orders').where('companionId', 'in', variants.slice(0, 10))
      : firestore().collection('Orders').where('companionId', '==', companionPhone);

  return query.onSnapshot(
      (snapshot) => {
        const orders = snapshot.docs
          .map(mapOrderDoc)
          .filter(
            (order) =>
              matchesCompanionPhone(order.companionId, companionPhone) &&
              (order.journeyStatus === 'handover_complete' ||
                order.status.toLowerCase() === 'completed'),
          )
          .sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt));
        onChange(orders);
      },
      (error) => {
        console.warn('subscribeCompletedOrders failed', error);
        onChange([]);
      },
    );
}

export function subscribeOrder(orderId: string, onChange: (order: CompanionOrder | null) => void) {
  return firestore()
    .collection('Orders')
    .doc(orderId)
    .onSnapshot(
      (doc) => {
        if (!doc.exists) {
          onChange(null);
          return;
        }
        onChange(mapOrderDoc(doc));
      },
      () => onChange(null),
    );
}

export async function acceptOrder(orderId: string, companionPhone: string): Promise<void> {
  const profile = await getCompanionProfile(companionPhone);
  if (!profile) {
    throw new Error('Complete your companion profile before accepting orders');
  }
  if (!profile.isOnline) {
    throw new Error('Go online from the Home screen before accepting orders');
  }

  const ref = firestore().collection('Orders').doc(orderId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error('Order not found');

  const data = snapshot.data();
  if (data?.companionId) throw new Error('This order has already been accepted');

  await ref.update({
    companionId: companionPhone,
    assignedAt: serverTimestamp(),
    journeyStatus: 'accepted',
    status: 'active',
    updatedAt: serverTimestamp(),
  });
}

/** Release an accepted order back to the available pool before journey milestones begin. */
export async function declineOrder(orderId: string, companionPhone: string): Promise<void> {
  const ref = firestore().collection('Orders').doc(orderId);

  await firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error('Order not found');

    const data = snapshot.data();
    if (data?.companionId !== companionPhone) {
      throw new Error('You are not assigned to this order');
    }
    if (data?.journeyStatus !== 'accepted') {
      throw new Error('You can only release an order before the journey starts');
    }

    transaction.update(ref, {
      companionId: deleteField(),
      assignedAt: deleteField(),
      journeyStatus: 'unassigned',
      status: 'pending',
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateJourneyMilestone(
  orderId: string,
  companionPhone: string,
  status: JourneyStatus,
  message: string,
  location?: { lat: number; lng: number },
): Promise<void> {
  const ref = firestore().collection('Orders').doc(orderId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error('Order not found');

  const data = snapshot.data();
  const assignedPhone = data?.companionId as string | undefined;
  if (!assignedPhone || normalizePhone(assignedPhone) !== normalizePhone(companionPhone)) {
    throw new Error('You are not assigned to this order');
  }

  const update: Record<string, unknown> = {
    journeyStatus: status,
    journeyUpdates: arrayUnion({
      status,
      message,
      createdAt: firestore.Timestamp.now(),
      ...(location ? { location } : {}),
    }),
    updatedAt: serverTimestamp(),
  };

  if (status === 'handover_complete') {
    const currentOrder = mapOrderDoc(snapshot);
    const earnedFee = resolveCompanionFee(currentOrder);
    update.status = 'completed';
    update.companionFeeEarned = earnedFee;
    update.completedAt = serverTimestamp();
    await ref.update(update);
    await incrementCompletedJourneys(companionPhone);
    return;
  }

  await ref.update(update);
}

export function getCreatedAtMs(createdAt: CompanionOrder['createdAt']): number {
  if (!createdAt) return 0;
  if (typeof createdAt.toDate === 'function') return createdAt.toDate().getTime();
  if (createdAt instanceof Date) return createdAt.getTime();
  if (typeof createdAt === 'number') return createdAt;
  if (typeof (createdAt as { seconds?: number }).seconds === 'number') {
    return (createdAt as { seconds: number }).seconds * 1000;
  }
  return 0;
}

export function formatCreatedAt(createdAt: CompanionOrder['createdAt']): string | null {
  const ms = getCreatedAtMs(createdAt);
  if (!ms) return null;
  return new Date(ms).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDoj(doj?: string): string | null {
  if (!doj || typeof doj !== 'string') return null;
  const trimmed = doj.trim();
  if (!trimmed) return null;

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return trimmed;
}

export function getCompanionFee(order: CompanionOrder): number {
  return resolveCompanionFee(order);
}
