/**
 * Firebase Client SDK — hanya untuk browser (auth, firestore client).
 * Untuk operasi server-side (API routes), gunakan lib/firebase-admin.ts.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

function initFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApps()[0];

  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase Client SDK belum dikonfigurasi. Set VITE_FIREBASE_* di environment variables.'
    );
  }

  return initializeApp(firebaseConfig);
}

const app = initFirebaseApp();
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

export const auth: Auth = getAuth(app);
export const db: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const firestore = db;
export default app;