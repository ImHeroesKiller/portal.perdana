/**
 * Server-side Firebase environment helpers.
 * Never import this file from browser/client code.
 */

export interface FirebaseAdminEnv {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseId?: string;
}

export interface FirebaseClientEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseId?: string;
}

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Normalize PEM private key from .env (quoted strings, literal \\n). */
export function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

export function readFirebaseAdminEnv(): FirebaseAdminEnv | null {
  const projectId = trimEnv(process.env.FIREBASE_PROJECT_ID) ?? trimEnv(process.env.VITE_FIREBASE_PROJECT_ID);
  const clientEmail = trimEnv(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const databaseId =
    trimEnv(process.env.FIRESTORE_DATABASE_ID) ?? trimEnv(process.env.VITE_FIREBASE_DATABASE_ID);

  if (!projectId || !clientEmail || !privateKey) return null;

  return { projectId, clientEmail, privateKey, databaseId };
}

export function getMissingAdminEnvKeys(): string[] {
  const missing: string[] = [];
  if (!trimEnv(process.env.FIREBASE_PROJECT_ID) && !trimEnv(process.env.VITE_FIREBASE_PROJECT_ID)) {
    missing.push('FIREBASE_PROJECT_ID');
  }
  if (!trimEnv(process.env.FIREBASE_CLIENT_EMAIL)) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)) missing.push('FIREBASE_PRIVATE_KEY');
  return missing;
}

/** Read client env from Vite `import.meta.env` (browser/build time). */
export function readFirebaseClientEnvFromMeta(meta: ImportMeta): FirebaseClientEnv | null {
  const env = meta.env as Record<string, string | undefined>;
  const config = {
    apiKey: trimEnv(env.VITE_FIREBASE_API_KEY) ?? '',
    authDomain: trimEnv(env.VITE_FIREBASE_AUTH_DOMAIN) ?? '',
    projectId: trimEnv(env.VITE_FIREBASE_PROJECT_ID) ?? '',
    storageBucket: trimEnv(env.VITE_FIREBASE_STORAGE_BUCKET) ?? '',
    messagingSenderId: trimEnv(env.VITE_FIREBASE_MESSAGING_SENDER_ID) ?? '',
    appId: trimEnv(env.VITE_FIREBASE_APP_ID) ?? '',
    databaseId: trimEnv(env.VITE_FIREBASE_DATABASE_ID),
  };

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    return null;
  }

  return config;
}