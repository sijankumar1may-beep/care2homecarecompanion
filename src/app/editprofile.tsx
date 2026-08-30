import { useAuth } from '@/auth/AuthContext';
import { KeyboardAwareScrollScreen } from '@/components/layout/KeyboardAwareScrollScreen';
import { Button, Input, TextArea } from '@/components/ui';
import { getFirebaseErrorMessage, updateCompanionProfile } from '@/lib/firebase/profile';
import { colors, spacing } from '@/lib/theme';
import Storage from '@react-native-firebase/storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function EditProfileScreen() {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (!user?.phoneNumber) return;
    if (!name.trim() || !address.trim()) {
      Alert.alert('Missing info', 'Name and address are required');
      return;
    }

    setLoading(true);
    try {
      await updateCompanionProfile(user.phoneNumber, {
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
          photoWarning = ' Profile saved, but photo upload failed. Please try again.';
        }
      }

      Alert.alert('Saved', `Your profile has been updated.${photoWarning}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: unknown) {
      Alert.alert('Error', getFirebaseErrorMessage(error, 'Unable to save profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollScreen
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardAware
      bottomInset={spacing.xxl}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Edit Profile</Text>
        <Pressable style={styles.avatarWrap} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>+</Text>
            </View>
          )}
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </Pressable>

        <Input label="Full name" value={name} onChangeText={setName} />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextArea label="Address" value={address} onChangeText={setAddress} />
        <Input
          label="Emergency contact"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          keyboardType="phone-pad"
        />
        <Text style={styles.readonly}>Phone: {user?.phoneNumber}</Text>

        <Button onPress={handleSave} loading={loading} size="lg" style={styles.saveBtn}>
          Save Changes
        </Button>
      </View>
    </KeyboardAwareScrollScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.gray50 },
  container: { padding: spacing.lg, flexGrow: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: spacing.lg },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.careBlueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36, color: colors.primaryBlue },
  avatarHint: { marginTop: spacing.sm, color: colors.primaryBlue, fontWeight: '600' },
  readonly: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg },
  saveBtn: { marginTop: spacing.md },
});
