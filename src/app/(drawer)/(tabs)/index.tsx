import { useAuth } from '@/auth/AuthContext';
import { CompanionBenefits } from '@/components/home/CompanionBenefits';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeStatsRow } from '@/components/home/HomeStatsRow';
import { QuickActions } from '@/components/home/QuickActions';
import { JobCard } from '@/components/jobs/JobCard';
import { KeyboardAwareScrollScreen } from '@/components/layout/KeyboardAwareScrollScreen';
import { Button } from '@/components/ui';
import { getCompanionFee, subscribeCompletedOrders, subscribeMyOrders } from '@/lib/firebase/orders';
import { setCompanionOnline } from '@/lib/firebase/profile';
import { borderRadius, colors, spacing } from '@/lib/theme';
import type { CompanionOrder } from '@/lib/types/order';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [myJobs, setMyJobs] = useState<CompanionOrder[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompanionOrder[]>([]);
  const [updatingOnline, setUpdatingOnline] = useState(false);

  useEffect(() => {
    if (!user?.phoneNumber) return;
    return subscribeMyOrders(user.phoneNumber, setMyJobs);
  }, [user?.phoneNumber]);

  useEffect(() => {
    if (!user?.phoneNumber) return;
    return subscribeCompletedOrders(user.phoneNumber, setCompletedJobs);
  }, [user?.phoneNumber]);

  const activeJob = useMemo(
    () => myJobs.find((job) => job.journeyStatus !== 'handover_complete'),
    [myJobs],
  );

  const completedThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return completedJobs.filter((job) => {
      const ms = job.completedAt?.toDate?.().getTime() ?? job.updatedAt?.toDate?.().getTime() ?? 0;
      return ms > weekAgo;
    }).length;
  }, [completedJobs]);

  const totalEarnings = useMemo(
    () => completedJobs.reduce((sum, job) => sum + getCompanionFee(job), 0),
    [completedJobs],
  );

  const toggleOnline = async (value: boolean) => {
    if (!user?.phoneNumber) return;
    setUpdatingOnline(true);
    try {
      await setCompanionOnline(user.phoneNumber, value);
    } finally {
      setUpdatingOnline(false);
    }
  };

  return (
    <View style={styles.screenRoot}>
      <View style={styles.bgTop} />
      <View style={styles.bgAccent} />

      <KeyboardAwareScrollScreen
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <HomeHero
          profile={profile}
          updatingOnline={updatingOnline}
          onToggleOnline={toggleOnline}
        />

        {!profile ? (
          <Animated.View key="register-banner" entering={FadeIn.duration(300).delay(80)}>
            <Pressable
              style={({ pressed }) => [styles.registerBanner, pressed && styles.pressed]}
              onPress={() => router.push('/(drawer)/(tabs)/onboarding' as never)}
            >
              <View style={styles.registerIconWrap}>
                <Ionicons name="clipboard" size={22} color={colors.headerBlue} />
              </View>
              <View style={styles.registerBannerText}>
                <Text style={styles.registerBannerTitle}>Complete your registration</Text>
                <Text style={styles.registerBannerSub}>
                  Set up your profile to start accepting journeys
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.headerBlue} />
            </Pressable>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.duration(380).delay(100)}>
          <CompanionBenefits />
        </Animated.View>

        <HomeStatsRow
          activeCount={activeJob ? 1 : 0}
          completedThisWeek={completedThisWeek}
          totalEarnings={totalEarnings}
        />

        {activeJob ? (
          <Animated.View
            key={`active-job-${activeJob.id}`}
            entering={FadeInUp.duration(350).delay(360)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active journey</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            <JobCard
              order={activeJob}
              onPress={() => router.push(`/journey/${activeJob.id}` as never)}
            />
            <Button
              variant="green"
              onPress={() => router.push(`/journey/${activeJob.id}` as never)}
              style={styles.continueBtn}
            >
              Continue journey
            </Button>
          </Animated.View>
        ) : null}

        <QuickActions hasActiveJob={!!activeJob} />
      </KeyboardAwareScrollScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: colors.careBlueHero,
    opacity: 0.45,
  },
  bgAccent: {
    position: 'absolute',
    top: 80,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.careBlueLight,
    opacity: 0.6,
  },
  screen: {
    backgroundColor: 'transparent',
  },
  container: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  registerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBlueLight,
    shadowColor: colors.headerBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  registerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.careBlueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBannerText: {
    flex: 1,
  },
  registerBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.headerBlue,
  },
  registerBannerSub: {
    fontSize: 13,
    color: colors.gray700,
    marginTop: 2,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef2f2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  continueBtn: {
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
