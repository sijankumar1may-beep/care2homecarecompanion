import { getAuth, onAuthStateChanged, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { subscribeCompanionProfile } from '@/lib/firebase/profile';
import type { CompanionProfile } from '@/lib/types/profile';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  profile: CompanionProfile | null;
  profileResolved: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [profileResolved, setProfileResolved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (!nextUser) {
        setProfile(null);
        setProfileResolved(true);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.phoneNumber) {
      setProfile(null);
      setProfileResolved(true);
      return;
    }

    setProfileResolved(false);
    const unsubscribe = subscribeCompanionProfile(user.phoneNumber, (nextProfile) => {
      setProfile(nextProfile);
      setProfileResolved(true);
    });
    return unsubscribe;
  }, [user?.phoneNumber]);

  return (
    <AuthContext.Provider value={{ user, loading, profile, profileResolved }}>
      {children}
    </AuthContext.Provider>
  );
}
