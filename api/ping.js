const { guardApi } = require('./_helpers/security');
const { wrapHandler } = require('./_helpers/sentry');

async function handler(req, res) {
  if (!guardApi(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(200).json({ ok: true, pong: true, ts: new Date().toISOString() });
}

module.exports = wrapHandler(handler);