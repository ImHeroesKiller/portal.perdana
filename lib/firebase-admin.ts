/**
 * Firebase Admin SDK — server-only (API routes, scripts, Express).
 * Do NOT import from browser/client bundles.
 *
 * firebase-admin is lazy-loaded so Vercel cold starts do not crash when the
 * package fails to initialize at module scope.
 */
import { createRequire } from 'module';
import { join } from 'path';
import type { App } from 'firebase-admin/app';
import type { Firestore } from 'firebase-admin/firestore';

function nodeRequire(id: string): unknown {
  return createRequire(join(process.cwd(), 'package.json'))(id);
}
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

type AdminAppModule = typeof import('firebase-admin/app');
type AdminFirestoreModule = typeof import('firebase-admin/firestore');

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;

function loadAdminAppModule(): AdminAppModule {
  try {
    return nodeRequire('firebase-admin/app') as AdminAppModule;
  } catch (error) {
    throw new FirebaseConnectionError('Gagal memuat modul firebase-admin/app.', error);
  }
}

function loadFirestoreModule(): AdminFirestoreModule {
  try {
    return nodeRequire('firebase-admin/firestore') as AdminFirestoreModule;
  } catch (error) {
    throw new FirebaseConnectionError('Gagal memuat modul firebase-admin/firestore.', error);
  }
}

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

  const { initializeApp, getApps, cert } = loadAdminAppModule();
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
    const { getFirestore } = loadFirestoreModule();
    const app = getOrInitApp();
    const { databaseId } = getAdminEnv();
    cachedDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    cachedDb.settings({ ignoreUndefinedProperties: true });
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