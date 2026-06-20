import type { JobVacancy } from '../types';
import {
  inspectJobTitleSources,
  mergeJobNestedFields,
  resolveJobTitleFromRaw,
  safeJobString,
} from './job-title-resolve';

export { inspectJobTitleSources, resolveJobTitleFromRaw };

export type JobDisplayFields = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
};

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

function pickFromRecord(record: Record<string, unknown>, keys: readonly string[]): string {
  const lowerMap = new Map<string, unknown>();
  for (const [key, value] of Object.entries(record)) {
    lowerMap.set(key.toLowerCase(), value);
  }
  for (const key of keys) {
    const direct = safeJobString(record[key]);
    if (direct) return direct;
    const insensitive = safeJobString(lowerMap.get(key.toLowerCase()));
    if (insensitive) return insensitive;
  }
  return '';
}

function pickFirstString(sources: unknown[], fallback: string): string {
  for (const value of sources) {
    const text = safeJobString(value);
    if (text) return text;
  }
  return fallback;
}

/** Judul lowongan — delegasi ke resolver JSON mentah */
export function resolveJobTitle(job: JobVacancy): string {
  return resolveJobTitleFromRaw(job as JobVacancy & Record<string, unknown>);
}

/** Kunci stabil untuk React list */
export function getJobKey(job: JobVacancy, index: number): string {
  const id = safeJobString(job.id);
  if (id) return id;
  return `${resolveJobTitle(job)}-${index}`;
}

/** Field aman untuk render UI */
export function getJobDisplayFields(job: JobVacancy): JobDisplayFields {
  const raw = mergeJobNestedFields(job as JobVacancy & Record<string, unknown>);
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
    ? requirementsRaw.map((r) => safeJobString(r)).filter(Boolean)
    : typeof requirementsRaw === 'string'
      ? requirementsRaw
          .split(/[\n,;]/)
          .map((r) => r.trim())
          .filter(Boolean)
      : [];

  return {
    id: safeJobString(job.id ?? raw.id),
    title,
    department,
    location,
    type: safeJobString(job.type ?? raw.type, 'Contract'),
    description,
    requirements,
  };
}

export function jobSearchHaystack(job: JobVacancy): string {
  const f = getJobDisplayFields(job);
  return [f.title, f.description, f.department, f.location, f.type].join(' ').toLowerCase();
}