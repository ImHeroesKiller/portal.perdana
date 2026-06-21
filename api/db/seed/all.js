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

// api/db/seed/all.ts
var all_exports = {};
__export(all_exports, {
  default: () => handler
});
module.exports = __toCommonJS(all_exports);

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
  "https://portal.perdana.net",
  "https://www.portal.perdana.net",
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
function readRequestOrigin(req) {
  const raw = req.headers?.origin ?? req.headers?.Origin;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return "";
}
function applyCors(req, res) {
  applyNoStoreHeaders(res);
  applyApiSecurityHeaders(res);
  const origin = readRequestOrigin(req);
  const allowed = getAllowedOrigins();
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://portal.perada.net");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
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

// lib/firebase-admin.ts
var import_module = require("module");
var import_path = require("path");

// lib/firebase-env.ts
function trimEnv(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : void 0;
}
function normalizePrivateKey(raw) {
  if (!raw) return void 0;
  let key = raw.trim();
  if (key.startsWith('"') && key.endsWith('"') || key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}
function readFirebaseAdminEnv() {
  const projectId = trimEnv(process.env.FIREBASE_PROJECT_ID) ?? trimEnv(process.env.VITE_FIREBASE_PROJECT_ID);
  const clientEmail = trimEnv(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const databaseId = trimEnv(process.env.FIRESTORE_DATABASE_ID) ?? trimEnv(process.env.VITE_FIREBASE_DATABASE_ID);
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey, databaseId };
}
function getMissingAdminEnvKeys() {
  const missing = [];
  if (!trimEnv(process.env.FIREBASE_PROJECT_ID) && !trimEnv(process.env.VITE_FIREBASE_PROJECT_ID)) {
    missing.push("FIREBASE_PROJECT_ID");
  }
  if (!trimEnv(process.env.FIREBASE_CLIENT_EMAIL)) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)) missing.push("FIREBASE_PRIVATE_KEY");
  return missing;
}

// lib/firebase-errors.ts
var FirebaseConfigError = class extends Error {
  code = "FIREBASE_CONFIG_ERROR";
  missing;
  constructor(message, missing) {
    super(message);
    this.name = "FirebaseConfigError";
    this.missing = missing;
  }
};
var FirebaseConnectionError = class extends Error {
  code = "FIREBASE_CONNECTION_ERROR";
  cause;
  constructor(message, cause) {
    super(message);
    this.name = "FirebaseConnectionError";
    this.cause = cause;
  }
};
function getErrorCode(error) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    return typeof code === "string" ? code : void 0;
  }
  return void 0;
}
function isFirebaseConfigError(error) {
  return error instanceof FirebaseConfigError || getErrorCode(error) === "FIREBASE_CONFIG_ERROR";
}
function isFirebaseConnectionError(error) {
  return error instanceof FirebaseConnectionError || getErrorCode(error) === "FIREBASE_CONNECTION_ERROR";
}
function formatFirebaseError(error) {
  if (isFirebaseConfigError(error) || isFirebaseConnectionError(error)) {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
function toHttpStatus(error) {
  if (isFirebaseConfigError(error) || isFirebaseConnectionError(error)) return 503;
  const message = formatFirebaseError(error).toLowerCase();
  if (message.includes("not configured") || message.includes("belum dikonfigurasi")) return 503;
  if (message.includes("private key") || message.includes("credential")) return 503;
  if (message.includes("permission") || message.includes("denied")) return 403;
  return 500;
}

// lib/firebase-admin.ts
function nodeRequire(id) {
  return (0, import_module.createRequire)((0, import_path.join)(process.cwd(), "package.json"))(id);
}
var cachedApp = null;
var cachedDb = null;
function loadAdminAppModule() {
  try {
    return nodeRequire("firebase-admin/app");
  } catch (error) {
    throw new FirebaseConnectionError("Gagal memuat modul firebase-admin/app.", error);
  }
}
function loadFirestoreModule() {
  try {
    return nodeRequire("firebase-admin/firestore");
  } catch (error) {
    throw new FirebaseConnectionError("Gagal memuat modul firebase-admin/firestore.", error);
  }
}
function isAdminConfigured() {
  return readFirebaseAdminEnv() !== null;
}
function getAdminEnv() {
  const env = readFirebaseAdminEnv();
  if (!env) {
    throw new FirebaseConfigError(
      "Firebase Admin SDK belum dikonfigurasi. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY.",
      getMissingAdminEnvKeys()
    );
  }
  return env;
}
function getOrInitApp() {
  if (cachedApp) return cachedApp;
  const { initializeApp, getApps, cert } = loadAdminAppModule();
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }
  const env = getAdminEnv();
  try {
    cachedApp = initializeApp({
      credential: cert({
        projectId: env.projectId,
        clientEmail: env.clientEmail,
        privateKey: env.privateKey
      }),
      projectId: env.projectId
    });
  } catch (error) {
    throw new FirebaseConfigError(
      "Gagal memuat kredensial Firebase Admin. Periksa FIREBASE_PRIVATE_KEY (format PEM dengan newline) di Vercel.",
      getMissingAdminEnvKeys()
    );
  }
  return cachedApp;
}
function getAdminDb() {
  if (cachedDb) return cachedDb;
  try {
    const { getFirestore } = loadFirestoreModule();
    const app = getOrInitApp();
    const { databaseId } = getAdminEnv();
    cachedDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    cachedDb.settings({ ignoreUndefinedProperties: true });
    return cachedDb;
  } catch (error) {
    if (error instanceof FirebaseConfigError) throw error;
    throw new FirebaseConnectionError("Gagal menginisialisasi koneksi Firestore Admin.", error);
  }
}

// lib/db-api.ts
async function getAdminDbOrThrow() {
  if (!isAdminConfigured()) {
    throw new FirebaseConfigError(
      "Firebase Admin belum dikonfigurasi di server.",
      ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]
    );
  }
  return getAdminDb();
}
async function seedAllCollections(body) {
  const db = await getAdminDbOrThrow();
  const batch = db.batch();
  if (Array.isArray(body.clients)) {
    for (const cli of body.clients) {
      batch.set(db.collection("clients").doc(cli.id), cli);
    }
  }
  if (Array.isArray(body.projects)) {
    for (const prj of body.projects) {
      batch.set(db.collection("projects").doc(prj.id), prj);
    }
  }
  if (Array.isArray(body.jobs)) {
    for (const job of body.jobs) {
      batch.set(db.collection("jobs").doc(job.id), job);
    }
  }
  const candidateRows = body.candidates ?? body.employees;
  if (Array.isArray(candidateRows)) {
    for (const row of candidateRows) {
      batch.set(db.collection("candidates").doc(row.id), row);
    }
  }
  await batch.commit();
}

// api/db/seed/all.ts
async function handler(req, res) {
  if (!guardApi(req, res, {
    rateLimit: RATE_LIMITS.seed,
    requireOrigin: true,
    requireAdmin: true
  })) {
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    await seedAllCollections(req.body ?? {});
    return res.status(200).json({
      success: true,
      message: "Database seeded successfully from server-side batch!"
    });
  } catch (error) {
    console.error("POST /api/db/seed/all error:", error);
    return res.status(toHttpStatus(error)).json({
      error: formatFirebaseError(error) || "Failed server-side seeding batch write"
    });
  }
}
if (module.exports.default) module.exports = module.exports.default;
