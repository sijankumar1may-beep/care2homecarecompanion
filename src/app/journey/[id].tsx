import { useAuth } from '@/auth/AuthContext';
import { KeyboardAwareScrollScreen } from '@/components/layout/KeyboardAwareScrollScreen';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';
import { Button } from '@/components/ui';
import { declineOrder, subscribeOrder, updateJourneyMilestone } from '@/lib/firebase/orders';
import { canCompanionDeclineOrder, getNextMilestone, JOURNEY_MILESTONES } from '@/lib/journey';
import { colors, spacing } from '@/lib/theme';
import type { CompanionOrder } from '@/lib/types/order';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

async function getOptionalLocation(): Promise<{ lat: number; lng: number } | undefined> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return undefined;

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    return undefined;
  }
}

export default function JourneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<CompanionOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, setOrder);
  }, [id]);

  useEffect(() => {
    if (!order || !id) return;
    if (order.journeyStatus === 'handover_complete') {
      router.replace(`/journey/complete/${id}` as never);
    }
  }, [order?.journeyStatus, id, router]);

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.headerBlue} />
      </View>
    );
  }

  const nextMilestone = getNextMilestone(order.journeyStatus);
  const isComplete = order.journeyStatus === 'handover_complete';
  const canDecline = canCompanionDeclineOrder(order.journeyStatus);

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
              router.replace('/(drawer)/(tabs)/jobs' as never);
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

  const handleMilestone = async () => {
    if (!nextMilestone || !user?.phoneNumber || !id) return;

    setLoading(true);
    try {
      const location = await getOptionalLocation();

      await updateJourneyMilestone(
        id,
        user.phoneNumber,
        nextMilestone.status,
        nextMilestone.message,
        location,
      );

      if (nextMilestone.status === 'met_parent') {
        router.push(`/journey/complete/${id}` as never);
        return;
      }

      if (nextMilestone.status === 'handover_complete') {
        router.replace(`/journey/complete/${id}` as never);
        return;
      }

      Alert.alert('Milestone saved', `${nextMilestone.label} recorded successfully.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update journey';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (isComplete) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.headerBlue} />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollScreen
      style={styles.screen}
      contentContainerStyle={styles.container}
      bottomInset={spacing.xxl}
    >
      <View style={styles.headerCard}>
        <Text style={styles.bookingId}>{order.bookingId}</Text>
        <Text style={styles.route}>
          {order.origin || 'Pickup'} → {order.destination || order.userAddress}
        </Text>
        <Text style={styles.parent}>Parent: {order.parentPhone || order.phone}</Text>
      </View>

      {nextMilestone ? (
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneTitle}>Next update</Text>
          <Text style={styles.milestoneLabel}>{nextMilestone.label}</Text>
          <Text style={styles.milestoneMessage}>{nextMilestone.message}</Text>
          <Button onPress={handleMilestone} loading={loading} size="lg" style={styles.milestoneBtn}>
            Mark: {nextMilestone.label}
          </Button>
          {canDecline ? (
            <Button
              variant="outline"
              onPress={handleDecline}
              disabled={loading}
              size="lg"
              style={styles.releaseBtn}
            >
              Release Order
            </Button>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.timelineTitle}>Journey timeline</Text>
      <JourneyTimeline updates={order.journeyUpdates ?? []} />

      <View style={styles.allMilestones}>
        <Text style={styles.timelineTitle}>All milestones</Text>
        {JOURNEY_MILESTONES.map((milestone) => (
          <Text key={milestone.status} style={styles.milestoneItem}>
            • {milestone.label}
          </Text>
        ))}
      </View>
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screen: { backgroundColor: colors.gray50 },
  container: { padding: spacing.lg, flexGrow: 1 },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  bookingId: { fontSize: 18, fontWeight: '700', color: colors.gray900 },
  route: { fontSize: 14, color: colors.gray700, marginTop: spacing.sm, lineHeight: 20 },
  parent: { fontSize: 13, color: colors.gray500, marginTop: spacing.sm },
  milestoneCard: {
    backgroundColor: colors.careBlueLight,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBlueLight,
  },
  milestoneTitle: { fontSize: 12, fontWeight: '700', color: colors.headerBlue, textTransform: 'uppercase' },
  milestoneLabel: { fontSize: 20, fontWeight: '700', color: colors.gray900, marginTop: spacing.sm },
  milestoneMessage: { fontSize: 14, color: colors.gray700, marginTop: spacing.sm, lineHeight: 20 },
  milestoneBtn: { marginTop: spacing.lg },
  releaseBtn: { marginTop: spacing.md },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: colors.gray900, marginBottom: spacing.sm },
  allMilestones: { marginTop: spacing.xl },
  milestoneItem: { fontSize: 14, color: colors.gray700, marginBottom: spacing.xs },
});
