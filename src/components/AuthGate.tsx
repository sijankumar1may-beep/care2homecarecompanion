import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/lib/theme';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (inAuthGroup) {
      router.replace('/(drawer)/(tabs)');
    }
  }, [user, loading, inAuthGroup, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.careBlueLight,
        }}
      >
        <ActivityIndicator size="large" color={colors.headerBlue} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBlue },
        headerTintColor: colors.white,
        animation: 'simple_push',
        headerBackVisible: true,
      }}
    >
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="job/[id]" options={{ headerTitle: 'Order Details' }} />
      <Stack.Screen name="journey" options={{ headerShown: false }} />
      <Stack.Screen name="editprofile" options={{ headerTitle: 'Edit Profile' }} />
      <Stack.Screen name="earnings" options={{ headerTitle: 'Earnings' }} />
      <Stack.Screen name="support" options={{ headerTitle: 'Support' }} />
    </Stack>
  );
}
