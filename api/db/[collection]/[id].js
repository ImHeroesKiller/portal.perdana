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
async function setDocument(collection, id, data) {
  const db = await getAdminDbOrThrow();
  await db.collection(collection).doc(id).set(data);
  return { id };
}
async function updateDocument(collection, id, updates) {
  const db = await getAdminDbOrThrow();
  await db.collection(collection).doc(id).update(updates);
  return { id };
}
async function deleteDocument(collection, id) {
  const db = await getAdminDbOrThrow();
  await db.collection(collection).doc(id).delete();
  return { id };
}

// api/db/[collection]/[id].ts
async function handler(req, res) {
  applyCors(res);
  applyNoStoreHeaders(res);
  if (handleOptions(req, res)) return;
  const { collection, id } = req.query;
  if (!collection || typeof collection !== "string" || !id || typeof id !== "string") {
    return res.status(400).json({ error: "Collection and document id required" });
  }
  try {
    if (req.method === "POST") {
      const result = await setDocument(collection, id, req.body ?? {});
      return res.status(200).json({ success: true, ...result });
    }
    if (req.method === "PUT") {
      const result = await updateDocument(collection, id, req.body ?? {});
      return res.status(200).json({ success: true, ...result });
    }
    if (req.method === "DELETE") {
      const result = await deleteDocument(collection, id);
      return res.status(200).json({ success: true, ...result });
    }
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(`${req.method} /api/db/${collection}/${id} error:`, error);
    return res.status(toHttpStatus(error)).json({
      error: formatFirebaseError(error) || "Database operation failed"
    });
  }
}
export {
  handler as default
};
