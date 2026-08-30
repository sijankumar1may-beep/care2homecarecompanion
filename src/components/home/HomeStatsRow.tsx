import { borderRadius, colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface HomeStatsRowProps {
  activeCount: number;
  completedThisWeek: number;
  totalEarnings: number;
}

const STATS = [
  {
    key: 'active',
    label: 'Active',
    icon: 'flash' as const,
    color: colors.primaryBlue,
    bg: colors.careBlueLight,
  },
  {
    key: 'week',
    label: 'This week',
    icon: 'calendar' as const,
    color: colors.headerBlue,
    bg: colors.trustBadge,
  },
  {
    key: 'earnings',
    label: 'Earnings',
    icon: 'wallet' as const,
    color: colors.ctaGreenDark,
    bg: '#ecfdf3',
  },
] as const;

export function HomeStatsRow({ activeCount, completedThisWeek, totalEarnings }: HomeStatsRowProps) {
  const values = [activeCount, completedThisWeek, `₹${totalEarnings}`];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your activity</Text>
      <View style={styles.row}>
        {STATS.map((stat, index) => (
          <Animated.View
            key={stat.key}
            entering={FadeInDown.duration(320).delay(200 + index * 70)}
            style={styles.card}
          >
            <View style={[styles.iconWrap, { backgroundColor: stat.bg }]}>
              <Ionicons name={stat.icon} size={18} color={stat.color} />
            </View>
            <Text style={[styles.value, index === 2 && styles.earningsValue]}>{values[index]}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.headerBlue,
  },
  earningsValue: {
    color: colors.ctaGreenDark,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray500,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
