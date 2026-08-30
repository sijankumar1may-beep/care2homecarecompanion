import { MIN_COMPANION_HOURLY_RATE_INR } from '@/lib/constants/companion';
import { borderRadius, colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

type BenefitIcon = 'cash' | 'walk';

interface BenefitItem {
  icon: BenefitIcon;
  title: string;
  subtitle: string;
  variant: 'earnings' | 'noVehicle';
}

const BENEFITS: BenefitItem[] = [
  {
    icon: 'cash',
    title: `₹${MIN_COMPANION_HOURLY_RATE_INR}/hr minimum`,
    subtitle: 'Paid for every journey you accompany',
    variant: 'earnings',
  },
  {
    icon: 'walk',
    title: 'No vehicle needed',
    subtitle: 'Just be present — we arrange transport',
    variant: 'noVehicle',
  },
];

export function CompanionBenefits() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Why companions love Care2Home</Text>
      <View style={styles.row}>
        {BENEFITS.map((benefit, index) => {
          const isEarnings = benefit.variant === 'earnings';
          return (
            <Animated.View
              key={benefit.title}
              entering={FadeInRight.duration(350).delay(140 + index * 90)}
              style={[styles.card, isEarnings ? styles.earningsCard : styles.noVehicleCard]}
            >
              <View style={[styles.iconWrap, isEarnings ? styles.earningsIconBg : styles.noVehicleIconBg]}>
                <Ionicons
                  name={benefit.icon}
                  size={24}
                  color={isEarnings ? colors.ctaGreen : colors.headerBlue}
                />
              </View>
              <Text style={[styles.title, isEarnings ? styles.earningsTitle : styles.noVehicleTitle]}>
                {benefit.title}
              </Text>
              <Text style={styles.subtitle}>{benefit.subtitle}</Text>
            </Animated.View>
          );
        })}
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  earningsCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  noVehicleCard: {
    backgroundColor: colors.careBlueLight,
    borderColor: colors.primaryBlueLight,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  earningsIconBg: {
    backgroundColor: '#bbf7d0',
  },
  noVehicleIconBg: {
    backgroundColor: colors.trustBadge,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  earningsTitle: {
    color: colors.ctaGreenDark,
  },
  noVehicleTitle: {
    color: colors.headerBlue,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray700,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
});
