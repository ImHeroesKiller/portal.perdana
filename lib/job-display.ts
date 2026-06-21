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

export type JobDetailFields = JobDisplayFields & {
  salaryRange?: string;
  minEducation?: string;
  maxAge?: number;
  genderPreference?: JobVacancy['genderPreference'];
  requiredSkills: string[];
  clientId?: string;
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

function parseSkillsList(raw: Record<string, unknown>, job: JobVacancy): string[] {
  const source = job.requiredSkillsList ?? raw.requiredSkillsList ?? raw.requiredSkills ?? raw.skills;
  if (Array.isArray(source)) {
    return source.map((s) => safeJobString(s)).filter(Boolean);
  }
  if (typeof source === 'string' && source.trim()) {
    return source
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Extended fields for job detail page */
export function getJobDetailFields(job: JobVacancy): JobDetailFields {
  const base = getJobDisplayFields(job);
  const raw = mergeJobNestedFields(job as JobVacancy & Record<string, unknown>);

  const salaryRange = safeJobString(job.salaryRange ?? raw.salaryRange ?? raw.gaji ?? raw.salary);
  const minEducation = safeJobString(
    job.minEducation ?? raw.minEducation ?? raw.pendidikan ?? raw.education
  );
  const maxAgeRaw = job.maxAge ?? raw.maxAge ?? raw.usia ?? raw.max_age;
  const maxAge =
    maxAgeRaw != null && maxAgeRaw !== '' && !Number.isNaN(Number(maxAgeRaw))
      ? Number(maxAgeRaw)
      : undefined;

  const genderRaw = job.genderPreference ?? raw.genderPreference ?? raw.gender;
  const genderPreference =
    genderRaw === 'Laki-laki' || genderRaw === 'Perempuan' || genderRaw === 'Any'
      ? genderRaw
      : undefined;

  return {
    ...base,
    salaryRange: salaryRange || undefined,
    minEducation: minEducation || undefined,
    maxAge,
    genderPreference,
    requiredSkills: parseSkillsList(raw, job),
    clientId: safeJobString(job.clientId ?? raw.clientId) || undefined,
  };
}

export function formatGenderPreference(value?: JobVacancy['genderPreference']): string {
  if (!value || value === 'Any') return 'Laki-laki & Perempuan';
  return value;
}

export function formatMaxAge(value?: number): string {
  if (value == null || Number.isNaN(value)) return 'Tidak dibatasi';
  return `Maks. ${value} tahun`;
}

export function formatSalaryRange(value?: string): string {
  if (!value) return 'Sesuai kesepakatan';
  return value;
}

/** Lamar CTA → halaman pilih metode (manual / AI Sara). */
export function buildJobApplyHref(job: JobVacancy, title?: string): string {
  const position = title || resolveJobTitle(job);
  const params = new URLSearchParams({ position });
  if (job.id) params.set('jobId', job.id);
  return `/apply/start?${params.toString()}`;
}

/** Dari halaman start → formulir dengan mode terpilih. */
export function buildApplyFormHref(options: {
  position?: string;
  jobId?: string;
  mode: 'manual' | 'ai' | 'google_form';
}): string {
  const params = new URLSearchParams();
  if (options.position) params.set('position', options.position);
  if (options.jobId) params.set('jobId', options.jobId);
  params.set('mode', options.mode);
  return `/apply?${params.toString()}`;
}

export function buildJobDetailHref(job: JobVacancy): string {
  const id = safeJobString(job.id);
  return id ? `/vacancies/${encodeURIComponent(id)}` : '/vacancies';
}