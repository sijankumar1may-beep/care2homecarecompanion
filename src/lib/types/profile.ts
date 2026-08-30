import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type CompanionProfile = {
  phone: string;
  name: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  emergencyContact?: string;
  role: 'Companion';
  isOnline: boolean;
  completedJourneys: number;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
};
