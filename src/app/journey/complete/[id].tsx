import { useAuth } from '@/auth/AuthContext';
import { KeyboardAwareScrollScreen } from '@/components/layout/KeyboardAwareScrollScreen';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';
import { Button } from '@/components/ui';
import { getCompanionFee, subscribeOrder, updateJourneyMilestone } from '@/lib/firebase/orders';
import { getNextMilestone, JOURNEY_MILESTONES } from '@/lib/journey';
import { borderRadius, colors, spacing } from '@/lib/theme';
import type { CompanionOrder } from '@/lib/types/order';
import { Ionicons } from '@expo/vector-icons';
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

export default function JourneyCompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
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

  const isComplete = order.journeyStatus === 'handover_complete';
  const nextMilestone = getNextMilestone(order.journeyStatus);
  const companionFee = getCompanionFee(order);
  const currentIndex = JOURNEY_MILESTONES.findIndex((m) => m.status === order.journeyStatus);
  const completedCount = currentIndex >= 0 ? currentIndex + 1 : 0;

  const handleMarkDone = async () => {
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

      if (nextMilestone.status === 'handover_complete') {
        return;
      }

      Alert.alert('Update saved', `${nextMilestone.label} recorded successfully.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update journey';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    router.replace('/(drawer)/(tabs)' as never);
  };

  return (
    <KeyboardAwareScrollScreen
        style={styles.screen}
        contentContainerStyle={styles.container}
        bottomInset={spacing.xxl}
      >
        {isComplete ? (
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={56} color={colors.ctaGreen} />
            </View>
            <Text style={styles.successTitle}>Journey completed!</Text>
            <Text style={styles.successSub}>
              Parent has been safely handed over. Thank you for your care and dedication.
            </Text>
            {companionFee > 0 ? (
              <View style={styles.feeBadge}>
                <Text style={styles.feeLabel}>Companion fee earned</Text>
                <Text style={styles.feeValue}>₹{companionFee}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.progressCard}>
            <Text style={styles.progressEyebrow}>Journey in progress</Text>
            <Text style={styles.progressTitle}>{order.bookingId}</Text>
            <Text style={styles.progressRoute}>
              {order.origin || 'Pickup'} → {order.destination || order.userAddress}
            </Text>
            <Text style={styles.progressMeta}>
              {completedCount} of {JOURNEY_MILESTONES.length} milestones completed
            </Text>
          </View>
        )}

        {nextMilestone && !isComplete ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionEyebrow}>Next step</Text>
            <Text style={styles.actionTitle}>{nextMilestone.label}</Text>
            <Text style={styles.actionMessage}>{nextMilestone.message}</Text>
            <Button onPress={handleMarkDone} loading={loading} size="lg" variant="green" style={styles.actionBtn}>
              {nextMilestone.status === 'handover_complete' ? 'Mark journey as done' : `Mark: ${nextMilestone.label}`}
            </Button>
          </View>
        ) : null}

        <Text style={styles.timelineTitle}>Journey timeline</Text>
        <JourneyTimeline updates={order.journeyUpdates ?? []} />

        {isComplete ? (
          <Button onPress={goHome} size="lg" style={styles.homeBtn}>
            Back to Home
          </Button>
        ) : null}
      </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screen: { backgroundColor: colors.gray50 },
  container: { padding: spacing.lg, flexGrow: 1 },
  successCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ecfdf3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 15,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  feeBadge: {
    marginTop: spacing.lg,
    backgroundColor: '#f0fdf4',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  feeLabel: { fontSize: 12, color: colors.gray500, fontWeight: '600' },
  feeValue: { fontSize: 28, fontWeight: '800', color: colors.ctaGreenDark, marginTop: 4 },
  progressCard: {
    backgroundColor: colors.careBlueLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBlueLight,
  },
  progressEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.headerBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  progressTitle: { fontSize: 20, fontWeight: '800', color: colors.gray900, marginTop: spacing.xs },
  progressRoute: { fontSize: 14, color: colors.gray700, marginTop: spacing.sm, lineHeight: 20 },
  progressMeta: { fontSize: 13, color: colors.gray500, marginTop: spacing.sm },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  actionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ctaGreenDark,
    textTransform: 'uppercase',
  },
  actionTitle: { fontSize: 22, fontWeight: '800', color: colors.gray900, marginTop: spacing.xs },
  actionMessage: { fontSize: 14, color: colors.gray700, marginTop: spacing.sm, lineHeight: 20 },
  actionBtn: { marginTop: spacing.lg },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: colors.gray900, marginBottom: spacing.sm },
  homeBtn: { marginTop: spacing.xl },
});
