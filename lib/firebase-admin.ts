/**
 * Firebase Admin SDK — server-only (API routes, scripts, Express).
 * Do NOT import from browser/client bundles.
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import {
  getMissingAdminEnvKeys,
  readFirebaseAdminEnv,
  type FirebaseAdminEnv,
} from './firebase-env';
import {
  FirebaseConfigError,
  FirebaseConnectionError,
  type ConnectionTestResult,
  formatFirebaseError,
} from './firebase-errors';

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;

export function isAdminConfigured(): boolean {
  return readFirebaseAdminEnv() !== null;
}

export function getAdminEnv(): FirebaseAdminEnv {
  const env = readFirebaseAdminEnv();
  if (!env) {
    throw new FirebaseConfigError(
      'Firebase Admin SDK belum dikonfigurasi. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY.',
      getMissingAdminEnvKeys()
    );
  }
  return env;
}

function getOrInitApp(): App {
  if (cachedApp) return cachedApp;

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0]!;
    return cachedApp;
  }

  const env = getAdminEnv();
  try {
    cachedApp = initializeApp({
      credential: cert({
        projectId: env.projectId,
        clientEmail: env.clientEmail,
        privateKey: env.privateKey,
      }),
      projectId: env.projectId,
    });
  } catch (error) {
    throw new FirebaseConfigError(
      'Gagal memuat kredensial Firebase Admin. Periksa FIREBASE_PRIVATE_KEY (format PEM dengan newline) di Vercel.',
      getMissingAdminEnvKeys()
    );
  }

  return cachedApp;
}

export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb;

  try {
    const app = getOrInitApp();
    const { databaseId } = getAdminEnv();
    cachedDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    return cachedDb;
  } catch (error) {
    if (error instanceof FirebaseConfigError) throw error;
    throw new FirebaseConnectionError('Gagal menginisialisasi koneksi Firestore Admin.', error);
  }
}

/** Lightweight connectivity probe (read-only, no writes). */
export async function testAdminConnection(): Promise<ConnectionTestResult> {
  const env = readFirebaseAdminEnv();
  if (!env) {
    return {
      ok: false,
      side: 'admin',
      error: 'Firebase Admin env belum lengkap.',
      missing: getMissingAdminEnvKeys(),
    };
  }

  try {
    const db = getAdminDb();
    await db.collection('settings').limit(1).get();

    return {
      ok: true,
      side: 'admin',
      projectId: env.projectId,
      databaseId: env.databaseId ?? '(default)',
    };
  } catch (error) {
    return {
      ok: false,
      side: 'admin',
      projectId: env.projectId,
      databaseId: env.databaseId ?? '(default)',
      error: formatFirebaseError(error),
    };
  }
}