import { useAuth } from '@/auth/AuthContext';
import { KeyboardAwareScrollScreen } from '@/components/layout/KeyboardAwareScrollScreen';
import { TrustBadge } from '@/components/ui';
import { colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const profilePlaceholder = require('@/assets/images/profile.png');

export default function ProfileTabScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const menuItems = [
    { label: 'Edit Profile', icon: 'create-outline', path: '/editprofile' },
    { label: 'Earnings', icon: 'wallet-outline', path: '/earnings' },
    { label: 'Support', icon: 'headset-outline', path: '/support' },
  ] as const;

  return (
    <KeyboardAwareScrollScreen style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Image
          source={profile?.photoUrl ? { uri: profile.photoUrl } : profilePlaceholder}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile?.name || 'Companion'}</Text>
        <Text style={styles.phone}>{user?.phoneNumber}</Text>
        <TrustBadge text="Background verified companion" />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.completedJourneys ?? 0}</Text>
            <Text style={styles.statLabel}>Journeys</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.isOnline ? 'Online' : 'Offline'}</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>
      </View>

      {menuItems.map((item) => (
        <Pressable
          key={item.path}
          style={styles.menuItem}
          onPress={() => router.push(item.path as never)}
        >
          <Ionicons name={item.icon} size={22} color={colors.headerBlue} />
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
        </Pressable>
      ))}

      <Pressable
        style={styles.logout}
        onPress={() =>
          Alert.alert('Logout', 'Do you want to log out?', [
            { text: 'Yes', onPress: () => signOut(getAuth()) },
            { text: 'No', style: 'cancel' },
          ])
        }
      >
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.gray50 },
  container: { padding: spacing.lg, flexGrow: 1 },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: spacing.md },
  name: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  phone: { fontSize: 14, color: colors.gray500, marginTop: 4, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.lg },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.headerBlue },
  statLabel: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  menuLabel: { flex: 1, fontSize: 16, color: colors.gray900 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  logoutText: { fontSize: 16, color: colors.danger, fontWeight: '600' },
});
