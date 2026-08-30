import { colors } from '@/lib/theme';
import { Stack } from 'expo-router';

export default function JourneyLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBlue },
        headerTintColor: colors.white,
        animation: 'simple_push',
        headerBackVisible: true,
      }}
    >
      <Stack.Screen name="[id]" options={{ headerTitle: 'Active Journey' }} />
      <Stack.Screen name="complete/[id]" options={{ headerTitle: 'Complete Journey', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
