import { MIN_COMPANION_HOURLY_RATE_INR } from '@/lib/constants/companion';
import type { CompanionProfile } from '@/lib/types/profile';
import { borderRadius, colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface HomeHeroProps {
  profile: CompanionProfile | null;
  updatingOnline: boolean;
  onToggleOnline: (value: boolean) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeHero({ profile, updatingOnline, onToggleOnline }: HomeHeroProps) {
  const isOnline = profile?.isOnline ?? false;
  const firstName = profile?.name?.split(' ')[0] || 'Companion';
  const initial = firstName.charAt(0).toUpperCase();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isOnline) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.35, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1,
        false,
      );
      return;
    }
    pulse.value = withTiming(1, { duration: 200 });
  }, [isOnline, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingEyebrow}>{getGreeting()}</Text>
          <Text style={styles.greeting}>{firstName}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>

      <View style={styles.earningsChip}>
        <Ionicons name="trending-up" size={14} color={colors.ctaGreenDark} />
        <Text style={styles.earningsChipText}>
          Earn from ₹{MIN_COMPANION_HOURLY_RATE_INR}/hour minimum
        </Text>
      </View>

      <Text style={styles.subGreeting}>
        Help families travel safely — no vehicle needed, just your presence
      </Text>

      <View style={[styles.onlineCard, isOnline && styles.onlineCardActive]}>
        <View style={styles.onlineLeft}>
          <View style={styles.statusDotWrap}>
            {isOnline ? <Animated.View style={[styles.statusPulse, pulseStyle]} /> : null}
            <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
          </View>
          <View>
            <Text style={styles.onlineTitle}>{isOnline ? 'You are online' : 'You are offline'}</Text>
            <Text style={styles.onlineSub}>
              {isOnline ? 'Ready to receive journey requests' : 'Go online to accept new jobs'}
            </Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={onToggleOnline}
          disabled={updatingOnline || !profile}
          trackColor={{ false: 'rgba(255,255,255,0.25)', true: colors.ctaGreen }}
          thumbColor={colors.white}
          ios_backgroundColor="rgba(255,255,255,0.25)"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.headerBlue,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.headerBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  decorCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircleSmall: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  greetingEyebrow: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  earningsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  earningsChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ctaGreenDark,
  },
  subGreeting: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: spacing.lg,
  },
  onlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  onlineCardActive: {
    backgroundColor: 'rgba(41,163,92,0.2)',
    borderColor: 'rgba(41,163,92,0.35)',
  },
  onlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.sm,
  },
  statusDotWrap: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotOnline: {
    backgroundColor: '#4ade80',
  },
  statusDotOffline: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  statusPulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ade80',
  },
  onlineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  onlineSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
});
