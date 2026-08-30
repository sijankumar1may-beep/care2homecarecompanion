import { colors, PHONE_NUMBER, WHATSAPP_NUMBER } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text } from 'react-native';

export function WhatsAppButton({ message = 'Hello, Care2Home Companion app support needed' }: { message?: string }) {
  const openWhatsApp = () => {
    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('WhatsApp not installed'));
  };

  return (
    <Pressable style={[styles.btn, styles.whatsapp]} onPress={openWhatsApp}>
      <Ionicons name="logo-whatsapp" size={20} color={colors.white} />
      <Text style={styles.btnText}>WhatsApp</Text>
    </Pressable>
  );
}

export function CallButton() {
  const openCall = async () => {
    try {
      await Linking.openURL(`tel:${PHONE_NUMBER}`);
    } catch {
      Alert.alert('Unable to call', `Please dial ${PHONE_NUMBER}`);
    }
  };

  return (
    <Pressable style={[styles.btn, styles.call]} onPress={openCall}>
      <Ionicons name="call" size={20} color={colors.white} />
      <Text style={styles.btnText}>Call Now</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  whatsapp: { backgroundColor: '#25D366' },
  call: { backgroundColor: colors.primaryBlue },
  btnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
});
