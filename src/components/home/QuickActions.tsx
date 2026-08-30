import { borderRadius, colors, spacing } from '@/lib/theme';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface QuickActionsProps {
  hasActiveJob: boolean;
}

export function QuickActions({ hasActiveJob }: QuickActionsProps) {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInUp.duration(380).delay(400)} style={styles.section}>
      <Text style={styles.sectionTitle}>Quick actions</Text>

      {!hasActiveJob ? (
        <Pressable
          style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
          onPress={() => router.push('/(drawer)/(tabs)/jobs' as never)}
        >
          <View style={styles.primaryCtaContent}>
            <View style={styles.primaryIconWrap}>
              <Ionicons name="briefcase" size={22} color={colors.white} />
            </View>
            <View style={styles.primaryText}>
              <Text style={styles.primaryTitle}>Browse available orders</Text>
              <Text style={styles.primarySub}>Find journeys near you and start earning</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.9)" />
        </Pressable>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
        onPress={() => router.push('/(drawer)/(tabs)/jobs' as never)}
      >
        <View style={[styles.actionIcon, styles.jobsIcon]}>
          <Ionicons name="list" size={20} color={colors.headerBlue} />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>View all orders</Text>
          <Text style={styles.actionSub}>Available, active, and completed</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
        onPress={() => Linking.openURL(getWhatsAppUrl('Care2Home Companion — need ops support'))}
      >
        <View style={[styles.actionIcon, styles.whatsappIcon]}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Contact ops support</Text>
          <Text style={styles.actionSub}>24/7 WhatsApp help line</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.ctaGreen,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.ctaGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  primaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    flex: 1,
  },
  primaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  primarySub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobsIcon: {
    backgroundColor: colors.careBlueLight,
  },
  whatsappIcon: {
    backgroundColor: '#ecfdf5',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  actionSub: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
