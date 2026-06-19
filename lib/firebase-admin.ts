import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | null = null;

function resolveProjectId(): string | undefined {
  return process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
}

function resolveDatabaseId(): string | undefined {
  return process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
}

function getOrInitApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;

  const projectId = resolveProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey && projectId) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  if (projectId) {
    return initializeApp({ projectId });
  }

  throw new Error(
    'Firebase Admin belum dikonfigurasi. Set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.'
  );
}

export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;

  const app = getOrInitApp();
  const databaseId = resolveDatabaseId();
  adminDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  return adminDb;
}