// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
function toErrorPayload(error) {
  const payload = {
    error: formatFirebaseError(error) || "Internal server error"
  };
  if (isFirebaseConfigError(error) && error.missing?.length) {
    payload.missing = error.missing;
    payload.hint = "Set env vars di Vercel \u2192 Project Settings \u2192 Environment Variables (Production).";
  }
  if (isFirebaseConnectionError(error)) {
    payload.code = "FIREBASE_CONNECTION_ERROR";
  }
  if (isFirebaseConfigError(error)) {
    payload.code = "FIREBASE_CONFIG_ERROR";
  }
  return payload;
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
    const app = getOrInitApp();
    const { databaseId } = getAdminEnv();
    cachedDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    return cachedDb;
  } catch (error) {
    if (error instanceof FirebaseConfigError) throw error;
    throw new FirebaseConnectionError("Gagal menginisialisasi koneksi Firestore Admin.", error);
  }
}

// lib/firestore-serialize.ts
function serializeFirestoreValue(value) {
  if (value === null || value === void 0) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (typeof value === "object") {
    const obj = value;
    if ("_seconds" in obj && "_nanoseconds" in obj) {
      const ms = Number(obj._seconds) * 1e3 + Number(obj._nanoseconds) / 1e6;
      return new Date(ms).toISOString();
    }
    if (typeof obj.toDate === "function") {
      return obj.toDate().toISOString();
    }
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = serializeFirestoreValue(val);
    }
    return result;
  }
  return value;
}
function docToPlainObject(id, data) {
  const serialized = serializeFirestoreValue(data);
  return { id, ...serialized };
}

// lib/job-record.ts
var JOBS_COLLECTION = "jobs";
var JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
function parseCreatedAt(value) {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    const obj = value;
    if ("_seconds" in obj) {
      const ms = Number(obj._seconds) * 1e3 + Number(obj._nanoseconds ?? 0) / 1e6;
      return new Date(ms).toISOString();
    }
    if (typeof obj.toDate === "function") {
      return obj.toDate().toISOString();
    }
  }
  return (/* @__PURE__ */ new Date()).toISOString();
}
function parseStringArray(value) {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
function parseBool(value, defaultValue = true) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return defaultValue;
}
function parseJobType(value) {
  const raw = String(value ?? "Contract");
  return JOB_TYPES.includes(raw) ? raw : "Contract";
}
function normalizeJobFromFirestore(raw) {
  const id = String(raw.id ?? "");
  return {
    id,
    title: String(raw.title ?? "Lowongan"),
    department: String(raw.department ?? ""),
    location: String(raw.location ?? ""),
    latitude: raw.latitude != null && raw.latitude !== "" ? Number(raw.latitude) : void 0,
    longitude: raw.longitude != null && raw.longitude !== "" ? Number(raw.longitude) : void 0,
    clientId: raw.clientId != null && raw.clientId !== "" ? String(raw.clientId) : void 0,
    projectId: raw.projectId != null && raw.projectId !== "" ? String(raw.projectId) : void 0,
    type: parseJobType(raw.type),
    description: String(raw.description ?? ""),
    requirements: parseStringArray(raw.requirements),
    salaryRange: raw.salaryRange != null ? String(raw.salaryRange) : void 0,
    isActive: parseBool(raw.isActive, true),
    createdAt: parseCreatedAt(raw.createdAt),
    minEducation: raw.minEducation != null ? String(raw.minEducation) : void 0,
    maxAge: raw.maxAge != null && raw.maxAge !== "" ? Number(raw.maxAge) : void 0,
    genderPreference: raw.genderPreference,
    requiredSkillsList: parseStringArray(raw.requiredSkillsList ?? raw.requiredSkills)
  };
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
async function readCollectionDocs(db, collection) {
  const snap = await db.collection(collection).get();
  return snap.docs.map((doc) => docToPlainObject(doc.id, doc.data()));
}
async function listCollection(collection) {
  const db = await getAdminDbOrThrow();
  try {
    return await readCollectionDocs(db, collection);
  } catch (error) {
    if (error instanceof FirebaseConfigError || error instanceof FirebaseConnectionError) {
      throw error;
    }
    throw new FirebaseConnectionError(
      `Gagal membaca collection "${collection}" dari Firestore.`,
      error
    );
  }
}
async function listJobs() {
  const db = await getAdminDbOrThrow();
  try {
    const snap = await db.collection(JOBS_COLLECTION).orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => docToPlainObject(doc.id, doc.data()));
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("index") || message.includes("order")) {
      try {
        return await readCollectionDocs(db, JOBS_COLLECTION);
      } catch (fallbackError) {
        throw new FirebaseConnectionError(
          'Gagal membaca collection "jobs" dari Firestore.',
          fallbackError
        );
      }
    }
    if (error instanceof FirebaseConfigError || error instanceof FirebaseConnectionError) {
      throw error;
    }
    throw new FirebaseConnectionError('Gagal membaca collection "jobs" dari Firestore.', error);
  }
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

// lib/api-handler.ts
function withApiHandler(handler2) {
  return async (req, res) => {
    try {
      applyCors(res);
      applyNoStoreHeaders(res);
      if (handleOptions(req, res)) return;
      await handler2(req, res);
    } catch (error) {
      console.error("Unhandled API error:", error);
      if (!res.headersSent) {
        res.status(toHttpStatus(error)).json(toErrorPayload(error));
      }
    }
  };
}
function sendApiError(res, error) {
  const status = toHttpStatus(error);
  console.error(`API error (${status}):`, formatFirebaseError(error));
  res.status(status).json(toErrorPayload(error));
}

// api/db/[collection].ts
async function handler(req, res) {
  const collection = Array.isArray(req.query?.collection) ? req.query.collection[0] : req.query?.collection;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!collection || typeof collection !== "string") {
    return res.status(400).json({ error: "Collection name required" });
  }
  try {
    if (collection === JOBS_COLLECTION) {
      const list2 = await listJobs();
      const jobs = list2.map((doc) => normalizeJobFromFirestore(doc));
      return res.status(200).json(jobs);
    }
    const list = await listCollection(collection);
    return res.status(200).json(list);
  } catch (error) {
    sendApiError(res, error);
  }
}
var collection_default = withApiHandler(handler);
export {
  collection_default as default
};
