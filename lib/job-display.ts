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
  return String(value).trim() || fallback;
}

/** Kunci stabil untuk React list — hindari duplikat id kosong */
export function getJobKey(job: JobVacancy, index: number): string {
  const id = safeString(job.id);
  if (id) return id;
  const title = safeString(job.title, 'job');
  return `${title}-${index}`;
}

/** Field aman untuk render UI — tangani variasi nama field dari API */
export function getJobDisplayFields(job: JobVacancy): JobDisplayFields {
  const raw = job as JobVacancy & Record<string, unknown>;

  return {
    id: safeString(job.id),
    title: safeString(raw.title ?? raw.name ?? raw.position ?? raw.jobTitle, 'Lowongan'),
    department: safeString(raw.department ?? raw.dept ?? raw.sector, 'Umum'),
    location: safeString(raw.location ?? raw.lokasi ?? raw.site, 'Lokasi belum diisi'),
    type: safeString(job.type, 'Contract'),
    description: safeString(job.description),
    requirements: Array.isArray(job.requirements)
      ? job.requirements.map((r) => safeString(r)).filter(Boolean)
      : [],
  };
}

export function jobSearchHaystack(job: JobVacancy): string {
  const f = getJobDisplayFields(job);
  return [f.title, f.description, f.department, f.location, f.type].join(' ').toLowerCase();
}