"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/ai-interview-analyze.ts
var ai_interview_analyze_exports = {};
__export(ai_interview_analyze_exports, {
  default: () => handler
});
module.exports = __toCommonJS(ai_interview_analyze_exports);
var import_genai = require("@google/genai");

// lib/security-headers.ts
var PRODUCTION_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com wss://*.firebaseio.com",
  "frame-src 'self' https://www.openstreetmap.org https://docs.google.com https://script.google.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'"
].join("; ");
var API_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache"
};
function applyApiSecurityHeaders(res) {
  Object.entries(API_SECURITY_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
}

// lib/api-cache.ts
var NO_STORE_CACHE_CONTROL = "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0";
var NO_STORE_HEADERS = {
  "Cache-Control": NO_STORE_CACHE_CONTROL,
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0"
};
function applyNoStoreHeaders(res) {
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    if (typeof res.setHeader === "function") {
      res.setHeader(key, value);
    } else if (typeof res.set === "function") {
      res.set(key, value);
    }
  }
}

// lib/api-rate-limit.ts
var buckets = /* @__PURE__ */ new Map();
function getClientIp(req) {
  const xf = req.headers?.["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) return xf.split(",")[0].trim();
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(",")[0].trim();
  const realIp = req.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp) return realIp;
  return req.socket?.remoteAddress || "unknown";
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
  res.setHeader("X-RateLimit-Limit", config.limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, config.limit - bucket.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1e3));
  if (bucket.count > config.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1e3));
    res.setHeader("Retry-After", retryAfter);
    res.status(429).json({
      error: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
      retryAfter
    });
    return false;
  }
  return true;
}
var RATE_LIMITS = {
  chat: { name: "recruitment-chat", limit: 30, windowMs: 15 * 60 * 1e3 },
  telegram: { name: "telegram", limit: 15, windowMs: 60 * 60 * 1e3 },
  submit: { name: "submit-candidate", limit: 10, windowMs: 60 * 60 * 1e3 },
  dbRead: { name: "db-read", limit: 180, windowMs: 60 * 1e3 },
  dbWrite: { name: "db-write", limit: 40, windowMs: 60 * 1e3 },
  seed: { name: "db-seed", limit: 5, windowMs: 24 * 60 * 60 * 1e3 },
  aiInterview: { name: "ai-interview", limit: 20, windowMs: 60 * 60 * 1e3 }
};

// lib/api-security.ts
var DEFAULT_ALLOWED_ORIGINS = [
  "https://portal.perada.net",
  "https://www.portal.perada.net",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000"
];
function isProductionEnv() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}
function getAllowedOrigins() {
  const extra = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...DEFAULT_ALLOWED_ORIGINS, ...extra];
}
function resolveCorsOrigin(req) {
  const origin = req.headers?.origin;
  if (typeof origin !== "string" || !origin) {
    return isProductionEnv() ? "https://portal.perada.net" : "*";
  }
  const allowed = getAllowedOrigins();
  if (!isProductionEnv()) return origin;
  return allowed.includes(origin) ? origin : "https://portal.perada.net";
}
function applyCors(req, res) {
  applyNoStoreHeaders(res);
  applyApiSecurityHeaders(res);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", resolveCorsOrigin(req));
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,PUT,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Api-Admin-Key, X-Requested-With"
  );
}
function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}
function assertAllowedOrigin(req, res) {
  if (!isProductionEnv()) return true;
  const origin = typeof req.headers?.origin === "string" ? req.headers.origin : "";
  const referer = typeof req.headers?.referer === "string" ? req.headers.referer : "";
  const allowed = getAllowedOrigins();
  const ok = origin && allowed.includes(origin) || referer && allowed.some((a) => referer.startsWith(a));
  if (!ok) {
    res.status(403).json({ error: "Origin tidak diizinkan." });
    return false;
  }
  return true;
}
function requireAdminSecret(req, res) {
  const secret = process.env.API_ADMIN_SECRET?.trim();
  if (!secret) {
    if (isProductionEnv()) {
      res.status(503).json({ error: "API admin secret belum dikonfigurasi di server." });
      return false;
    }
    return true;
  }
  const provided = typeof req.headers?.["x-api-admin-key"] === "string" && req.headers["x-api-admin-key"] || typeof req.headers?.authorization === "string" && req.headers.authorization.replace(/^Bearer\s+/i, "");
  if (provided !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
function guardApi(req, res, options) {
  applyCors(req, res);
  if (handleOptions(req, res)) return false;
  if (options?.requireOrigin && !assertAllowedOrigin(req, res)) return false;
  if (options?.requireAdmin && !requireAdminSecret(req, res)) return false;
  if (options?.rateLimit && !enforceRateLimit(req, res, options.rateLimit)) return false;
  return true;
}
function sanitizeServerError(message) {
  if (!isProductionEnv()) return message;
  if (/key|token|secret|password|private/i.test(message)) {
    return "Terjadi kesalahan server. Hubungi administrator.";
  }
  return message;
}

// api/ai-interview-analyze.ts
async function handler(req, res) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.aiInterview, requireOrigin: true })) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({ error: "GEMINI_API_KEY belum dikonfigurasi di server." });
  }
  const { fullName, positionApplied, transcript } = req.body || {};
  if (!transcript || typeof transcript !== "object") {
    return res.status(400).json({ error: "Field 'transcript' wajib berupa object." });
  }
  try {
    const ai = new import_genai.GoogleGenAI({ apiKey });
    const prompt = `
Analyze the following candidate interview based on the STAR method.

Context:
Candidate Name: ${fullName || "Candidate"}
Position: ${positionApplied || "N/A"}

Transcript:
Situation: ${transcript.situation || "No answer"}
Task: ${transcript.task || "No answer"}
Action: ${transcript.action || "No answer"}
Result: ${transcript.result || "No answer"}

Provide:
1. A brief analysis for each STAR component.
2. An overall score (0-100).
3. A summary of the candidate's performance.
`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            starAnalysis: {
              type: import_genai.Type.OBJECT,
              properties: {
                situation: { type: import_genai.Type.STRING },
                task: { type: import_genai.Type.STRING },
                action: { type: import_genai.Type.STRING },
                result: { type: import_genai.Type.STRING }
              }
            },
            overallScore: { type: import_genai.Type.NUMBER },
            summary: { type: import_genai.Type.STRING }
          }
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.status(200).json({ result: parsed });
  } catch (error) {
    console.error("ai-interview-analyze error:", error);
    const message = error instanceof Error ? error.message : "Gagal menganalisis interview.";
    return res.status(500).json({ error: sanitizeServerError(message) });
  }
}
if (module.exports.default) module.exports = module.exports.default;
