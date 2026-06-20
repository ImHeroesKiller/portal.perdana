type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  name: string;
  limit: number;
  windowMs: number;
};

export function getClientIp(req: {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const xf = req.headers?.['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim();
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(',')[0].trim();
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp;
  return req.socket?.remoteAddress || 'unknown';
}

export function enforceRateLimit(
  req: Parameters<typeof getClientIp>[0],
  res: { setHeader: (k: string, v: string | number) => void; status: (code: number) => { json: (b: unknown) => void } },
  config: RateLimitConfig
): boolean {
  const ip = getClientIp(req);
  const key = `${config.name}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  res.setHeader('X-RateLimit-Limit', config.limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.limit - bucket.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

  if (bucket.count > config.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
      retryAfter,
    });
    return false;
  }

  return true;
}

/** Preset limits per route class */
export const RATE_LIMITS = {
  chat: { name: 'recruitment-chat', limit: 30, windowMs: 15 * 60 * 1000 },
  telegram: { name: 'telegram', limit: 15, windowMs: 60 * 60 * 1000 },
  submit: { name: 'submit-candidate', limit: 10, windowMs: 60 * 60 * 1000 },
  dbRead: { name: 'db-read', limit: 180, windowMs: 60 * 1000 },
  dbWrite: { name: 'db-write', limit: 40, windowMs: 60 * 1000 },
  seed: { name: 'db-seed', limit: 5, windowMs: 24 * 60 * 60 * 1000 },
  aiInterview: { name: 'ai-interview', limit: 20, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;