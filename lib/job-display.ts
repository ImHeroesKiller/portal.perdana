import type { JobVacancy } from '../types';

export type JobDisplayFields = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
};

const GENERIC_TITLE_VALUES = new Set([
  'lowongan',
  'job',
  'vacancy',
  'posisi',
  'position',
  '-',
  'n/a',
  'na',
  'undefined',
  'null',
]);

const TITLE_KEYS = [
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
] as const;

const DEPT_KEYS = ['department', 'dept', 'sector', 'divisi', 'division', 'category'] as const;

const LOCATION_KEYS = [
  'location',
  'lokasi',
  'site',
  'placement',
  'workLocation',
  'penempatan',
  'city',
] as const;

function safeString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['value', 'text', 'label', 'name', 'title']) {
      const nested = safeString(obj[key]);
      if (nested) return nested;
    }
    return fallback;
  }
  const text = String(value).trim();
  return text || fallback;
}

function isMeaningfulTitle(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return false;
  return !GENERIC_TITLE_VALUES.has(text.toLowerCase());
}

/** Gabungkan field root + nested `data` — jangan timpa nilai root yang sudah ada */
function unwrapJobRecord(job: JobVacancy): Record<string, unknown> {
  const raw = job as JobVacancy & Record<string, unknown>;
  const nested = raw.data;
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    return { ...raw };
  }

  const merged: Record<string, unknown> = { ...raw };
  for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
    const existing = safeString(merged[key]);
    const incoming = safeString(value);
    if (!existing && incoming) {
      merged[key] = value;
    } else if (!merged[key] && value != null) {
      merged[key] = value;
    }
  }
  return merged;
}

function buildCaseInsensitiveMap(record: Record<string, unknown>): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const [key, value] of Object.entries(record)) {
    map.set(key.toLowerCase(), value);
  }
  return map;
}

function pickFromRecord(record: Record<string, unknown>, keys: readonly string[]): string {
  const ci = buildCaseInsensitiveMap(record);
  for (const key of keys) {
    const direct = record[key];
    if (direct != null && safeString(direct)) return safeString(direct);
    const insensitive = ci.get(key.toLowerCase());
    if (insensitive != null && safeString(insensitive)) return safeString(insensitive);
  }
  return '';
}

function pickFirstString(sources: unknown[], fallback: string): string {
  for (const value of sources) {
    const text = safeString(value);
    if (text) return text;
  }
  return fallback;
}

/** Judul lowongan dari job + variasi field API (title, jobTitle, name, …) */
export function resolveJobTitle(job: JobVacancy): string {
  const raw = unwrapJobRecord(job);
  const sources: unknown[] = [
    job.title,
    ...TITLE_KEYS.map((key) => raw[key]),
  ];

  for (const value of sources) {
    if (isMeaningfulTitle(value)) {
      return safeString(value);
    }
  }

  const fromRecord = pickFromRecord(raw, TITLE_KEYS);
  if (isMeaningfulTitle(fromRecord)) return fromRecord;

  return 'Lowongan';
}

/** Kunci stabil untuk React list */
export function getJobKey(job: JobVacancy, index: number): string {
  const id = safeString(job.id);
  if (id) return id;
  return `${resolveJobTitle(job)}-${index}`;
}

/** Field aman untuk render UI */
export function getJobDisplayFields(job: JobVacancy): JobDisplayFields {
  const raw = unwrapJobRecord(job);
  const title = resolveJobTitle(job);

  const department = pickFirstString(
    [job.department, ...DEPT_KEYS.map((key) => raw[key])],
    'Umum'
  );

  const location = pickFirstString(
    [job.location, ...LOCATION_KEYS.map((key) => raw[key])],
    'Lokasi belum diisi'
  );

  const description =
    pickFirstString([job.description], '') ||
    pickFromRecord(raw, ['description', 'desc', 'deskripsi', 'summary', 'jobDescription']);

  const requirementsRaw = raw.requirements ?? raw.kualifikasi ?? raw.qualifications;
  const requirements = Array.isArray(requirementsRaw)
    ? requirementsRaw.map((r) => safeString(r)).filter(Boolean)
    : typeof requirementsRaw === 'string'
      ? requirementsRaw
          .split(/[\n,;]/)
          .map((r) => r.trim())
          .filter(Boolean)
      : [];

  return {
    id: safeString(job.id ?? raw.id),
    title,
    department,
    location,
    type: safeString(job.type ?? raw.type, 'Contract'),
    description,
    requirements,
  };
}

export function jobSearchHaystack(job: JobVacancy): string {
  const f = getJobDisplayFields(job);
  return [f.title, f.description, f.department, f.location, f.type].join(' ').toLowerCase();
}