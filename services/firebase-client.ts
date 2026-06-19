/**
 * Firebase Client SDK — browser only.
 * Do NOT import firebase-admin here.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { doc, getDoc, getFirestore, type Firestore } from 'firebase/firestore';
import { readFirebaseClientEnvFromMeta } from '../lib/firebase-env';
import {
  FirebaseConfigError,
  type ConnectionTestResult,
  formatFirebaseError,
} from '../lib/firebase-errors';

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function getClientEnv() {
  return readFirebaseClientEnvFromMeta(import.meta);
}

export function isFirebaseConfigured(): boolean {
  return getClientEnv() !== null;
}

export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;

  const config = getClientEnv();
  if (!config) {
    throw new FirebaseConfigError(
      'Firebase Client SDK belum dikonfigurasi. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, dan VITE_FIREBASE_APP_ID.',
      [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID',
      ]
    );
  }

  const existing = getApps();
  cachedApp = existing.length
    ? existing[0]!
    : initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });

  return cachedApp;
}

export function getClientAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}

export function getClientDb(): Firestore {
  if (!cachedDb) {
    const config = getClientEnv();
    const app = getFirebaseApp();
    cachedDb = config?.databaseId ? getFirestore(app, config.databaseId) : getFirestore(app);
  }
  return cachedDb;
}

/** Read-only probe against a known settings doc. */
export async function testClientConnection(): Promise<ConnectionTestResult> {
  const config = getClientEnv();
  if (!config) {
    return {
      ok: false,
      side: 'client',
      error: 'Firebase Client env belum lengkap.',
      missing: [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID',
      ],
    };
  }

  try {
    const db = getClientDb();
    await getDoc(doc(db, 'settings', 'company'));

    return {
      ok: true,
      side: 'client',
      projectId: config.projectId,
      databaseId: config.databaseId ?? '(default)',
    };
  } catch (error) {
    return {
      ok: false,
      side: 'client',
      projectId: config.projectId,
      databaseId: config.databaseId ?? '(default)',
      error: formatFirebaseError(error),
    };
  }
}