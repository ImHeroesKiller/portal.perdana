const { readAdminEnv, missingEnvKeys, getDb } = require('../_helpers/firebase');
const { guardApi, RATE_LIMITS } = require('../_helpers/security');
const { wrapHandler, captureError } = require('../_helpers/sentry');

async function handlePing(req, res) {
  return res.status(200).json({ ok: true, pong: true, ts: new Date().toISOString() });
}

async function handleFirebaseHealth(req, res) {
  const env = readAdminEnv();
  if (!env) {
    return res.status(503).json({
      ok: false,
      timestamp: new Date().toISOString(),
      admin: {
        configured: false,
        connected: false,
        projectId: null,
        databaseId: null,
        missing: missingEnvKeys(),
        error: 'Firebase Admin env belum lengkap.',
      },
    });
  }

  try {
    const db = getDb();
    await db.collection('settings').limit(1).get();
    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      admin: {
        configured: true,
        connected: true,
        projectId: env.projectId,
        databaseId: env.databaseId || '(default)',
        missing: [],
        error: null,
      },
    });
  } catch (error) {
    console.error('firebase-health error:', error);
    captureError(error, { route: 'firebase-health' });
    return res.status(503).json({
      ok: false,
      timestamp: new Date().toISOString(),
      admin: {
        configured: true,
        connected: false,
        projectId: env.projectId,
        databaseId: env.databaseId || '(default)',
        missing: [],
        error: error?.message || String(error),
      },
    });
  }
}

const CHECKS = {
  ping: { method: 'GET', rateLimit: null, handler: handlePing },
  'firebase-health': { method: 'GET', rateLimit: RATE_LIMITS.dbRead, handler: handleFirebaseHealth },
};

async function rawHandler(req, res) {
  const check = req.query?.check;
  const config = CHECKS[check];

  if (!config) {
    return res.status(404).json({ error: 'Not Found' });
  }

  if (!guardApi(req, res, config.rateLimit ? { rateLimit: config.rateLimit } : {})) return;

  if (req.method !== config.method) {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return config.handler(req, res);
}

module.exports = wrapHandler(rawHandler);