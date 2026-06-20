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

/** Normalize Firestore job doc for frontend (JobVacancy type). */
export function normalizeJobFromFirestore(raw: Record<string, unknown>): JobVacancy {
  const id = String(raw.id ?? '');

  return {
    id,
    title: String(raw.title ?? 'Lowongan'),
    department: String(raw.department ?? ''),
    location: String(raw.location ?? ''),
    latitude: raw.latitude != null && raw.latitude !== '' ? Number(raw.latitude) : undefined,
    longitude: raw.longitude != null && raw.longitude !== '' ? Number(raw.longitude) : undefined,
    clientId: raw.clientId != null && raw.clientId !== '' ? String(raw.clientId) : undefined,
    projectId: raw.projectId != null && raw.projectId !== '' ? String(raw.projectId) : undefined,
    type: parseJobType(raw.type),
    description: String(raw.description ?? ''),
    requirements: parseStringArray(raw.requirements),
    salaryRange: raw.salaryRange != null ? String(raw.salaryRange) : undefined,
    isActive: parseBool(raw.isActive, true),
    createdAt: parseCreatedAt(raw.createdAt),
    minEducation: raw.minEducation != null ? String(raw.minEducation) : undefined,
    maxAge: raw.maxAge != null && raw.maxAge !== '' ? Number(raw.maxAge) : undefined,
    genderPreference: raw.genderPreference as JobVacancy['genderPreference'],
    requiredSkillsList: parseStringArray(raw.requiredSkillsList ?? raw.requiredSkills),
  };
}