const {
  getDb,
  docToPlain,
  applyCors,
  toStatus,
  readAdminEnv,
  missingEnvKeys,
} = require('../_helpers/firebase');

const JOBS_COLLECTION = 'jobs';
const LOG_PREFIX = '[api/db/collection]';

function logInfo(message, meta) {
  if (meta !== undefined) {
    console.log(LOG_PREFIX, message, meta);
  } else {
    console.log(LOG_PREFIX, message);
  }
}

function logError(message, meta) {
  if (meta !== undefined) {
    console.error(LOG_PREFIX, message, meta);
  } else {
    console.error(LOG_PREFIX, message);
  }
}

async function readAllDocs(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const rows = snapshot.docs.map((doc) => docToPlain(doc.id, doc.data()));
  return Array.isArray(rows) ? rows : [];
}

async function readJobs(db) {
  try {
    const snapshot = await db.collection(JOBS_COLLECTION).orderBy('createdAt', 'desc').get();
    const rows = snapshot.docs.map((doc) => docToPlain(doc.id, doc.data()));
    return Array.isArray(rows) ? rows : [];
  } catch (orderError) {
    const msg = String(orderError?.message || orderError).toLowerCase();
    if (msg.includes('index') || msg.includes('order')) {
      logInfo('jobs orderBy fallback — reading without sort', {
        reason: orderError?.message,
      });
      return readAllDocs(db, JOBS_COLLECTION);
    }
    throw orderError;
  }
}

module.exports = async function handler(req, res) {
  const startedAt = Date.now();

  try {
    applyCors(res);

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      logInfo('method not allowed', { method: req.method });
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const collectionName = Array.isArray(req.query?.collection)
      ? req.query.collection[0]
      : req.query?.collection;

    logInfo('incoming request', {
      collection: collectionName,
      url: req.url,
    });

    if (!collectionName || typeof collectionName !== 'string') {
      return res.status(400).json({
        error: 'Collection name is required',
        message: 'Parameter collection wajib diisi.',
      });
    }

    const trimmed = collectionName.trim();
    if (!trimmed || !/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return res.status(400).json({
        error: 'Invalid collection name',
        message: `Nama collection tidak valid: "${collectionName}"`,
      });
    }

    const env = readAdminEnv();
    if (!env) {
      const missing = missingEnvKeys();
      logError('firebase admin not configured', { missing });
      return res.status(503).json({
        error: 'Firebase Admin belum dikonfigurasi di server.',
        message: 'Firebase Admin belum dikonfigurasi di server.',
        code: 'FIREBASE_CONFIG_ERROR',
        missing,
      });
    }

    logInfo('firestore ready', {
      collection: trimmed,
      projectId: env.projectId,
      databaseId: env.databaseId || '(default)',
    });

    const db = getDb();
    const data = trimmed === JOBS_COLLECTION ? await readJobs(db) : await readAllDocs(db, trimmed);
    const rows = Array.isArray(data) ? data : [];

    logInfo('fetch success', {
      collection: trimmed,
      count: rows.length,
      ms: Date.now() - startedAt,
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(rows);
  } catch (error) {
    const collectionName = Array.isArray(req.query?.collection)
      ? req.query.collection[0]
      : req.query?.collection;
    const status = toStatus(error);

    logError('fetch failed', {
      collection: collectionName,
      status,
      code: error?.code,
      message: error?.message,
      missing: error?.missing,
      ms: Date.now() - startedAt,
    });

    const payload = {
      error: error?.message || `Gagal mengambil collection "${collectionName}"`,
      message: error?.message || 'Terjadi kesalahan saat membaca database.',
      code: error?.code || 'FETCH_ERROR',
    };
    if (error?.missing) payload.missing = error.missing;

    return res.status(status).json(payload);
  }
};