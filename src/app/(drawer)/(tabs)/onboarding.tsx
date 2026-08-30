import { useAuth } from '@/auth/AuthContext';
import { KeyboardAwareScrollScreen } from '@/components/layout/KeyboardAwareScrollScreen';
import { Button, Input, TextArea } from '@/components/ui';
import { createCompanionProfile, getFirebaseErrorMessage, updateCompanionProfile } from '@/lib/firebase/profile';
import { colors, spacing } from '@/lib/theme';
import Storage from '@react-native-firebase/storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingTabScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setEmail(profile.email ?? '');
    setAddress(profile.address ?? '');
    setEmergencyContact(profile.emergencyContact ?? '');
    if (profile.photoUrl) setPhotoUri(profile.photoUrl);
  }, [profile]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo access');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user?.phoneNumber) return;
    if (!name.trim() || !address.trim()) {
      Alert.alert('Missing info', 'Please enter your name and address');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms required', 'Please agree to companion terms to continue');
      return;
    }

    setLoading(true);
    try {
      await createCompanionProfile(user.phoneNumber, {
        phone: user.phoneNumber,
        name: name.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        emergencyContact: emergencyContact.trim() || undefined,
      });

      let photoWarning = '';
      if (photoUri && !photoUri.startsWith('http')) {
        try {
          const fileName = `companions/${user.phoneNumber.replace(/\D/g, '')}/profile.jpg`;
          const ref = Storage().ref(fileName);
          await ref.putFile(photoUri);
          const photoUrl = await ref.getDownloadURL();
          await updateCompanionProfile(user.phoneNumber, { photoUrl });
        } catch (photoError: unknown) {
          console.warn('Profile photo upload failed', photoError);
          photoWarning =
            ' Profile saved, but photo upload failed. You can add a photo later from Edit Profile.';
        }
      } else if (photoUri?.startsWith('http')) {
        await updateCompanionProfile(user.phoneNumber, { photoUrl: photoUri });
      }

      setRegistrationComplete(true);
      Alert.alert('Registration complete', `Your companion profile is ready.${photoWarning}`, [
        { text: 'Go to Home', onPress: () => router.navigate('/(drawer)/(tabs)') },
      ]);
    } catch (error: unknown) {
      const message = getFirebaseErrorMessage(error, 'Unable to save profile');
      Alert.alert('Registration failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (profile || registrationComplete) {
    return (
      <View style={[styles.completeContainer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.completeTitle}>You&apos;re registered</Text>
        <Text style={styles.completeText}>
          Your companion profile is active. You can accept jobs from the Jobs tab.
        </Text>
        <Button onPress={() => router.navigate('/(drawer)/(tabs)')}>Back to Home</Button>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollScreen
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardAware
      bottomInset={spacing.xxl}
    >
      <Text style={styles.title}>Register as Companion</Text>
      <Text style={styles.subtitle}>Complete your profile to start accepting journeys</Text>

      <Pressable style={styles.avatarWrap} onPress={pickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>+</Text>
          </View>
        )}
        <Text style={styles.avatarHint}>Add profile photo (optional)</Text>
      </Pressable>

      <Input label="Full name *" value={name} onChangeText={setName} placeholder="Your full name" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@email.com"
      />
      <TextArea
        label="Home / base address *"
        value={address}
        onChangeText={setAddress}
        placeholder="Where you are usually based"
      />
      <Input
        label="Emergency contact"
        value={emergencyContact}
        onChangeText={setEmergencyContact}
        keyboardType="phone-pad"
        placeholder="Alternate phone number"
      />

      <View style={styles.termsRow}>
        <Switch value={agreed} onValueChange={setAgreed} trackColor={{ true: colors.primaryBlue }} />
        <Text style={styles.termsText}>
          I agree to Care2Home companion terms and will escort parents till they are safely home.
        </Text>
      </View>

      <Button onPress={handleSubmit} loading={loading} size="lg">
        Complete Registration
      </Button>
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.gray50 },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  completeContainer: {
    flex: 1,
    backgroundColor: colors.gray50,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.headerBlue,
    marginBottom: spacing.sm,
  },
  completeText: {
    fontSize: 15,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.headerBlue,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray700,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryBlueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36, color: colors.primaryBlue },
  avatarHint: { marginTop: spacing.sm, color: colors.primaryBlue, fontWeight: '600' },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  termsText: { flex: 1, fontSize: 13, color: colors.gray700, lineHeight: 18 },
});
