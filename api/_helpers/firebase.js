let cachedApp = null;
let cachedDb = null;

function trim(value) {
  const t = value?.trim();
  return t || undefined;
}

function normalizePrivateKey(raw) {
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

function readAdminEnv() {
  const projectId = trim(process.env.FIREBASE_PROJECT_ID) || trim(process.env.VITE_FIREBASE_PROJECT_ID);
  const clientEmail = trim(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const databaseId = trim(process.env.FIRESTORE_DATABASE_ID) || trim(process.env.VITE_FIREBASE_DATABASE_ID);
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey, databaseId };
}

function missingEnvKeys() {
  const missing = [];
  if (!trim(process.env.FIREBASE_PROJECT_ID) && !trim(process.env.VITE_FIREBASE_PROJECT_ID)) {
    missing.push('FIREBASE_PROJECT_ID');
  }
  if (!trim(process.env.FIREBASE_CLIENT_EMAIL)) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)) missing.push('FIREBASE_PRIVATE_KEY');
  return missing;
}

function getDb() {
  if (cachedDb) return cachedDb;

  const env = readAdminEnv();
  if (!env) {
    const err = new Error('Firebase Admin belum dikonfigurasi di server.');
    err.code = 'FIREBASE_CONFIG_ERROR';
    err.missing = missingEnvKeys();
    throw err;
  }

  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');

  if (!cachedApp) {
    const existing = getApps();
    cachedApp =
      existing.length > 0
        ? existing[0]
        : initializeApp({
            credential: cert({
              projectId: env.projectId,
              clientEmail: env.clientEmail,
              privateKey: env.privateKey,
            }),
            projectId: env.projectId,
          });
  }

  cachedDb = env.databaseId
    ? getFirestore(cachedApp, env.databaseId)
    : getFirestore(cachedApp);
  return cachedDb;
}

function serializeValue(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (depth > 14) return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return value.toString('base64');
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map((item) => serializeValue(item, depth + 1));

  if (typeof value === 'object') {
    // === PERBAIKAN UTAMA ===
    // Hanya return latitude + longitude jika object HANYA berisi 2 field itu saja.
    // Jika ada field lain (title, department, dll), tetap proses semua field.
    const keys = Object.keys(value);
    const hasGeo = typeof value.latitude === 'number' && typeof value.longitude === 'number';

    if (hasGeo && keys.length === 2) {
      return { latitude: value.latitude, longitude: value.longitude };
    }

    if ('_seconds' in value && '_nanoseconds' in value) {
      const ms = Number(value._seconds) * 1000 + Number(value._nanoseconds) / 1_000_000;
      return new Date(ms).toISOString();
    }
    if (typeof value.path === 'string' && typeof value.id === 'string' && value.firestore) {
      return value.path;
    }

    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = serializeValue(v, depth + 1);
    }
    return out;
  }

  return value;
}

function docToPlain(id, data) {
  const source = data && typeof data === 'object' ? data : {};
  return { id, ...serializeValue(source) };
}

function safeDocToPlain(id, data) {
  try {
    return docToPlain(id, data);
  } catch (error) {
    const err = new Error(`Gagal serialisasi dokumen "${id}": ${error?.message || error}`);
    err.code = 'DOC_SERIALIZE_ERROR';
    err.docId = id;
    throw err;
  }
}

function applyCors(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

function toStatus(error) {
  if (error?.code === 'FIREBASE_CONFIG_ERROR' || error?.code === 'FIREBASE_CONNECTION_ERROR') {
    return 503;
  }
  const msg = String(error?.message || error).toLowerCase();
  if (msg.includes('belum dikonfigurasi') || msg.includes('not configured')) return 503;
  if (msg.includes('permission') || msg.includes('denied')) return 403;
  return 500;
}

module.exports = {
  readAdminEnv,
  missingEnvKeys,
  getDb,
  docToPlain,
  safeDocToPlain,
  applyCors,
  toStatus,
};
