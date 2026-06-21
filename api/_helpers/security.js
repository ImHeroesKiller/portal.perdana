const buckets = new Map();

const DEFAULT_ALLOWED_ORIGINS = [
  'https://portal.perada.net',
  'https://www.portal.perada.net',
  'https://portal.perdana.net',
  'https://www.portal.perdana.net',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

function isProductionEnv() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

function getAllowedOrigins() {
  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_ORIGINS, ...extra];
}

function getClientIp(req) {
  const xf = req.headers?.['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim();
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(',')[0].trim();
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp;
  return req.socket?.remoteAddress || 'unknown';
}

function readRequestOrigin(req) {
  const raw = req.headers?.origin || req.headers?.Origin;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return '';
}

function resolveCorsOrigin(req) {
  const origin = readRequestOrigin(req);
  const allowed = getAllowedOrigins();
  if (origin && allowed.includes(origin)) return origin;
  return 'https://portal.perada.net';
}

function applyApiSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
}

function applySecureCors(req, res) {
  applyApiSecurityHeaders(res);
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  const origin = readRequestOrigin(req);
  const allowed = getAllowedOrigins();

  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://portal.perada.net');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Api-Admin-Key, X-Requested-With'
  );
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

function enforceRateLimit(req, res, config) {
  const ip = getClientIp(req);
  const key = `${config.name}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  res.setHeader('X-RateLimit-Limit', String(config.limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, config.limit - bucket.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > config.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.', retryAfter });
    return false;
  }
  return true;
}

function assertAllowedOrigin(req, res) {
  if (!isProductionEnv()) return true;
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : '';
  const referer = typeof req.headers?.referer === 'string' ? req.headers.referer : '';
  const allowed = getAllowedOrigins();
  const ok =
    (origin && allowed.includes(origin)) ||
    (referer && allowed.some((a) => referer.startsWith(a)));
  if (!ok) {
    res.status(403).json({ error: 'Origin tidak diizinkan.' });
    return false;
  }
  return true;
}

function requireAdminSecret(req, res) {
  const secret = process.env.API_ADMIN_SECRET?.trim();
  if (!secret) {
    if (isProductionEnv()) {
      res.status(503).json({ error: 'API admin secret belum dikonfigurasi di server.' });
      return false;
    }
    return true;
  }
  const provided =
    (typeof req.headers?.['x-api-admin-key'] === 'string' && req.headers['x-api-admin-key']) ||
    (typeof req.headers?.authorization === 'string' &&
      req.headers.authorization.replace(/^Bearer\s+/i, ''));
  if (provided !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function guardApi(req, res, options = {}) {
  applySecureCors(req, res);
  if (handleOptions(req, res)) return false;
  if (options.requireOrigin && !assertAllowedOrigin(req, res)) return false;
  if (options.requireAdmin && !requireAdminSecret(req, res)) return false;
  if (options.rateLimit && !enforceRateLimit(req, res, options.rateLimit)) return false;
  return true;
}

const RATE_LIMITS = {
  telegram: { name: 'telegram', limit: 15, windowMs: 60 * 60 * 1000 },
  dbRead: { name: 'db-read', limit: 180, windowMs: 60 * 1000 },
  dbWrite: { name: 'db-write', limit: 40, windowMs: 60 * 1000 },
  aiInterview: { name: 'ai-interview', limit: 20, windowMs: 60 * 60 * 1000 },
};

module.exports = {
  applySecureCors,
  handleOptions,
  guardApi,
  enforceRateLimit,
  requireAdminSecret,
  assertAllowedOrigin,
  getClientIp,
  RATE_LIMITS,
  isProductionEnv,
};