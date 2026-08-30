import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { OtpInput } from '@/components/auth/OtpInput';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { StepIndicator } from '@/components/auth/StepIndicator';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/lib/theme';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirm, setConfirm] = useState<{ confirm: (code: string) => Promise<unknown> } | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setStatus({ type: 'error', text: 'Please enter your phone number' });
      return;
    }

    let formattedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.startsWith('0')
        ? `+91${formattedPhone.substring(1)}`
        : `+91${formattedPhone}`;
    }

    if (formattedPhone.length < 12 || formattedPhone.length > 15) {
      setStatus({ type: 'error', text: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const confirmation = await signInWithPhoneNumber(getAuth(), formattedPhone);
      setConfirm(confirmation);
      setStatus({ type: 'success', text: `Verification code sent to ${formattedPhone}` });
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      let errorMessage = 'Failed to send verification code';
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please enter a valid number.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later or contact support.';
      } else if (
        err.code === 'auth/missing-client-identifier' ||
        err.message?.includes('missing-client-identifier')
      ) {
        errorMessage =
          'Firebase cannot verify this app. Add SHA-1 and SHA-256 for com.care2home.companion in Firebase Console (not just com.care2home). Run: npm run android:sha';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setStatus({ type: 'error', text: errorMessage });
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setStatus({ type: 'error', text: 'Please enter the verification code' });
      return;
    }
    if (!confirm) {
      setStatus({ type: 'error', text: 'Please send verification code first' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      await confirm.confirm(code);
      setStatus({ type: 'success', text: 'Login successful!' });
    } catch {
      setStatus({ type: 'error', text: 'Invalid verification code. Please try again.' });
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Care2Home Companion"
      subtitle="Sign in to manage journeys and assist families"
    >
      <StepIndicator currentStep={confirm ? 2 : 1} />

      <PhoneInput value={phoneNumber} onChangeText={setPhoneNumber} disabled={!!confirm} />

      {confirm ? <OtpInput value={code} onChange={setCode} /> : null}

      {status ? (
        <View
          style={[
            styles.statusBox,
            status.type === 'success' ? styles.statusSuccess : styles.statusError,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              status.type === 'success' ? styles.statusTextSuccess : styles.statusTextError,
            ]}
          >
            {status.text}
          </Text>
        </View>
      ) : null}

      <Button
        onPress={confirm ? handleVerifyCode : handleSendCode}
        loading={loading}
        size="lg"
        style={styles.primaryButton}
      >
        {confirm ? 'Verify Code' : 'Send Verification Code'}
      </Button>

      {confirm ? (
        <Button
          variant="outline"
          onPress={() => {
            setConfirm(null);
            setCode('');
            setStatus(null);
          }}
          size="md"
          style={styles.secondaryButton}
        >
          Change phone number
        </Button>
      ) : null}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  primaryButton: { marginTop: spacing.sm },
  secondaryButton: { marginTop: spacing.md },
  statusBox: { padding: spacing.md, borderRadius: 8, marginBottom: spacing.md },
  statusSuccess: { backgroundColor: '#dcfce7' },
  statusError: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 14, textAlign: 'center' },
  statusTextSuccess: { color: colors.ctaGreenDark },
  statusTextError: { color: colors.danger },
});
