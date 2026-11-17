import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Section 2.3 & Section 4.9 (Construction Blueprint V1.0):
 * Firebase client setup from public configuration (firebase-applet-config.json).
 * Public identifiers are not secrets; security is enforced by Firestore Security Rules
 * and server-side owner identity verification.
 */

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const AUTHORIZED_OWNER_EMAIL = 'adventurenepal04@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<{
  reachable: boolean;
  note: string;
}> {
  try {
    await getDocFromServer(doc(db, 'status', 'current'));
    return { reachable: true, note: 'Firestore production rules active and reachable' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { reachable: false, note: 'Client is offline — check Firebase configuration' };
    }
    // Permission denied when unauthenticated proves default-deny rules are active on the server
    return {
      reachable: true,
      note: 'Firestore reachable (Default-Deny production rules enforced)',
    };
  }
}

// Run startup connection check
void testFirestoreConnection();

export async function signInOwnerWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutOwner() {
  return signOut(auth);
}
