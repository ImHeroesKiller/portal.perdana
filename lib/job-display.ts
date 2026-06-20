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

function safeString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

/** Gabungkan field root + nested `data` dari Firestore */
function unwrapJobRecord(job: JobVacancy): Record<string, unknown> {
  const raw = job as JobVacancy & Record<string, unknown>;
  const nested = raw.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return { ...raw, ...(nested as Record<string, unknown>) };
  }
  return raw;
}

function pickFirstString(sources: unknown[], fallback: string): string {
  for (const value of sources) {
    const text = safeString(value);
    if (text) return text;
  }
  return fallback;
}

const TITLE_KEYS = [
  'title',
  'name',
  'position',
  'jobTitle',
  'nama',
  'judul',
  'namaLowongan',
  'positionName',
  'role',
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

/** Kunci stabil untuk React list — hindari duplikat id kosong */
export function getJobKey(job: JobVacancy, index: number): string {
  const id = safeString(job.id);
  if (id) return id;
  const title = safeString(job.title, 'job');
  return `${title}-${index}`;
}

/** Field aman untuk render UI — tangani variasi nama field dari API */
export function getJobDisplayFields(job: JobVacancy): JobDisplayFields {
  const raw = unwrapJobRecord(job);

  const title = pickFirstString(
    TITLE_KEYS.map((key) => raw[key] ?? (job as Record<string, unknown>)[key]),
    'Lowongan'
  );

  const department = pickFirstString(
    DEPT_KEYS.map((key) => raw[key]),
    'Umum'
  );

  const location = pickFirstString(
    LOCATION_KEYS.map((key) => raw[key]),
    'Lokasi belum diisi'
  );

  const description = pickFirstString(
    ['description', 'desc', 'deskripsi', 'summary', 'jobDescription'].map((key) => raw[key]),
    ''
  );

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