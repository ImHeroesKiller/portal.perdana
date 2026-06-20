import type { JobVacancy } from '../types';

export const JOBS_COLLECTION = 'jobs';

const JOB_TYPES: JobVacancy['type'][] = ['Full-time', 'Part-time', 'Contract', 'Internship'];

function parseCreatedAt(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('_seconds' in obj) {
      const ms = Number(obj._seconds) * 1000 + Number(obj._nanoseconds ?? 0) / 1_000_000;
      return new Date(ms).toISOString();
    }
    if (typeof (obj as { toDate?: () => Date }).toDate === 'function') {
      return (obj as { toDate: () => Date }).toDate().toISOString();
    }
  }
  return new Date().toISOString();
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parseBool(value: unknown, defaultValue = true): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'yes' || normalized === 'aktif' || normalized === 'active') {
      return true;
    }
    if (
      normalized === 'false' ||
      normalized === 'no' ||
      normalized === 'nonaktif' ||
      normalized === 'inactive'
    ) {
      return false;
    }
  }
  return defaultValue;
}

function parseJobType(value: unknown): JobVacancy['type'] {
  const raw = String(value ?? 'Contract');
  return JOB_TYPES.includes(raw as JobVacancy['type']) ? (raw as JobVacancy['type']) : 'Contract';
}

function mergeNestedFields(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = raw.data;
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    return { ...raw };
  }

  const merged: Record<string, unknown> = { ...raw };
  for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
    const existing = merged[key];
    const hasExisting =
      existing != null && String(existing).trim() !== '' && String(existing).trim() !== 'Lowongan';
    const hasIncoming = value != null && String(value).trim() !== '';
    if (!hasExisting && hasIncoming) {
      merged[key] = value;
    }
  }
  return merged;
}

function pickField(raw: Record<string, unknown>, keys: string[], fallback = ''): string {
  const lowerMap = new Map<string, unknown>();
  for (const [key, value] of Object.entries(raw)) {
    lowerMap.set(key.toLowerCase(), value);
  }

  for (const key of keys) {
    const candidates = [raw[key], lowerMap.get(key.toLowerCase())];
    for (const value of candidates) {
      if (value != null && String(value).trim()) return String(value).trim();
    }
  }
  return fallback;
}

/** Normalize Firestore job doc for frontend (JobVacancy type). */
export function normalizeJobFromFirestore(raw: Record<string, unknown>): JobVacancy {
  const merged = mergeNestedFields(raw);
  const id = String(merged.id ?? merged._id ?? raw.id ?? '');

  return {
    id,
    title: pickField(merged, [
      'title',
      'jobTitle',
      'job_title',
      'name',
      'position',
      'positionName',
      'positionApplied',
      'nama',
      'judul',
      'namaLowongan',
      'namaJabatan',
      'jabatan',
      'posisi',
      'role',
      'label',
    ], 'Lowongan'),
    department: pickField(merged, ['department', 'dept', 'sector', 'divisi', 'division', 'category'], 'Umum'),
    location: pickField(merged, ['location', 'lokasi', 'site', 'placement', 'workLocation', 'penempatan', 'city']),
    latitude: merged.latitude != null && merged.latitude !== '' ? Number(merged.latitude) : undefined,
    longitude: merged.longitude != null && merged.longitude !== '' ? Number(merged.longitude) : undefined,
    clientId: merged.clientId != null && merged.clientId !== '' ? String(merged.clientId) : undefined,
    projectId: merged.projectId != null && merged.projectId !== '' ? String(merged.projectId) : undefined,
    type: parseJobType(merged.type),
    description: pickField(merged, ['description', 'desc', 'deskripsi', 'summary', 'jobDescription']),
    requirements: parseStringArray(merged.requirements ?? merged.kualifikasi ?? merged.qualifications),
    salaryRange: merged.salaryRange != null ? String(merged.salaryRange) : undefined,
    isActive: parseBool(merged.isActive, true),
    createdAt: parseCreatedAt(merged.createdAt),
    minEducation: merged.minEducation != null ? String(merged.minEducation) : undefined,
    maxAge: merged.maxAge != null && merged.maxAge !== '' ? Number(merged.maxAge) : undefined,
    genderPreference: merged.genderPreference as JobVacancy['genderPreference'],
    requiredSkillsList: parseStringArray(merged.requiredSkillsList ?? merged.requiredSkills),
  };
}