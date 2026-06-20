const {
  getDb,
  safeDocToPlain,
  applyCors,
  toStatus,
  readAdminEnv,
  missingEnvKeys,
} = require('../../_helpers/firebase');
const { guardApi, RATE_LIMITS } = require('../../_helpers/security');

const JOBS_COLLECTION = 'jobs';
const PROJECTS_COLLECTION = 'projects';
/** Collections that must return HTTP 200 + [] instead of error JSON */
const FAIL_SOFT_COLLECTIONS = new Set([PROJECTS_COLLECTION]);

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

function respondArray(res, rows, options) {
  const list = Array.isArray(rows) ? rows : [];
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (options?.fallback) {
    res.setHeader('X-Collection-Fallback', 'empty');
    if (options.reason) {
      res.setHeader('X-Collection-Fallback-Reason', String(options.reason).slice(0, 120));
    }
  }
  return res.status(200).json(list);
}

async function readCollectionSafe(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const rows = [];
  let skipped = 0;

  for (const doc of snapshot.docs) {
    try {
      rows.push(safeDocToPlain(doc.id, doc.data()));
    } catch (docError) {
      skipped += 1;
      logError('doc skipped', {
        collection: collectionName,
        id: doc.id,
        message: docError?.message,
      });
    }
  }

  if (skipped > 0) {
    logInfo('partial collection read', { collection: collectionName, skipped, returned: rows.length });
  }

  return rows;
}

async function readWithOptionalSort(db, collectionName, sortField) {
  try {
    const snapshot = await db.collection(collectionName).orderBy(sortField, 'desc').get();
    const rows = [];
    for (const doc of snapshot.docs) {
      try {
        rows.push(safeDocToPlain(doc.id, doc.data()));
      } catch (docError) {
        logError('doc skipped', {
          collection: collectionName,
          id: doc.id,
          message: docError?.message,
        });
      }
    }
    return rows;
  } catch (orderError) {
    const msg = String(orderError?.message || orderError).toLowerCase();
    if (msg.includes('index') || msg.includes('order')) {
      logInfo('orderBy fallback', { collection: collectionName, reason: orderError?.message });
      return readCollectionSafe(db, collectionName);
    }
    throw orderError;
  }
}

async function readJobs(db) {
  return readWithOptionalSort(db, JOBS_COLLECTION, 'createdAt');
}

async function readProjects(db) {
  try {
    const rows = await readWithOptionalSort(db, PROJECTS_COLLECTION, 'createdAt');
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    logError('readProjects failed — trying unsorted fallback', {
      message: error?.message,
      code: error?.code,
    });
    try {
      const rows = await readCollectionSafe(db, PROJECTS_COLLECTION);
      return Array.isArray(rows) ? rows : [];
    } catch (fallbackError) {
      logError('readProjects fallback failed', {
        message: fallbackError?.message,
        code: fallbackError?.code,
      });
      return [];
    }
  }
}

async function fetchCollection(db, collectionName) {
  if (collectionName === JOBS_COLLECTION) {
    return readJobs(db);
  }
  if (collectionName === PROJECTS_COLLECTION) {
    return readProjects(db);
  }
  return readCollectionSafe(db, collectionName);
}

function isQuotaOrTransientError(error) {
  const msg = String(error?.message || error).toLowerCase();
  return (
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    error?.code === 8 ||
    error?.code === 'resource_exhausted'
  );
}

function failSoftEmpty(res, collectionName, reason, startedAt) {
  const quota = isQuotaOrTransientError(reason);
  logError('fail-soft empty array', {
    collection: collectionName,
    reason: reason?.message || reason,
    code: reason?.code,
    quota,
    ms: Date.now() - startedAt,
  });
  return respondArray(res, [], {
    fallback: true,
    reason: quota ? 'firestore_quota_exceeded' : reason?.message || 'fetch_failed',
  });
}

module.exports = async function handler(req, res) {
  const startedAt = Date.now();
  let trimmed = '';

  try {
    if (!guardApi(req, res, { rateLimit: RATE_LIMITS.dbRead })) return;

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

    trimmed = collectionName.trim();
    if (!trimmed || !/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return res.status(400).json({
        error: 'Invalid collection name',
        message: `Nama collection tidak valid: "${collectionName}"`,
      });
    }

    const isFailSoft = FAIL_SOFT_COLLECTIONS.has(trimmed);

    const env = readAdminEnv();
    if (!env) {
      const missing = missingEnvKeys();
      logError('firebase admin not configured', { collection: trimmed, missing });
      if (isFailSoft) {
        return failSoftEmpty(res, trimmed, { message: 'firebase_not_configured', code: 'FIREBASE_CONFIG_ERROR' }, startedAt);
      }
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

    let rows = [];
    try {
      const db = getDb();
      rows = await fetchCollection(db, trimmed);
    } catch (fetchError) {
      if (isFailSoft) {
        return failSoftEmpty(res, trimmed, fetchError, startedAt);
      }
      throw fetchError;
    }

    logInfo('fetch success', {
      collection: trimmed,
      count: rows.length,
      ms: Date.now() - startedAt,
    });

    return respondArray(res, rows);
  } catch (error) {
    const collectionName =
      trimmed ||
      (Array.isArray(req.query?.collection) ? req.query.collection[0] : req.query?.collection);

    if (FAIL_SOFT_COLLECTIONS.has(String(collectionName || '').trim())) {
      return failSoftEmpty(res, collectionName, error, startedAt);
    }

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