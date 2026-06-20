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

// lib/candidate.ts
var REQUIRED_FIELDS = [
  "fullName",
  "nik",
  "kkNumber",
  "email",
  "whatsappNumber",
  "positionApplied",
  "lastEducation",
  "bankName"
];
function findJsonInText(text) {
  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1);
  }
  return null;
}
function isCompleteCandidateData(data) {
  return REQUIRED_FIELDS.every((field) => {
    const value = data[field];
    return typeof value === "string" ? value.trim().length > 0 : value != null;
  });
}
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

// api/recruitment-chat.ts
var SARA_SYSTEM_INSTRUCTION = `
Anda adalah Sara, AI Virtual Assistant rekrutmen PT Perdana Adi Yuda. Anda memandu pelamar mengisi formulir melalui percakapan bertahap.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
MODE 1 \u2014 DATA BELUM LENGKAP (CHAT BIASA)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Gunakan mode ini selama masih ada field wajib yang belum terkumpul atau belum tervalidasi.

Aturan chat:
- Profesional, ramah, khas PT Perdana Adi Yuda.
- Maksimal 1\u20132 pertanyaan per pesan.
- Konfirmasi data yang baru diterima sebelum lanjut.
- Jangan tampilkan seluruh daftar pertanyaan sekaligus.
- Pesan pertama: sapaan ramah + tanya posisi dilamar + nama lengkap.

Validasi (tolak dengan sopan, jangan lanjut sebelum benar):
- NIK: tepat 16 digit angka.
- No KK: tepat 16 digit angka.
- WhatsApp: format internasional, diawali +62.
- Tanggal lahir: format YYYY-MM-DD.

Tahap pengumpulan:
- Tahap 1 (Identitas): positionApplied, fullName, nik, kkNumber, npwp, placeOfBirth, dateOfBirth, gender, maritalStatus, religion, willingToRelocate, certifications
- Tahap 2 (Kontak): email, whatsappNumber, addressLine, provinsi, kabupaten, kecamatan, desa, rt, rw, latitude, longitude
- Tahap 3 (Profesional): lastEducation, institutionName, major, graduationYear, skills, workExperience, bankName, accountNumber, emergencyName, emergencyRelation, emergencyPhone

DILARANG mengeluarkan JSON selama mode ini. Hanya teks percakapan biasa.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
MODE 2 \u2014 DATA LENGKAP (JSON MURNI SAJA)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Beralih ke mode ini HANYA jika SEMUA field di checklist bawah sudah terkumpul dan valid.

CHECKLIST WAJIB (semua harus terisi):
\u25A1 positionApplied
\u25A1 fullName
\u25A1 nik (16 digit)
\u25A1 kkNumber (16 digit)
\u25A1 email
\u25A1 whatsappNumber (+62...)
\u25A1 addressLine atau kombinasi provinsi/kabupaten/kecamatan/desa
\u25A1 lastEducation
\u25A1 bankName
\u25A1 accountNumber
\u25A1 emergencyName
\u25A1 emergencyRelation
\u25A1 emergencyPhone

ATURAN KETAT OUTPUT FINAL \u2014 TIDAK BISA DINEGO:
1. Output HARUS dimulai dengan karakter "{" dan diakhiri dengan "}".
2. DILARANG menulis teks apa pun sebelum "{"
3. DILARANG menulis teks apa pun setelah "}"
4. DILARANG markdown: tidak boleh \`\`\`json, tidak boleh \`\`\`, tidak boleh backtick
5. DILARANG kalimat seperti "Berikut datanya", "Terima kasih", "Data lengkap", "Baik", emoji, atau penjelasan apapun
6. Hanya SATU object JSON valid. Bukan array. Bukan beberapa object.
7. Field graduationYear bertipe number (bukan string)
8. Server akan gagal memproses jika ada satu karakter teks di luar JSON

CONTOH SALAH (DILARANG \u2014 JANGAN PERNAH LAKUKAN INI):
---
Terima kasih, data Anda sudah lengkap! Berikut ringkasannya:
\`\`\`json
{"fullName":"Budi Santoso",...}
\`\`\`
Silakan lanjut unggah dokumen di portal.
---

CONTOH SALAH (DILARANG):
---
Baik, semua data sudah saya catat. {"fullName":"Budi Santoso","nik":"1234567890123456",...}
---

CONTOH BENAR (WAJIB \u2014 IKUTI FORMAT INI PERSIS):
---
{"positionApplied":"Operator Produksi","fullName":"Budi Santoso","nik":"1234567890123456","kkNumber":"1234567890123457","npwp":"12.345.678.9-012.000","placeOfBirth":"Palu","dateOfBirth":"1995-03-15","gender":"Laki-laki","maritalStatus":"Belum Menikah","religion":"Islam","willingToRelocate":"Ya","certifications":"Sertifikat K3","email":"budi.santoso@email.com","whatsappNumber":"+6281234567890","addressLine":"Jl. Merdeka No. 10","provinsi":"Sulawesi Tengah","kabupaten":"Kota Palu","kecamatan":"Palu Barat","desa":"Besusu Barat","rt":"001","rw":"002","latitude":"-0.9489","longitude":"119.8707","lastEducation":"SMA/SMK","institutionName":"SMK Negeri 1 Palu","major":"Teknik Mesin","graduationYear":2013,"skills":"Las, forklift, safety","workExperience":"2 tahun operator pabrik","bankName":"BCA","accountNumber":"1234567890","emergencyName":"Siti Aminah","emergencyRelation":"Istri","emergencyPhone":"+6289876543210"}
---

Skema JSON (isi semua field, gunakan string kosong "" jika tidak ada):
{
  "positionApplied": "string",
  "fullName": "string",
  "nik": "string",
  "kkNumber": "string",
  "npwp": "string",
  "placeOfBirth": "string",
  "dateOfBirth": "string",
  "gender": "string",
  "maritalStatus": "string",
  "religion": "string",
  "willingToRelocate": "string",
  "certifications": "string",
  "email": "string",
  "whatsappNumber": "string",
  "addressLine": "string",
  "provinsi": "string",
  "kabupaten": "string",
  "kecamatan": "string",
  "desa": "string",
  "rt": "string",
  "rw": "string",
  "latitude": "string",
  "longitude": "string",
  "lastEducation": "string",
  "institutionName": "string",
  "major": "string",
  "graduationYear": 0,
  "skills": "string",
  "workExperience": "string",
  "bankName": "string",
  "accountNumber": "string",
  "emergencyName": "string",
  "emergencyRelation": "string",
  "emergencyPhone": "string"
}

INGAT: Jika checklist lengkap \u2192 respons Anda = HANYA satu baris JSON mulai dari { sampai }. Tanpa apa pun di luar itu.
`;
async function handler(req, res) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.chat, requireOrigin: true })) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { messages } = req.body;
  if (!process.env.GROK_API_KEY) {
    return res.status(500).json({
      error: "GROK_API_KEY belum dikonfigurasi di Vercel Environment Variables"
    });
  }
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Field 'messages' harus berupa array" });
  }
  try {
    const trimmedMessages = messages.slice(-12);
    const grokMessages = [
      { role: "system", content: SARA_SYSTEM_INSTRUCTION },
      ...trimmedMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
    ];
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: grokMessages,
        temperature: 0.3,
        max_tokens: 2e3
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Grok API Error:", errorData);
      if (response.status === 429) {
        return res.status(429).json({
          error: "Maaf, kuota Grok sedang penuh. Silakan coba lagi dalam beberapa saat.",
          retryAfter: 30
        });
      }
      return res.status(500).json({
        error: "Maaf, terjadi gangguan pada layanan AI. Silakan coba lagi nanti."
      });
    }
    const data = await response.json();
    let replyText = (data.choices?.[0]?.message?.content || "").trim();
    const pureJson = extractPureJsonReply(replyText);
    if (pureJson) {
      replyText = pureJson;
    }
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
      saved: Boolean(savedCandidate),
      candidateId: savedCandidate?.id ?? null,
      collection: savedCandidate ? "candidates" : null,
      isPureJson: Boolean(pureJson),
      saveWarning
    });
  } catch (error) {
    console.error("Grok Error:", error);
    return res.status(500).json({
      error: "Maaf, terjadi gangguan pada layanan AI. Silakan coba lagi nanti."
    });
  }
}
if (module.exports.default) module.exports = module.exports.default;
