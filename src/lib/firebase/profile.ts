import type { CompanionProfile } from '@/lib/types/profile';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export const COMPANION_PROFILE_DOC_SUFFIX = 'Care2homecompanion';
const WRITE_TIMEOUT_MS = 20_000;
const MAX_WRITE_ATTEMPTS = 3;

export function profileDocId(phone: string): string {
  return `${phone.replace(/\D/g, '')}${COMPANION_PROFILE_DOC_SUFFIX}`;
}

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function companionProfileRef(phone: string) {
  return firestore().collection('Profiles').doc(profileDocId(phone));
}

function mapCompanionProfile(data: Record<string, unknown> | undefined): CompanionProfile | null {
  if (!data || data.role !== 'Companion') return null;
  return data as CompanionProfile;
}

const TRANSIENT_FIRESTORE_CODES = new Set([
  'firestore/unavailable',
  'firestore/deadline-exceeded',
  'firestore/aborted',
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFirebaseErrorCode(error: unknown): string | undefined {
  const code = (error as { code?: string }).code;
  if (code) return code;
  if (error instanceof Error) {
    const match = error.message.match(/\[(firestore\/[^\]]+)\]/);
    if (match) return match[1];
    if (error.message.toLowerCase().includes('timed out')) {
      return 'firestore/deadline-exceeded';
    }
  }
  return undefined;
}

function isTransientFirestoreError(error: unknown): boolean {
  const code = getFirebaseErrorCode(error);
  return code !== undefined && TRANSIENT_FIRESTORE_CODES.has(code);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    sleep(ms).then(() => {
      throw Object.assign(new Error(message), { code: 'firestore/deadline-exceeded' });
    }),
  ]);
}

async function writeProfileDoc(
  docRef: FirebaseFirestoreTypes.DocumentReference,
  payload: Record<string, unknown>,
  action: 'save' | 'update',
): Promise<void> {
  await firestore().enableNetwork();

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    try {
      await docRef.set(payload, { merge: true });
      await withTimeout(
        firestore().waitForPendingWrites(),
        WRITE_TIMEOUT_MS,
        'Save timed out. Please check your internet connection and try again.',
      );
      console.log(`Profile ${action} complete: Profiles/${docRef.id}`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`Profile ${action} attempt ${attempt + 1} failed`, error);
      if (!isTransientFirestoreError(error) || attempt === MAX_WRITE_ATTEMPTS - 1) {
        break;
      }
      await sleep(1000 * (attempt + 1));
    }
  }

  const verb = action === 'save' ? 'save' : 'update';
  throw new Error(getFirebaseErrorMessage(lastError, `Unable to ${verb} profile in Firestore.`));
}

export async function getCompanionProfile(phone: string): Promise<CompanionProfile | null> {
  const docRef = companionProfileRef(phone);

  try {
    const serverSnapshot = await docRef.get({ source: 'server' });
    if (!serverSnapshot.exists()) return null;
    return mapCompanionProfile(serverSnapshot.data() as Record<string, unknown>);
  } catch {
    const cacheSnapshot = await docRef.get({ source: 'cache' });
    if (!cacheSnapshot.exists()) return null;
    return mapCompanionProfile(cacheSnapshot.data() as Record<string, unknown>);
  }
}

export function subscribeCompanionProfile(
  phone: string,
  onChange: (profile: CompanionProfile | null) => void,
) {
  let serverConfirmed = false;

  return companionProfileRef(phone).onSnapshot(
    { includeMetadataChanges: true },
    (snapshot) => {
      const fromServer = !snapshot.metadata.fromCache;
      const hasPendingWrites = snapshot.metadata.hasPendingWrites;

      if (fromServer) {
        serverConfirmed = true;
      }

      if (!fromServer && !serverConfirmed) {
        return;
      }

      if (hasPendingWrites) {
        return;
      }

      onChange(
        snapshot.exists()
          ? mapCompanionProfile(snapshot.data() as Record<string, unknown>)
          : null,
      );
    },
    (error) => {
      console.warn('subscribeCompanionProfile failed', error);
      serverConfirmed = false;
      onChange(null);
    },
  );
}

export async function createCompanionProfile(
  phone: string,
  profile: Omit<CompanionProfile, 'role' | 'completedJourneys' | 'isOnline'>,
): Promise<void> {
  const docId = profileDocId(phone);
  const payload = stripUndefined({
    ...profile,
    phone,
    profileDocId: docId,
    role: 'Companion',
    isOnline: true,
    completedJourneys: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  await writeProfileDoc(companionProfileRef(phone), payload, 'save');
}

export async function updateCompanionProfile(
  phone: string,
  updates: Partial<CompanionProfile>,
): Promise<void> {
  const payload = stripUndefined({
    ...updates,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  if (Object.keys(payload).length === 0) return;

  await writeProfileDoc(companionProfileRef(phone), payload, 'update');
}

export async function setCompanionOnline(phone: string, isOnline: boolean): Promise<void> {
  await updateCompanionProfile(phone, { isOnline });
}

export async function incrementCompletedJourneys(phone: string): Promise<void> {
  const docRef = companionProfileRef(phone);
  await writeProfileDoc(
    docRef,
    {
      completedJourneys: firestore.FieldValue.increment(1),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    'update',
  );
}

export function getFirebaseErrorMessage(error: unknown, fallback: string): string {
  const code = getFirebaseErrorCode(error);
  if (code === 'firestore/permission-denied') {
    return 'Permission denied. Check Firestore security rules for Profiles writes.';
  }
  if (code === 'firestore/unavailable' || code === 'firestore/deadline-exceeded') {
    return 'Could not reach Firestore. Check your internet connection and try again.';
  }
  if (error instanceof Error && error.message && !error.message.startsWith('[firestore/')) {
    return error.message;
  }
  return fallback;
}
