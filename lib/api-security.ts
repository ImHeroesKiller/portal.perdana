import { applyApiSecurityHeaders } from './security-headers';
import { applyNoStoreHeaders } from './api-cache';
import { enforceRateLimit, type RateLimitConfig } from './api-rate-limit';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://portal.perada.net',
  'https://www.portal.perada.net',
  'https://portal.perdana.net',
  'https://www.portal.perdana.net',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

export function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

function getAllowedOrigins(): string[] {
  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_ORIGINS, ...extra];
}

function readRequestOrigin(req: {
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const raw = req.headers?.origin ?? req.headers?.Origin;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return '';
}

export function resolveCorsOrigin(req: { headers?: Record<string, string | string[] | undefined> }): string {
  const origin = readRequestOrigin(req);
  const allowed = getAllowedOrigins();

  if (origin && allowed.includes(origin)) {
    return origin;
  }

  return 'https://portal.perada.net';
}

export function applyCors(req: any, res: any): void {
  applyNoStoreHeaders(res);
  applyApiSecurityHeaders(res);

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

export function handleOptions(req: any, res: any): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function assertAllowedOrigin(req: any, res: any): boolean {
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

export function requireAdminSecret(req: any, res: any): boolean {
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

export function guardApi(
  req: any,
  res: any,
  options?: { rateLimit?: RateLimitConfig; requireOrigin?: boolean; requireAdmin?: boolean }
): boolean {
  applyCors(req, res);
  if (handleOptions(req, res)) return false;

  if (options?.requireOrigin && !assertAllowedOrigin(req, res)) return false;
  if (options?.requireAdmin && !requireAdminSecret(req, res)) return false;
  if (options?.rateLimit && !enforceRateLimit(req, res, options.rateLimit)) return false;

  return true;
}

export function sanitizeServerError(message: string): string {
  if (!isProductionEnv()) return message;
  if (/key|token|secret|password|private/i.test(message)) {
    return 'Terjadi kesalahan server. Hubungi administrator.';
  }
  return message;
}