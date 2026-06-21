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

// api/recruitment-chat.ts
var recruitment_chat_exports = {};
__export(recruitment_chat_exports, {
  default: () => handler
});
module.exports = __toCommonJS(recruitment_chat_exports);

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

// lib/candidate-record.ts
function ensurePlus622(num) {
  if (!num) return "";
  let clean = num.replace(/[^0-9]/g, "");
  if (!clean.length) return "";
  if (clean.startsWith("0")) clean = clean.substring(1);
  if (clean.startsWith("62")) return `+${clean}`;
  return `+62${clean}`;
}
var CANDIDATES_COLLECTION = "candidates";
var LEGACY_STATUS_MAP = {
  new: "APPLIED",
  applied: "APPLIED",
  screening: "SCREENING",
  interview: "INTERVIEW",
  offering: "OFFERING",
  contract: "CONTRACT",
  hired: "HIRED",
  rejected: "REJECTED",
  terminated: "TERMINATED",
  resigned: "RESIGNED"
};
function normalizeApplicationStatus(status) {
  if (typeof status !== "string" || !status.trim()) return "APPLIED";
  const key = status.trim().toLowerCase();
  if (LEGACY_STATUS_MAP[key]) return LEGACY_STATUS_MAP[key];
  const upper = status.trim().toUpperCase();
  const valid = [
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFERING",
    "CONTRACT",
    "HIRED",
    "REJECTED",
    "TERMINATED",
    "RESIGNED"
  ];
  return valid.includes(upper) ? upper : "APPLIED";
}
function inferCandidateSource(doc) {
  if (typeof doc.source === "string" && doc.source.trim()) return doc.source.trim();
  if (doc.aiInterview) return "ai-sara";
  return "manual";
}
function prepareCandidateForFirestore(data, options) {
  const id = options?.id || data.id || Math.random().toString(36).substring(2, 11);
  const addressLine = data.addressLine || data.domicileAddress || "";
  const record = {
    ...data,
    id,
    addressLine,
    domicileAddress: data.domicileAddress || addressLine,
    email: (data.email || "").toLowerCase(),
    whatsappNumber: ensurePlus622(data.whatsappNumber),
    emergencyPhone: ensurePlus622(data.emergencyPhone) || "-",
    status: normalizeApplicationStatus(data.status ?? "APPLIED"),
    source: options?.source || inferCandidateSource(data),
    createdAt: data.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  return record;
}

// lib/candidate-payload.ts
function findJsonInText(text) {
  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1);
  }
  return null;
}
function isCompleteCandidateData(data) {
  const required = [
    "fullName",
    "nik",
    "kkNumber",
    "email",
    "whatsappNumber",
    "positionApplied",
    "lastEducation",
    "bankName"
  ];
  return required.every((field) => {
    const value = data[field];
    return typeof value === "string" ? value.trim().length > 0 : value != null;
  });
}

// lib/candidate.ts
function cleanDoc(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(cleanDoc);
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== void 0) cleaned[key] = cleanDoc(val);
  }
  return cleaned;
}
function parseWillingToRelocate(value) {
  if (typeof value === "boolean") return value;
  if (!value) return true;
  const normalized = value.toString().trim().toLowerCase();
  return !["tidak", "no", "false", "0"].includes(normalized);
}
function mapCandidateDocument(data, id) {
  const candidateId = id || Math.random().toString(36).substring(2, 11);
  const addressLine = data.addressLine || "";
  return prepareCandidateForFirestore(
    {
      id: candidateId,
      positionApplied: data.positionApplied || "Staff Operasional",
      fullName: data.fullName || "",
      nik: data.nik || "",
      kkNumber: data.kkNumber || "",
      npwp: data.npwp || "",
      placeOfBirth: data.placeOfBirth || "-",
      dateOfBirth: data.dateOfBirth || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      gender: data.gender || "Laki-laki",
      maritalStatus: data.maritalStatus || "Belum Menikah",
      religion: data.religion || "Islam",
      willingToRelocate: parseWillingToRelocate(data.willingToRelocate),
      certifications: data.certifications || "",
      email: (data.email || "").toLowerCase(),
      whatsappNumber: ensurePlus62(data.whatsappNumber),
      addressLine,
      domicileAddress: addressLine,
      provinsi: data.provinsi || "",
      kabupaten: data.kabupaten || "",
      kecamatan: data.kecamatan || "",
      desa: data.desa || "",
      rt: data.rt || "",
      rw: data.rw || "",
      latitude: parseFloat(String(data.latitude)) || -0.9489,
      longitude: parseFloat(String(data.longitude)) || 119.8707,
      lastEducation: data.lastEducation || "-",
      institutionName: data.institutionName || "-",
      major: data.major || "-",
      graduationYear: Number(data.graduationYear) || (/* @__PURE__ */ new Date()).getFullYear(),
      skills: data.skills || "",
      workExperience: data.workExperience || "-",
      bankName: data.bankName || "-",
      accountNumber: data.accountNumber || "-",
      emergencyName: data.emergencyName || "-",
      emergencyRelation: data.emergencyRelation || "-",
      emergencyPhone: ensurePlus62(data.emergencyPhone) || "-",
      telegramId: data.telegramId || "",
      applicationLetterPath: "",
      cvPath: "",
      ktpPath: "",
      diplomaPath: "",
      photoPath: "",
      kkPath: "",
      certificatePath: "",
      status: normalizeApplicationStatus("APPLIED"),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    { id: candidateId, source: data.source || "ai-sara" }
  );
}
async function saveCandidateToFirestore(data, options) {
  if (!isAdminConfigured()) {
    throw new FirebaseConfigError(
      "Firebase Admin belum dikonfigurasi di server. Tidak dapat menyimpan kandidat."
    );
  }
  if (!isCompleteCandidateData(data)) {
    throw new Error("Data kandidat belum lengkap untuk disimpan ke Firestore.");
  }
  try {
    const db = getAdminDb();
    const candidate = mapCandidateDocument(data, options?.id);
    const docRef = db.collection(CANDIDATES_COLLECTION).doc(candidate.id);
    if (options?.merge) {
      await docRef.set(cleanDoc(candidate), { merge: true });
    } else {
      await docRef.set(cleanDoc(candidate));
    }
    return candidate;
  } catch (error) {
    if (error instanceof FirebaseConfigError) throw error;
    throw new FirebaseConnectionError(
      `Gagal menyimpan kandidat ke Firestore (${CANDIDATES_COLLECTION}).`,
      error
    );
  }
}
function extractPureJsonReply(text) {
  const jsonStr = findJsonInText(text);
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    if (!isCompleteCandidateData(parsed)) return null;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}
async function trySaveCandidateFromReply(replyText) {
  const pureJson = extractPureJsonReply(replyText);
  if (!pureJson) return null;
  try {
    const parsed = JSON.parse(pureJson);
    return await saveCandidateToFirestore({ ...parsed, source: "ai-sara" }, { merge: true });
  } catch (error) {
    console.error("trySaveCandidateFromReply error:", formatFirebaseError(error));
    return null;
  }
}

// lib/sara-komodo-chat.ts
var import_genai = require("@google/genai");

// lib/sara-chat-extract.ts
function parseSixteenDigitId(raw) {
  const digits = raw.replace(/\D/g, "");
  return /^\d{16}$/.test(digits) ? digits : null;
}
function isNikValid(value) {
  if (value == null) return false;
  return parseSixteenDigitId(String(value)) !== null;
}
var COLLECTION_ORDER = [
  {
    key: "positionApplied",
    label: "Posisi dilamar",
    filled: (d) => Boolean(d.positionApplied?.trim()),
    display: (d) => d.positionApplied || ""
  },
  {
    key: "fullName",
    label: "Nama lengkap",
    filled: (d) => Boolean(d.fullName?.trim()),
    display: (d) => d.fullName || ""
  },
  {
    key: "nik",
    label: "NIK",
    filled: (d) => isNikValid(d.nik),
    display: (d) => String(d.nik || "")
  },
  {
    key: "kkNumber",
    label: "Nomor KK",
    filled: (d) => isNikValid(d.kkNumber),
    display: (d) => String(d.kkNumber || "")
  },
  {
    key: "npwp",
    label: "NPWP",
    filled: (d) => Boolean(d.npwp?.trim()),
    display: (d) => d.npwp || ""
  },
  {
    key: "placeOfBirth",
    label: "Tempat lahir",
    filled: (d) => Boolean(d.placeOfBirth?.trim()),
    display: (d) => d.placeOfBirth || ""
  },
  {
    key: "dateOfBirth",
    label: "Tanggal lahir",
    filled: (d) => Boolean(d.dateOfBirth?.trim()),
    display: (d) => d.dateOfBirth || ""
  },
  {
    key: "gender",
    label: "Jenis kelamin",
    filled: (d) => Boolean(d.gender?.trim()),
    display: (d) => d.gender || ""
  },
  {
    key: "maritalStatus",
    label: "Status pernikahan",
    filled: (d) => Boolean(d.maritalStatus?.trim()),
    display: (d) => d.maritalStatus || ""
  },
  {
    key: "religion",
    label: "Agama",
    filled: (d) => Boolean(d.religion?.trim()),
    display: (d) => d.religion || ""
  },
  {
    key: "willingToRelocate",
    label: "Relokasi",
    filled: (d) => d.willingToRelocate === "Ya" || d.willingToRelocate === "Tidak",
    display: (d) => String(d.willingToRelocate || "")
  },
  {
    key: "email",
    label: "Email",
    filled: (d) => Boolean(d.email?.trim()),
    display: (d) => d.email || ""
  },
  {
    key: "whatsappNumber",
    label: "WhatsApp",
    filled: (d) => Boolean(d.whatsappNumber?.trim()),
    display: (d) => d.whatsappNumber || ""
  },
  {
    key: "address",
    label: "Alamat (prov/kab/kec/desa)",
    filled: (d) => Boolean(
      d.provinsi?.trim() && d.kabupaten?.trim() && d.kecamatan?.trim() && d.desa?.trim()
    ),
    display: (d) => [d.provinsi, d.kabupaten, d.kecamatan, d.desa, d.rt && `RT ${d.rt}`, d.rw && `RW ${d.rw}`].filter(Boolean).join(", ") || d.addressLine || ""
  },
  {
    key: "lastEducation",
    label: "Pendidikan terakhir",
    filled: (d) => Boolean(d.lastEducation?.trim()),
    display: (d) => d.lastEducation || ""
  },
  {
    key: "institutionName",
    label: "Nama institusi",
    filled: (d) => Boolean(d.institutionName?.trim()),
    display: (d) => d.institutionName || ""
  },
  {
    key: "major",
    label: "Jurusan",
    filled: (d) => Boolean(d.major?.trim()),
    display: (d) => d.major || ""
  },
  {
    key: "graduationYear",
    label: "Tahun lulus",
    filled: (d) => d.graduationYear != null && String(d.graduationYear).trim() !== "",
    display: (d) => d.graduationYear != null ? String(d.graduationYear) : ""
  },
  {
    key: "skills",
    label: "Keahlian",
    filled: (d) => Boolean(String(d.skills || "").trim()),
    display: (d) => String(d.skills || "")
  },
  {
    key: "workExperience",
    label: "Pengalaman kerja",
    filled: (d) => Boolean(d.workExperience?.trim()),
    display: (d) => d.workExperience || ""
  },
  {
    key: "bankName",
    label: "Nama bank",
    filled: (d) => Boolean(d.bankName?.trim()),
    display: (d) => d.bankName || ""
  },
  {
    key: "accountNumber",
    label: "Nomor rekening",
    filled: (d) => Boolean(d.accountNumber?.trim()),
    display: (d) => d.accountNumber || ""
  },
  {
    key: "emergencyName",
    label: "Kontak darurat",
    filled: (d) => Boolean(d.emergencyName?.trim()),
    display: (d) => d.emergencyName || ""
  },
  {
    key: "emergencyRelation",
    label: "Hubungan darurat",
    filled: (d) => Boolean(d.emergencyRelation?.trim()),
    display: (d) => d.emergencyRelation || ""
  },
  {
    key: "emergencyPhone",
    label: "Telepon darurat",
    filled: (d) => Boolean(d.emergencyPhone?.trim()),
    display: (d) => d.emergencyPhone || ""
  }
];
function isCorrectionMessage(content) {
  return /salah|bukan itu|maksudnya|koreksi|typo|harusnya|bukan,|keliru|ganti|maaf.*salah|salah ketik|bukan yang/i.test(
    content
  );
}
function inferExpectedField(assistantText) {
  const t = assistantText.toLowerCase();
  const asksName = /nama lengkap|nama sesuai|nama kamu|siapa nama|kenalan|sekalian nama|nama.*ktp/i.test(
    t
  );
  const asksPosition = /posisi|melamar|lamar/i.test(t);
  if (asksName && asksPosition) return null;
  if (asksName) return "fullName";
  if (/nomor kk|no\.?\s*kk|kartu keluarga/i.test(t)) return "kkNumber";
  if (/\bnik\b/i.test(t)) return "nik";
  if (asksPosition) return "positionApplied";
  if (/e-?mail/i.test(t)) return "email";
  if (/whatsapp|\bwa\b|nomor hp|no\.?\s*hp|telepon|handphone/i.test(t)) return "whatsappNumber";
  if (/\bnpwp\b/i.test(t)) return "npwp";
  if (/tempat lahir/i.test(t)) return "placeOfBirth";
  if (/tanggal lahir|tgl\.?\s*lahir/i.test(t)) return "dateOfBirth";
  if (/jenis kelamin/i.test(t)) return "gender";
  if (/\bagama\b/i.test(t)) return "religion";
  if (/status (nikah|perkawinan)|belum menikah|menikah/i.test(t)) return "maritalStatus";
  if (/relokasi|pindah (kerja|domisili)|buka.*pindah|siap.*pindah/i.test(t)) return "willingToRelocate";
  if (/sertifikat/i.test(t)) return "certifications";
  if (/\bprovinsi\b/i.test(t)) return "provinsi";
  if (/\bkabupaten\b|\bkota\b/i.test(t)) return "kabupaten";
  if (/\bkecamatan\b|\bkec\.?\b/i.test(t)) return "kecamatan";
  if (/\bdesa\b|\bkelurahan\b/i.test(t)) return "desa";
  if (/\brt\b|\brw\b/i.test(t)) return "rt";
  if (/\balamat\b/i.test(t)) return "addressLine";
  if (/pendidikan terakhir|pendidikan/i.test(t)) return "lastEducation";
  if (/nama (sekolah|institusi|kampus)/i.test(t)) return "institutionName";
  if (/jurusan|prodi/i.test(t)) return "major";
  if (/tahun lulus/i.test(t)) return "graduationYear";
  if (/keahlian|\bskill/i.test(t)) return "skills";
  if (/pengalaman kerja|pengalaman/i.test(t)) return "workExperience";
  if (/nama bank|\bbank\b/i.test(t)) return "bankName";
  if (/nomor rekening|no\.?\s*rekening|rekening/i.test(t)) return "accountNumber";
  if (/nama.*darurat|kontak darurat/i.test(t)) return "emergencyName";
  if (/hubungan.*darurat/i.test(t)) return "emergencyRelation";
  if (/telepon darurat|hp darurat|nomor darurat/i.test(t)) return "emergencyPhone";
  return null;
}
function parseName(raw) {
  let s = raw.trim();
  s = s.replace(/^(nama (lengkap )?(saya |aku )?|aku |saya |ini )/i, "").trim();
  s = s.replace(/[.,!?~]+$/g, "").trim();
  if (s.length < 2 || /^\d+$/.test(s) || /@/.test(s) || /^\+?\d{10,}$/.test(s.replace(/\s/g, ""))) {
    return null;
  }
  return s;
}
function parsePhone(raw) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+62") && digits.length >= 11) return digits;
  if (digits.startsWith("62") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("08") && digits.length >= 10) return `+62${digits.slice(1)}`;
  return null;
}
function parseDate(raw) {
  const iso = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const dmy = raw.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}
function describeIdValidation(raw, label) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (/^\d{16}$/.test(digits)) return null;
  if (digits.length < 16) return `${label} cuma ${digits.length} digit \u2014 harus tepat 16 angka ya`;
  return `${label} kepanjangan (${digits.length} digit) \u2014 harus tepat 16 angka ya`;
}
function normalizeFieldValue(field, content) {
  const trimmed = content.trim();
  if (!field || !trimmed) return null;
  switch (field) {
    case "fullName":
      return parseName(trimmed);
    case "nik":
    case "kkNumber":
      return parseSixteenDigitId(trimmed);
    case "email": {
      const match = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      return match ? match[0] : null;
    }
    case "whatsappNumber":
    case "emergencyPhone":
      return parsePhone(trimmed);
    case "dateOfBirth":
      return parseDate(trimmed);
    case "graduationYear": {
      const year = trimmed.match(/\b(19|20)\d{2}\b/);
      return year ? Number(year[0]) : null;
    }
    case "positionApplied": {
      const fromMsg = trimmed.match(/(?:lamar|melamar|posisi|jadi|untuk)\s+(.+?)(?:\.|,|$)/i);
      if (fromMsg) return fromMsg[1].trim();
      if (!/^(nama|saya|aku)\b/i.test(trimmed) && trimmed.length < 80) return trimmed;
      return null;
    }
    case "willingToRelocate": {
      const t = trimmed.toLowerCase();
      if (/^(ya|yes|siap|boleh|ok|oke|open)$/i.test(t)) return "Ya";
      if (/^(tidak|nggak|gk|ga|no|belum)$/i.test(t)) return "Tidak";
      if (/belum tahu|gk tahu|ga tahu|lupa|ragu/i.test(t)) return null;
      return null;
    }
    default:
      if (/^(ya|tidak|laki|perempuan|islam|kristen|katolik|hindu|buddha)$/i.test(trimmed)) {
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      }
      if (/^(gk tahu|ga tahu|belum tahu|lupa|ragu)/i.test(trimmed)) return null;
      return trimmed.length > 0 && trimmed.length < 200 ? trimmed : null;
  }
}
function opportunisticExtract(content, out, expectedField) {
  if (!out.email) {
    const email = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (email) out.email = email[0];
  }
  if (!out.whatsappNumber) {
    const phone = parsePhone(content);
    if (phone) out.whatsappNumber = phone;
  }
  const sixteen = parseSixteenDigitId(content);
  if (sixteen) {
    const lower = content.toLowerCase();
    if (expectedField === "nik" || !out.nik && /nik/i.test(lower) && expectedField !== "kkNumber") {
      out.nik = sixteen;
    } else if (expectedField === "kkNumber" || !out.kkNumber && /(kk|kartu keluarga)/i.test(lower) && expectedField !== "nik") {
      out.kkNumber = sixteen;
    } else if (expectedField === "nik") {
      out.nik = sixteen;
    } else if (expectedField === "kkNumber") {
      out.kkNumber = sixteen;
    }
  }
  if (!out.fullName) {
    const intro = content.match(
      /nama (?:saya |aku )?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{1,60}?)(?=\s*(?:,|\.|dan |mau |ingin |lamar |$))/i
    );
    if (intro) {
      const name = parseName(intro[1]);
      if (name) out.fullName = name;
    }
  }
  if (!out.positionApplied) {
    const pos = content.match(/(?:mau |ingin )?(?:lamar|jadi|melamar)\s+(?:posisi\s+)?(.+?)(?:\.|,|$)/i);
    if (pos) out.positionApplied = pos[1].trim();
  }
}
function applyCorrections(content, out) {
  if (!isCorrectionMessage(content)) return;
  const nik = parseSixteenDigitId(content);
  if (nik && /nik/i.test(content)) out.nik = nik;
  const kk = parseSixteenDigitId(content);
  if (kk && /(kk|kartu keluarga)/i.test(content)) out.kkNumber = kk;
  const email = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (email) out.email = email[0];
  const phone = parsePhone(content);
  if (phone) out.whatsappNumber = phone;
  const name = content.match(
    /nama (?:saya |aku |lengkap )?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{2,60})/i
  );
  if (name) {
    const parsed = parseName(name[1]);
    if (parsed) out.fullName = parsed;
  }
}
function getNextMissingField(data) {
  return COLLECTION_ORDER.find((f) => !f.filled(data)) ?? null;
}
function extractFieldsFromChat(messages) {
  const out = {};
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "assistant") continue;
    const json = findJsonInText(messages[i].content);
    if (!json) continue;
    try {
      const parsed = JSON.parse(json);
      if (parsed.nik && !isNikValid(parsed.nik)) delete parsed.nik;
      if (parsed.kkNumber && !isNikValid(parsed.kkNumber)) delete parsed.kkNumber;
      Object.assign(out, parsed);
      break;
    } catch {
    }
  }
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user") continue;
    const content = msg.content.trim();
    if (!content) continue;
    let prevAssistant = "";
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j].role === "assistant") {
        prevAssistant = messages[j].content;
        break;
      }
    }
    const field = inferExpectedField(prevAssistant);
    const value = normalizeFieldValue(field, content);
    if (field && value != null && value !== "") {
      out[field] = value;
    }
    applyCorrections(content, out);
    opportunisticExtract(content, out, field);
  }
  if (out.nik && !isNikValid(out.nik)) delete out.nik;
  if (out.kkNumber && !isNikValid(out.kkNumber)) delete out.kkNumber;
  return out;
}
function formatKnownFieldsContext(data) {
  const filled = COLLECTION_ORDER.filter((f) => f.filled(data));
  const missing = COLLECTION_ORDER.filter((f) => !f.filled(data));
  const next = missing[0];
  const filledLines = filled.map((f) => `\u2713 ${f.label}: ${f.display(data)}`);
  const lines = [];
  if (filledLines.length > 0) {
    lines.push("SUDAH TERISI (ingat & jangan tanya ulang):");
    lines.push(...filledLines);
  } else {
    lines.push('SUDAH TERISI: belum ada \u2014 panggil "kamu", jangan nama dummy.');
  }
  if (missing.length > 0) {
    lines.push("");
    lines.push(`BELUM (${missing.length}): ${missing.map((f) => f.label).join(", ")}`);
    if (next) {
      lines.push(`LANJUTKAN: tanya HANYA "${next.label}" \u2014 jangan ulang field di atas.`);
    }
  } else {
    lines.push("");
    lines.push("SEMUA LENGKAP \u2014 siap output JSON.");
  }
  return lines.join("\n");
}
function formatLastTurnValidationHint(messages) {
  if (messages.length < 2) return "";
  const last = messages[messages.length - 1];
  const prev = messages[messages.length - 2];
  if (last.role !== "user" || prev.role !== "assistant") return "";
  const field = inferExpectedField(prev.content);
  if (field !== "nik" && field !== "kkNumber") return "";
  const label = field === "nik" ? "NIK" : "KK";
  const hint = describeIdValidation(last.content, label);
  if (!hint) return "";
  return `VALIDASI: jawaban ${label} user belum valid \u2014 ${hint}. Minta ulang dengan ramah, jangan anggap sudah benar.`;
}
function buildSaraChatContext(messages) {
  const data = extractFieldsFromChat(messages);
  const parts = [formatKnownFieldsContext(data)];
  const validation = formatLastTurnValidationHint(messages);
  if (validation) parts.push(validation);
  return parts.join("\n\n");
}

// lib/sara-komodo-chat.ts
var SARA_HF_MODEL = "Qwen/Qwen2.5-7B-Instruct";
var SARA_GEMINI_MODEL = "gemini-2.5-flash";
var HF_ROUTER_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
var SaraKomodoError = class extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "SaraKomodoError";
  }
  status;
  code;
};
var SARA_COMPANY_FACTS = `Lokasi/kontak (jawab singkat jika ditanya): outsourcing proyek industri \xB7 kantor pusat Bekasi (Summarecon) \xB7 cabang Morowali Sulteng \xB7 penempatan ikut site lowongan \xB7 perada.net \xB7 0858 9366 1683`;
var SARA_SYSTEM_INSTRUCTION = `
Kamu adalah Sara, asisten rekrutmen ramah dan santai dari PT Perdana Adi Yuda.

Gaya bicara:
- Gunakan "aku", "kamu", "ya", "sip", "oke", "noted", "gapapa"
- Santai, suportif, tidak kaku
- Maksimal 2-3 kalimat + 1 pertanyaan saja per respons
- Hindari: "Silakan", "Mohon", "Harap", "Untuk melanjutkan"

Aturan Memory & Anti-Repeat (PENTING!):
- Selalu baca candidateData / blok SUDAH TERISI di bawah sebelum menjawab
- Jika field sudah terisi dan valid (terutama NIK, KK, NPWP 16 digit), JANGAN tanya ulang
- Jika user bilang "sudah", "iya sudah", "tadi", "kan sudah" \u2192 langsung anggap sudah terisi dan lanjut ke field berikutnya
- Jangan ulangi validasi "harus 16 digit" berkali-kali
- Jika user mengoreksi, update memory dan konfirmasi singkat ("oke sip, noted")
- User tanya \u2192 jawab dulu, baru 1 pertanyaan data
- User gk tahu/lupa/ragu \u2192 sabar, jangan skip, jangan nebak
- Relokasi: willingToRelocate HANYA setelah Ya/Tidak eksplisit
- Nama dari memory saja; tanpa nama pakai "kamu". Dilarang nama dummy

Urutan pengisian yang ideal:
1. Nama lengkap
2. Posisi (jika sudah diketahui, skip)
3. NIK (16 digit)
4. Nomor KK (16 digit)
5. NPWP (16 digit)
6. Tempat & Tanggal Lahir
7. Gender, Agama, Status pernikahan, Relokasi
8. Email, WhatsApp, Alamat (prov/kab/kec/desa, RT/RW)
9. Pendidikan, Jurusan, Tahun lulus, Skills, Pengalaman
10. Bank & rekening, Kontak darurat

Jika user sudah jawab sebuah field, catat di memory dan jangan tanya lagi kecuali dia minta koreksi.
Ikuti LANJUTKAN di bawah \u2014 tanya HANYA 1 field berikutnya yang belum terisi.

${SARA_COMPANY_FACTS}

CHAT (belum lengkap): no JSON
Validasi: NIK/KK/NPWP tepat 16 digit angka \xB7 WA +62 \xB7 lahir YYYY-MM-DD
JSON (lengkap+valid): output HANYA satu object {\u2026}, no teks/markdown. graduationYear=number. Nilai ASLI dari memory/candidateData. Key wajib: positionApplied,fullName,nik,kkNumber,email,whatsappNumber,addressLine atau provinsi/kabupaten/kecamatan/desa,lastEducation,bankName,accountNumber,emergencyName,emergencyRelation,emergencyPhone + field urutan di atas
`.trim();
function buildSaraSystemInstruction(messages) {
  return `${SARA_SYSTEM_INSTRUCTION}

${buildSaraChatContext(messages)}`;
}
function sessionToChatMessages(session) {
  return session.messages.map(({ role, content }) => ({
    role: role === "assistant" ? "assistant" : "user",
    content
  }));
}
async function callSaraChatForSession(session) {
  const messages = sessionToChatMessages(session).slice(-12);
  return callSaraChat(messages);
}
function getIhkToken() {
  let token = process.env.IHK_TOKEN?.trim() ?? "";
  if (token.startsWith('"') && token.endsWith('"') || token.startsWith("'") && token.endsWith("'")) {
    token = token.slice(1, -1).trim();
  }
  if (!token) {
    throw new SaraKomodoError(
      "IHK_TOKEN belum dikonfigurasi di Vercel Environment Variables.",
      503,
      "TOKEN_MISSING"
    );
  }
  if (/^https?:\/\//i.test(token) || !token.startsWith("hf_")) {
    throw new SaraKomodoError(
      "IHK_TOKEN tidak valid \u2014 gunakan token Hugging Face (format hf_...), bukan URL halaman settings.",
      503,
      "TOKEN_MISSING"
    );
  }
  return token;
}
function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new SaraKomodoError(
      "GEMINI_API_KEY belum dikonfigurasi di server.",
      503,
      "TOKEN_MISSING"
    );
  }
  return apiKey;
}
function mapHfError(status, body) {
  const detail = typeof body === "object" && body !== null ? JSON.stringify(body) : String(body ?? "");
  if (status === 401 || status === 403) {
    return new SaraKomodoError(
      "Token Hugging Face tidak valid atau tidak memiliki akses ke model Qwen.",
      401,
      "AUTH_FAILED"
    );
  }
  if (status === 402 || status === 429) {
    return new SaraKomodoError(
      "Maaf, kuota Hugging Face Inference sedang habis. Silakan coba lagi dalam beberapa saat.",
      429,
      "QUOTA_EXCEEDED"
    );
  }
  if (status === 503) {
    const estimated = typeof body === "object" && body !== null && "estimated_time" in body && typeof body.estimated_time === "number" ? Math.ceil(body.estimated_time) : 20;
    const err = new SaraKomodoError(
      `Model Qwen sedang dimuat di Hugging Face. Coba lagi sekitar ${estimated} detik.`,
      503,
      "MODEL_LOADING"
    );
    err.retryAfter = estimated;
    return err;
  }
  return new SaraKomodoError(
    `Gangguan Hugging Face Inference (${status}). ${detail.slice(0, 200)}`,
    502,
    "API_ERROR"
  );
}
function extractReplyText(data) {
  if (!data || typeof data !== "object") return "";
  const record = data;
  const chatContent = record.choices?.[0]?.message?.content;
  if (typeof chatContent === "string") return chatContent.trim();
  if (Array.isArray(record)) {
    const first = record[0];
    if (typeof first?.generated_text === "string") return first.generated_text.trim();
  }
  if (typeof record.generated_text === "string") return record.generated_text.trim();
  return "";
}
async function postHfChat(token, messages) {
  const hfMessages = [
    { role: "system", content: buildSaraSystemInstruction(messages) },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content
    }))
  ];
  const response = await fetch(HF_ROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: SARA_HF_MODEL,
      messages: hfMessages,
      temperature: 0.35,
      max_tokens: 512
    })
  });
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { error: raw };
  }
  if (!response.ok) {
    throw mapHfError(response.status, data);
  }
  const reply = extractReplyText(data);
  if (!reply) {
    throw new SaraKomodoError(
      "Model Qwen mengembalikan respons kosong. Silakan coba lagi.",
      502,
      "EMPTY_REPLY"
    );
  }
  return reply;
}
async function callQwenSaraChat(messages) {
  const token = getIhkToken();
  return postHfChat(token, messages);
}
async function callGeminiSaraChat(messages) {
  const ai = new import_genai.GoogleGenAI({ apiKey: getGeminiApiKey() });
  const response = await ai.models.generateContent({
    model: SARA_GEMINI_MODEL,
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: buildSaraSystemInstruction(messages),
      temperature: 0.35,
      maxOutputTokens: 512
    }
  });
  const reply = response.text?.trim();
  if (!reply) {
    throw new SaraKomodoError(
      "Gemini mengembalikan respons kosong. Silakan coba lagi.",
      502,
      "EMPTY_REPLY"
    );
  }
  return reply;
}
async function callSaraChat(messages) {
  try {
    const reply = await callQwenSaraChat(messages);
    return { reply, model: SARA_HF_MODEL };
  } catch (qwenError) {
    console.warn("Sara Qwen HF failed, falling back to Gemini:", qwenError);
    try {
      const reply = await callGeminiSaraChat(messages);
      return { reply, model: SARA_GEMINI_MODEL };
    } catch (geminiError) {
      if (geminiError instanceof SaraKomodoError) throw geminiError;
      const message = geminiError instanceof Error ? geminiError.message : "Gagal memanggil Gemini.";
      throw new SaraKomodoError(
        `Maaf, layanan AI Sara tidak tersedia. ${message}`,
        500,
        "API_ERROR"
      );
    }
  }
}
function saraKomodoErrorResponse(err) {
  const body = { error: err.message, code: err.code };
  const retryAfter = err.retryAfter;
  if (retryAfter) body.retryAfter = retryAfter;
  return { status: err.status, body };
}

// lib/sara-memory.ts
var import_crypto = require("crypto");
var SARA_SESSIONS_COLLECTION = "sara_sessions";
var localStore = /* @__PURE__ */ new Map();
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function normalizeRole(role) {
  return role === "assistant" ? "assistant" : "user";
}
function resolveCurrentStep(messages, candidateData) {
  const turns = messages.map((m) => ({ role: m.role, content: m.content }));
  const data = Object.keys(candidateData).length > 0 ? candidateData : extractFieldsFromChat(turns);
  const next = getNextMissingField(data);
  return next?.label ?? "complete";
}
function recomputeSession(session) {
  const turns = session.messages.map((m) => ({ role: m.role, content: m.content }));
  session.candidateData = extractFieldsFromChat(turns);
  session.currentStep = resolveCurrentStep(session.messages, session.candidateData);
  session.lastUpdated = nowIso();
  return session;
}
function cloneSession(session) {
  return {
    ...session,
    messages: session.messages.map((m) => ({ ...m })),
    candidateData: { ...session.candidateData }
  };
}
function stripUndefined(value) {
  if (value === void 0) return value;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item));
  }
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== void 0) out[key] = stripUndefined(val);
  }
  return out;
}
async function persistSession(session) {
  localStore.set(session.sessionId, cloneSession(session));
  if (!isAdminConfigured()) return;
  try {
    const db = await getAdminDb();
    const { sessionId, ...data } = session;
    await db.collection(SARA_SESSIONS_COLLECTION).doc(sessionId).set(stripUndefined(data), { merge: true });
  } catch (error) {
    console.warn("Sara session Firestore persist failed (using in-memory cache):", error);
  }
}
function docToSession(sessionId, data) {
  const messages = Array.isArray(data.messages) ? data.messages.map((m) => ({
    role: normalizeRole(String(m.role)),
    content: String(m.content ?? ""),
    timestamp: String(m.timestamp ?? nowIso())
  })) : [];
  return {
    sessionId,
    userId: typeof data.userId === "string" ? data.userId : void 0,
    createdAt: String(data.createdAt ?? nowIso()),
    lastUpdated: String(data.lastUpdated ?? nowIso()),
    messages,
    candidateData: data.candidateData ?? {},
    currentStep: String(data.currentStep ?? "start")
  };
}
function isSaraMemoryEnabled() {
  return isAdminConfigured() || localStore.size > 0;
}
async function createSession(userId, initialMessages = []) {
  const sessionId = (0, import_crypto.randomUUID)();
  const now = nowIso();
  const session = {
    sessionId,
    userId: userId?.trim() || void 0,
    createdAt: now,
    lastUpdated: now,
    messages: initialMessages.map((m) => ({
      role: normalizeRole(m.role),
      content: String(m.content),
      timestamp: m.timestamp || now
    })),
    candidateData: {},
    currentStep: "start"
  };
  recomputeSession(session);
  await persistSession(session);
  return cloneSession(session);
}
async function getSession(sessionId) {
  const cached = localStore.get(sessionId);
  if (cached) return cloneSession(cached);
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db.collection(SARA_SESSIONS_COLLECTION).doc(sessionId).get();
  if (!snap.exists) return null;
  const session = docToSession(sessionId, snap.data());
  localStore.set(sessionId, cloneSession(session));
  return cloneSession(session);
}
async function addMessage(sessionId, role, content) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Sara session not found: ${sessionId}`);
  }
  session.messages.push({
    role,
    content: String(content),
    timestamp: nowIso()
  });
  recomputeSession(session);
  await persistSession(session);
  return cloneSession(session);
}
async function syncSessionMessages(sessionId, clientMessages) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Sara session not found: ${sessionId}`);
  }
  const normalized = clientMessages.map((m) => ({
    role: normalizeRole(m.role),
    content: String(m.content ?? ""),
    timestamp: nowIso()
  }));
  if (normalized.length >= session.messages.length) {
    session.messages = normalized;
    recomputeSession(session);
    await persistSession(session);
  }
  return cloneSession(session);
}
function toMemoryMessages(messages) {
  const now = nowIso();
  return messages.map((m) => ({
    role: normalizeRole(m.role),
    content: String(m.content ?? ""),
    timestamp: now
  }));
}
async function prepareSaraSessionForTurn(options) {
  const { sessionId, userId, messages, message } = options;
  if (sessionId) {
    let session = await getSession(sessionId);
    if (!session) {
      const fresh = await createSession(userId, messages ? toMemoryMessages(messages) : []);
      if (message?.trim()) {
        return addMessage(fresh.sessionId, "user", message.trim());
      }
      return fresh;
    }
    if (message?.trim()) {
      return addMessage(session.sessionId, "user", message.trim());
    }
    if (messages?.length) {
      return syncSessionMessages(sessionId, messages);
    }
    return session;
  }
  if (messages?.length) {
    return createSession(userId, toMemoryMessages(messages));
  }
  if (message?.trim()) {
    const session = await createSession(userId);
    return addMessage(session.sessionId, "user", message.trim());
  }
  return createSession(userId);
}

// api/recruitment-chat.ts
async function handler(req, res) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.chat, requireOrigin: true })) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { sessionId, userId, message, messages } = req.body ?? {};
  const hasMessage = typeof message === "string" && message.trim().length > 0;
  const hasMessages = Array.isArray(messages) && messages.length > 0;
  if (!hasMessage && !hasMessages) {
    return res.status(400).json({
      error: "Field 'message' atau 'messages' wajib diisi"
    });
  }
  try {
    let session = await prepareSaraSessionForTurn({
      sessionId: typeof sessionId === "string" ? sessionId : void 0,
      userId: typeof userId === "string" ? userId : void 0,
      messages: hasMessages ? messages : void 0,
      message: hasMessage ? message : void 0
    });
    const { reply: rawReply, model } = await callSaraChatForSession(session);
    const pureJson = extractPureJsonReply(rawReply);
    const replyText = pureJson ?? rawReply;
    session = await addMessage(session.sessionId, "assistant", replyText);
    let savedCandidate = null;
    let saveWarning = null;
    if (pureJson && !isAdminConfigured()) {
      saveWarning = "Firebase Admin belum dikonfigurasi \u2014 data tidak disimpan ke Firestore.";
    } else if (pureJson) {
      try {
        savedCandidate = await trySaveCandidateFromReply(replyText);
        if (!savedCandidate) {
          saveWarning = "JSON terdeteksi tetapi gagal disimpan (data belum valid atau error Firestore).";
        }
      } catch (saveError) {
        saveWarning = formatFirebaseError(saveError);
        console.error("Auto-save candidate error:", saveError);
      }
    }
    return res.status(200).json({
      reply: replyText,
      sessionId: session.sessionId,
      candidateData: session.candidateData,
      currentStep: session.currentStep,
      memoryEnabled: isSaraMemoryEnabled(),
      saved: Boolean(savedCandidate),
      candidateId: savedCandidate?.id ?? null,
      collection: savedCandidate ? "candidates" : null,
      isPureJson: Boolean(pureJson),
      saveWarning,
      model
    });
  } catch (error) {
    if (error instanceof SaraKomodoError) {
      const { status, body } = saraKomodoErrorResponse(error);
      console.error("Sara chat error:", error.code, error.message);
      return res.status(status).json(body);
    }
    console.error("Recruitment chat error:", error);
    return res.status(500).json({
      error: "Maaf, terjadi gangguan pada layanan AI Sara. Silakan coba lagi nanti.",
      code: "API_ERROR"
    });
  }
}
if (module.exports.default) module.exports = module.exports.default;
