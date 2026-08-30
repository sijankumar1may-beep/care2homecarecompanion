import { KeyboardAwareScrollScreen } from '@/components/layout/KeyboardAwareScrollScreen';
import { CallButton, WhatsAppButton } from '@/components/ui';
import { colors, spacing } from '@/lib/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function SupportScreen() {
  return (
    <KeyboardAwareScrollScreen style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>24/7 Ops Support</Text>
      <Text style={styles.subtitle}>
        Contact Care2Home operations for missed connections, reroutes, or emergencies during a journey.
      </Text>

      <View style={styles.buttonRow}>
        <WhatsAppButton message="Care2Home Companion app — I need ops support" />
        <CallButton />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Safety guidelines</Text>
        <Text style={styles.bullet}>• Stay with the parent until safe handover at home.</Text>
        <Text style={styles.bullet}>• Never drop at the gate and leave.</Text>
        <Text style={styles.bullet}>• Send journey updates at each milestone.</Text>
        <Text style={styles.bullet}>• Escalate medical issues or authorities to ops immediately.</Text>
        <Text style={styles.bullet}>• Help with luggage, stairs, and crowds at the parent&apos;s pace.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emergency handling</Text>
        <Text style={styles.body}>
          If plans change, trains run late, or someone feels unwell, message ops on WhatsApp with the
          booking ID. We coordinate with the family and support clear next steps.
        </Text>
      </View>
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.gray50 },
  container: { padding: spacing.lg, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  subtitle: { fontSize: 14, color: colors.gray700, marginTop: spacing.sm, lineHeight: 20, marginBottom: spacing.xl },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.headerBlue, marginBottom: spacing.md },
  bullet: { fontSize: 14, color: colors.gray700, lineHeight: 22, marginBottom: spacing.xs },
  body: { fontSize: 14, color: colors.gray700, lineHeight: 22 },
});
