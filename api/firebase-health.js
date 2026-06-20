const { readAdminEnv, missingEnvKeys, getDb } = require('./_helpers/firebase');
const { guardApi, RATE_LIMITS } = require('./_helpers/security');
const { wrapHandler, captureError } = require('./_helpers/sentry');

async function handler(req, res) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.dbRead })) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

module.exports = wrapHandler(handler);