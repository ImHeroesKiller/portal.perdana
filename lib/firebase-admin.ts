import admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | null = null;

function resolveProjectId(): string | undefined {
  return process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
}

function resolveDatabaseId(): string | undefined {
  return process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
}

export function getAdminDb(): admin.firestore.Firestore {
  if (adminDb) return adminDb;

  if (!admin.apps.length) {
    const projectId = resolveProjectId();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey && projectId) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } else if (projectId) {
      admin.initializeApp({ projectId });
    } else {
      throw new Error(
        'Firebase Admin belum dikonfigurasi. Set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY di Vercel.'
      );
    }
  }

  const databaseId = resolveDatabaseId();
  adminDb = databaseId ? admin.firestore(databaseId) : admin.firestore();
  return adminDb;
}