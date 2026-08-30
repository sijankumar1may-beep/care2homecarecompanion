import { spacing } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom padding for scroll/list content: device safe area + extra spacing. */
export function useContentBottomPadding(extra: number = spacing.xl): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}
