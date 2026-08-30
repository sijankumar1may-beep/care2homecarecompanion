import { useAuth } from '@/auth/AuthContext';
import { brandAssets } from '@/lib/assets';
import { navigateFromDrawer } from '@/lib/navigation';
import { colors } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const profilePlaceholder = require('@/assets/images/profile.png');

const DRAWER_SECTIONS = [
  {
    title: 'Account',
    routes: [
      { path: '/(drawer)/(tabs)/profile', label: 'Profile', icon: 'person-outline' },
      { path: '/editprofile', label: 'Edit Profile', icon: 'create-outline' },
      { path: '/earnings', label: 'Earnings', icon: 'wallet-outline' },
    ],
  },
  {
    title: 'Work',
    routes: [
      { path: '/(drawer)/(tabs)/jobs', label: 'Available Jobs', icon: 'briefcase-outline' },
      { path: '/(drawer)/(tabs)', label: 'Home Dashboard', icon: 'home-outline' },
    ],
  },
  {
    title: 'Support',
    routes: [
      { path: '/support', label: 'WhatsApp & Call Ops', icon: 'headset-outline' },
    ],
  },
] as const;

export default function CustomDrawerContent(props: { navigation: { closeDrawer: () => void } }) {
  const { user, profile } = useAuth();
  const { navigation } = props;

  const closeDrawer = () => navigation.closeDrawer();

  const handleNavigate = (path: string) => {
    if (path === '/logout') {
      Alert.alert('Logout', 'Do you want to log out?', [
        { text: 'Yes', onPress: () => signOut(getAuth()) },
        { text: 'No', style: 'cancel' },
      ]);
      return;
    }
    navigateFromDrawer(path, closeDrawer);
  };

  return (
    <DrawerContentScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Image source={brandAssets.logo} style={styles.logo} contentFit="contain" />
        <Image
          source={profile?.photoUrl ? { uri: profile.photoUrl } : profilePlaceholder}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile?.name || 'Companion'}</Text>
        <Text style={styles.userText}>{user?.phoneNumber}</Text>
      </View>

      {DRAWER_SECTIONS.map((section) => (
        <View key={section.title}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.routes.map((route) => (
            <Pressable
              key={route.path}
              style={styles.link}
              onPress={() => handleNavigate(route.path)}
            >
              <Ionicons name={route.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.headerBlue} />
              <Text style={styles.label}>{route.label}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      <Pressable style={styles.link} onPress={() => handleNavigate('/logout')}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.label, { color: colors.danger }]}>Logout</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 40, paddingBottom: 24 },
  header: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  logo: { width: 140, height: 44, marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.gray900 },
  userText: { color: colors.gray700, fontSize: 13 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.headerBlue,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.careBlueLight,
    marginTop: 8,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 12,
  },
  label: { fontSize: 15, color: colors.gray900, flex: 1 },
});
