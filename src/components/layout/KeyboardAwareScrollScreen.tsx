import { useContentBottomPadding } from '@/hooks/useContentBottomPadding';
import { spacing } from '@/lib/theme';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type KeyboardAwareScrollScreenProps = ScrollViewProps & {
  /** Extra space below safe-area inset (default spacing.xl). */
  bottomInset?: number;
  /** Lift content when the software keyboard is open (forms). */
  keyboardAware?: boolean;
};

export function KeyboardAwareScrollScreen({
  children,
  contentContainerStyle,
  style,
  bottomInset = spacing.xl,
  keyboardAware = false,
  ...scrollProps
}: KeyboardAwareScrollScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = useContentBottomPadding(bottomInset);

  const scrollView = (
    <ScrollView
      {...scrollProps}
      style={[styles.flex, style]}
      contentContainerStyle={[
        styles.grow,
        contentContainerStyle,
        { paddingBottom: bottomPadding },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={keyboardAware}
    >
      {children}
    </ScrollView>
  );

  if (!keyboardAware) {
    return scrollView;
  }

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={insets.top}
      >
        {scrollView}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.flex}>{scrollView}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
});
