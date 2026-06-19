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

// api/submit-candidate.ts
var submit_candidate_exports = {};
__export(submit_candidate_exports, {
  default: () => handler
});
module.exports = __toCommonJS(submit_candidate_exports);

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

// lib/api-cors.ts
function applyCors(res) {
  applyNoStoreHeaders(res);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
}
function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

// lib/firebase-admin.ts
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");

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
var cachedApp = null;
var cachedDb = null;
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
  const existing = (0, import_app.getApps)();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }
  const env = getAdminEnv();
  try {
    cachedApp = (0, import_app.initializeApp)({
      credential: (0, import_app.cert)({
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
    const app = getOrInitApp();
    const { databaseId } = getAdminEnv();
    cachedDb = databaseId ? (0, import_firestore.getFirestore)(app, databaseId) : (0, import_firestore.getFirestore)(app);
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

// api/submit-candidate.ts
async function handler(req, res) {
  applyCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!isAdminConfigured()) {
    return res.status(503).json({
      error: "Firebase Admin belum dikonfigurasi di server.",
      missing: ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]
    });
  }
  const candidate = req.body?.candidate ?? req.body;
  if (!candidate || typeof candidate !== "object") {
    return res.status(400).json({ error: "Field 'candidate' wajib berupa object" });
  }
  if (!isCompleteCandidateData(candidate)) {
    return res.status(400).json({
      error: "Data kandidat belum lengkap.",
      required: [
        "fullName",
        "nik",
        "kkNumber",
        "email",
        "whatsappNumber",
        "positionApplied",
        "lastEducation",
        "bankName"
      ]
    });
  }
  try {
    const saved = await saveCandidateToFirestore(
      { ...candidate, source: req.body?.source || "api-submit" },
      { merge: Boolean(req.body?.merge) }
    );
    return res.status(200).json({
      success: true,
      id: saved.id,
      collection: "candidates",
      candidate: saved
    });
  } catch (error) {
    console.error("submit-candidate error:", error);
    return res.status(toHttpStatus(error)).json({
      error: formatFirebaseError(error) || "Gagal menyimpan kandidat ke Firestore."
    });
  }
}
if (module.exports.default) module.exports = module.exports.default;
