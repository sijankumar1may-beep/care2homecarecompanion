import { useAuth } from '@/auth/AuthContext';
import { KeyboardAwareScrollScreen } from '@/components/layout/KeyboardAwareScrollScreen';
import { OrderPriceBreakdown } from '@/components/orders/OrderPriceBreakdown';
import { Button } from '@/components/ui';
import { acceptOrder, declineOrder, formatCreatedAt, formatDoj, subscribeOrder } from '@/lib/firebase/orders';
import {
  canCompanionDeclineOrder,
  JOURNEY_STATUS_COLORS,
  JOURNEY_STATUS_LABELS,
} from '@/lib/journey';
import { colors, spacing } from '@/lib/theme';
import type { CompanionOrder } from '@/lib/types/order';
import { buildOpsWhatsAppMessage, getWhatsAppUrl } from '@/lib/whatsapp';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<CompanionOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, setOrder);
  }, [id]);

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.headerBlue} />
      </View>
    );
  }

  const isAvailable = !order.companionId;
  const isMine = order.companionId === user?.phoneNumber;
  const journeyStatus = order.journeyStatus ?? 'unassigned';
  const dojLabel = formatDoj(order.doj);
  const isOnline = profile?.isOnline === true;
  const canAcceptOrder = isAvailable && isOnline && !!profile;

  const handleAccept = async () => {
    if (!user?.phoneNumber || !id) return;

    if (!profile) {
      Alert.alert(
        'Profile required',
        'Complete your companion registration before accepting orders.',
        [{ text: 'Go to Register', onPress: () => router.push('/(drawer)/(tabs)/onboarding' as never) }],
      );
      return;
    }

    if (!profile.isOnline) {
      Alert.alert(
        'Go online first',
        'Turn on your online status from the Home screen to accept orders.',
        [{ text: 'Go to Home', onPress: () => router.push('/(drawer)/(tabs)' as never) }],
      );
      return;
    }

    setLoading(true);
    try {
      await acceptOrder(id, user.phoneNumber);
      Alert.alert('Order accepted', 'You can now start the journey.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to accept order';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (!user?.phoneNumber || !id) return;

    Alert.alert(
      'Release this order?',
      'The order will go back to Available for other companions. You can only do this before starting the journey.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Release order',
          style: 'destructive',
          onPress: async () => {
            const phone = user.phoneNumber;
            if (!phone) return;
            setLoading(true);
            try {
              await declineOrder(id, phone);
              Alert.alert('Order released', 'This order is available for other companions again.');
              router.back();
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Unable to release order';
              Alert.alert('Error', message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const contactOps = () => {
    Linking.openURL(getWhatsAppUrl(buildOpsWhatsAppMessage(order)));
  };

  const callCustomer = () => {
    const phone = order.parentPhone || order.phone;
    Linking.openURL(`tel:${phone.startsWith('+') ? phone : `+91${phone}`}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Order Details' }} />
      <KeyboardAwareScrollScreen
        style={styles.screen}
        contentContainerStyle={styles.container}
        bottomInset={spacing.xxl}
      >
        <View style={styles.header}>
          <Text style={styles.bookingId}>{order.bookingId}</Text>
          <View style={[styles.badge, { backgroundColor: JOURNEY_STATUS_COLORS[journeyStatus] }]}>
            <Text style={styles.badgeText}>{JOURNEY_STATUS_LABELS[journeyStatus]}</Text>
          </View>
        </View>

        {formatCreatedAt(order.createdAt) ? (
          <Text style={styles.meta}>Booked: {formatCreatedAt(order.createdAt)}</Text>
        ) : null}

        <OrderPriceBreakdown pricing={order.pricingSnapshot} />

        {order.ImageUrl ? (
          <Text style={styles.sectionLabel}>Ticket / travel proof</Text>
        ) : null}
        {order.ImageUrl ? (
          <Image source={{ uri: order.ImageUrl }} style={styles.ticket} contentFit="contain" />
        ) : null}

        <Text style={styles.sectionLabel}>Journey details</Text>
        {dojLabel ? <InfoRow icon="calendar" label="Date of journey (DOJ)" value={dojLabel} /> : null}
        {order.origin ? <InfoRow icon="navigate" label="Pickup (origin)" value={order.origin} /> : null}
        {order.destination ? (
          <InfoRow icon="flag" label="Destination" value={order.destination} />
        ) : null}
        {!order.origin && !order.destination && order.userAddress ? (
          <InfoRow icon="location" label="Address" value={order.userAddress} />
        ) : null}

        <Text style={styles.sectionLabel}>Customer contact</Text>
        <InfoRow icon="call" label="Phone" value={order.phone} onPress={callCustomer} />
        {order.parentPhone ? (
          <InfoRow icon="person" label="Parent phone" value={order.parentPhone} onPress={callCustomer} />
        ) : null}
        {order.email ? <InfoRow icon="mail" label="Email" value={order.email} /> : null}
        {order.vehicleType ? (
          <InfoRow
            icon="car"
            label="Vehicle"
            value={order.vehicleType === 'car' ? 'Car' : 'Auto'}
          />
        ) : null}

        <View style={styles.actions}>
          {isAvailable && !canAcceptOrder ? (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline-outline" size={22} color={colors.headerBlue} />
              <View style={styles.offlineBannerText}>
                <Text style={styles.offlineBannerTitle}>
                  {!profile ? 'Complete your profile first' : 'You are offline'}
                </Text>
                <Text style={styles.offlineBannerSub}>
                  {!profile
                    ? 'Finish registration to accept companion orders.'
                    : 'Go online from the Home screen to accept this order.'}
                </Text>
              </View>
            </View>
          ) : null}

          {isAvailable ? (
            <Button onPress={handleAccept} loading={loading} disabled={!canAcceptOrder} size="lg">
              Accept Order
            </Button>
          ) : null}
          {isMine ? (
            <Button onPress={() => router.push(`/journey/${order.id}` as never)} size="lg">
              {journeyStatus === 'accepted' ? 'Start Journey' : 'Continue Journey'}
            </Button>
          ) : null}
          {isMine && canCompanionDeclineOrder(journeyStatus) ? (
            <Button variant="outline" onPress={handleDecline} disabled={loading} size="lg">
              Release Order
            </Button>
          ) : null}
          <Button variant="outline" onPress={contactOps}>
            Contact Ops on WhatsApp
          </Button>
        </View>
      </KeyboardAwareScrollScreen>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.primaryBlue} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress ? styles.link : undefined]}>{value}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screen: { backgroundColor: colors.gray50 },
  container: { padding: spacing.lg, flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bookingId: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: colors.white, fontWeight: '600', fontSize: 12 },
  meta: { color: colors.gray500, marginBottom: spacing.md },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  ticket: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.gray500, marginBottom: 2 },
  infoValue: { fontSize: 15, color: colors.gray900, lineHeight: 21 },
  link: { color: colors.primaryBlue },
  actions: { marginTop: spacing.xl, gap: spacing.md },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.careBlueLight,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBlueLight,
  },
  offlineBannerText: { flex: 1 },
  offlineBannerTitle: { fontSize: 15, fontWeight: '700', color: colors.headerBlue },
  offlineBannerSub: { fontSize: 13, color: colors.gray700, marginTop: 4, lineHeight: 18 },
});
