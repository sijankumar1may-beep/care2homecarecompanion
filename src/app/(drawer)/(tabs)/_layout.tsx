import { colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useNavigation, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, BackHandler, Linking, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ROUTES = ['jobs', 'onboarding', 'profile'] as const;

function HeaderLeft() {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => (navigation as { openDrawer?: () => void }).openDrawer?.()}
      style={{ marginHorizontal: 10, padding: 6 }}
    >
      <Ionicons name="person-circle-sharp" size={35} color="#fff" />
    </Pressable>
  );
}

function HeaderRight() {
  return (
    <Pressable
      onPress={() => Linking.openURL('tel:+919910646415')}
      style={{ marginHorizontal: 10, padding: 6 }}
    >
      <Ionicons name="help-circle-outline" size={26} color="#fff" />
    </Pressable>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = Math.max(insets.bottom, spacing.sm);

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.headerBlue },
      headerTintColor: colors.white,
      tabBarStyle: {
        backgroundColor: colors.headerBlue,
        paddingBottom: tabBarBottomInset,
        height: 56 + tabBarBottomInset,
      },
      tabBarActiveTintColor: colors.white,
      tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
      headerLeft: () => <HeaderLeft />,
      headerRight: () => <HeaderRight />,
    }),
    [tabBarBottomInset],
  );

  useEffect(() => {
    const backAction = () => {
      const lastSegment = segments[segments.length - 1];
      const isOtherTab = TAB_ROUTES.includes(lastSegment as (typeof TAB_ROUTES)[number]);

      if (isOtherTab) {
        router.navigate('/(drawer)/(tabs)');
        return true;
      }

      Alert.alert('Hold on!', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [segments, router]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          headerTitle: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          tabBarLabel: 'Orders',
          headerTitle: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          tabBarLabel: 'Register',
          headerTitle: 'Register',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
