const { getDb, docToPlain, applyCors, toStatus } = require('../_helpers/firebase');

const JOBS_COLLECTION = 'jobs';

function parseStringArray(value) {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function parseCreatedAt(value) {
  if (typeof value === 'string' && value.trim()) return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') {
    if ('_seconds' in value) {
      const ms = Number(value._seconds) * 1000 + Number(value._nanoseconds || 0) / 1_000_000;
      return new Date(ms).toISOString();
    }
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeJob(raw) {
  const types = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const type = types.includes(String(raw.type)) ? String(raw.type) : 'Contract';
  return {
    id: String(raw.id || ''),
    title: String(raw.title || 'Lowongan'),
    department: String(raw.department || ''),
    location: String(raw.location || ''),
    latitude: raw.latitude != null && raw.latitude !== '' ? Number(raw.latitude) : undefined,
    longitude: raw.longitude != null && raw.longitude !== '' ? Number(raw.longitude) : undefined,
    clientId: raw.clientId != null && raw.clientId !== '' ? String(raw.clientId) : undefined,
    projectId: raw.projectId != null && raw.projectId !== '' ? String(raw.projectId) : undefined,
    type,
    description: String(raw.description || ''),
    requirements: parseStringArray(raw.requirements),
    salaryRange: raw.salaryRange != null ? String(raw.salaryRange) : undefined,
    isActive: raw.isActive === false || raw.isActive === 'false' || raw.isActive === 0 ? false : true,
    createdAt: parseCreatedAt(raw.createdAt),
    minEducation: raw.minEducation != null ? String(raw.minEducation) : undefined,
    maxAge: raw.maxAge != null && raw.maxAge !== '' ? Number(raw.maxAge) : undefined,
    genderPreference: raw.genderPreference,
    requiredSkillsList: parseStringArray(raw.requiredSkillsList || raw.requiredSkills),
  };
}

async function listCollection(collection) {
  const db = getDb();
  const snap = await db.collection(collection).get();
  return snap.docs.map((doc) => docToPlain(doc.id, doc.data()));
}

async function listJobs() {
  const db = getDb();
  try {
    const snap = await db.collection(JOBS_COLLECTION).orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => docToPlain(doc.id, doc.data()));
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('index') || message.includes('order')) {
      return listCollection(JOBS_COLLECTION);
    }
    throw error;
  }
}

module.exports = async function handler(req, res) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const collection = Array.isArray(req.query?.collection)
    ? req.query.collection[0]
    : req.query?.collection;

  if (!collection || typeof collection !== 'string') {
    return res.status(400).json({ error: 'Collection name required' });
  }

  try {
    if (collection === JOBS_COLLECTION) {
      const list = await listJobs();
      return res.status(200).json(list.map((doc) => normalizeJob(doc)));
    }
    const list = await listCollection(collection);
    return res.status(200).json(list);
  } catch (error) {
    console.error(`GET /api/db/${collection} error:`, error);
    const status = toStatus(error);
    const payload = { error: error?.message || 'Failed to fetch collection' };
    if (error?.missing) payload.missing = error.missing;
    return res.status(status).json(payload);
  }
};