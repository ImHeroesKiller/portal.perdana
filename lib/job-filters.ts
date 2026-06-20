import type { JobVacancy } from '../types';
import { jobSearchHaystack } from './job-display';

/**
 * Lowongan publik: tampilkan kecuali isActive secara eksplisit nonaktif.
 * undefined / null / string tidak dikenal → dianggap aktif.
 */
export function isJobPubliclyVisible(job: JobVacancy): boolean {
  const value = (job as JobVacancy & { isActive?: unknown }).isActive;

  if (value === undefined || value === null) return true;
  if (typeof value === 'boolean') return value !== false;
  if (typeof value === 'number') return value !== 0;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'no' ||
      normalized === 'inactive' ||
      normalized === 'nonaktif' ||
      normalized === 'tidak aktif'
    ) {
      return false;
    }
    return true;
  }

  return true;
}

/** Filter lowongan publik — isActive !== false (longgar) */
export function filterPublicJobs(jobs: JobVacancy[]): JobVacancy[] {
  const filtered = jobs.filter(isJobPubliclyVisible);
  console.log('[filterPublicJobs]', {
    total: jobs.length,
    visible: filtered.length,
    hidden: jobs.length - filtered.length,
    sampleInactive: jobs
      .filter((j) => !isJobPubliclyVisible(j))
      .slice(0, 3)
      .map((j) => ({ id: j.id, isActive: (j as { isActive?: unknown }).isActive })),
  });
  return filtered;
}

/** Terapkan filter publik; fallback ke raw jika semua terfilter */
export function applyPublicJobFilter(jobs: JobVacancy[]): {
  jobs: JobVacancy[];
  filterRelaxed: boolean;
} {
  const visible = filterPublicJobs(jobs);
  if (visible.length === 0 && jobs.length > 0) {
    console.warn('[applyPublicJobFilter] filter menghapus semua — gunakan data raw sebagai fallback', {
      total: jobs.length,
    });
    return { jobs, filterRelaxed: true };
  }
  return { jobs: visible, filterRelaxed: false };
}

export function filterJobsBySearch(jobs: JobVacancy[], query: string): JobVacancy[] {
  const q = query.trim().toLowerCase();
  if (!q) return jobs;
  const result = jobs.filter((job) => jobSearchHaystack(job).includes(q));
  console.log('[filterJobsBySearch]', { query: q, in: jobs.length, out: result.length });
  return result;
}

export type JobSectorFilter = 'Semua' | 'Operasional' | 'Administrasi' | 'Teknis' | 'Lainnya';

function deptMatches(dept: string, keywords: string[]): boolean {
  const lower = dept.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function filterJobsBySector(jobs: JobVacancy[], sector: JobSectorFilter): JobVacancy[] {
  if (sector === 'Semua') return jobs;

  const result = jobs.filter((job) => {
    const dept =
      String((job as JobVacancy & { dept?: string }).department ?? (job as { dept?: string }).dept ?? '').toLowerCase();

    if (sector === 'Operasional') {
      return deptMatches(dept, [
        'oper',
        'operations',
        'pabrik',
        'lapangan',
        'crew',
        'logistics',
        'maintenance',
        'konstruksi',
        'produksi',
        'helper',
      ]);
    }
    if (sector === 'Administrasi') {
      return deptMatches(dept, ['admin', 'administrasi', 'kantor', 'finance', 'hr', 'office']);
    }
    if (sector === 'Teknis') {
      return deptMatches(dept, [
        'teknis',
        'technical',
        'it',
        'system',
        'engineering',
        'mekanik',
        'maintenance',
      ]);
    }
    if (sector === 'Lainnya') {
      const isOper = deptMatches(dept, ['oper', 'operations', 'pabrik', 'lapangan', 'crew', 'logistics', 'produksi']);
      const isAdmin = deptMatches(dept, ['admin', 'administrasi', 'kantor', 'finance', 'hr', 'office']);
      const isTeknis = deptMatches(dept, ['teknis', 'technical', 'it', 'system', 'engineering', 'mekanik']);
      return !isOper && !isAdmin && !isTeknis;
    }
    return true;
  });

  console.log('[filterJobsBySector]', { sector, in: jobs.length, out: result.length });
  return result;
}

/** Terapkan filter UI — tidak pernah memfilter jika hasilnya 0 padahal input > 0 dan filter ketat */
export function applyVacancyFilters(
  jobs: JobVacancy[],
  searchQuery: string,
  sector: JobSectorFilter
): { jobs: JobVacancy[]; filterRelaxed: boolean } {
  let result = filterJobsBySearch(jobs, searchQuery);
  result = filterJobsBySector(result, sector);

  if (result.length === 0 && jobs.length > 0 && (searchQuery.trim() || sector !== 'Semua')) {
    console.warn('[applyVacancyFilters] filter menghapus semua — tampilkan semua job sebagai fallback');
    return { jobs, filterRelaxed: true };
  }

  return { jobs: result, filterRelaxed: false };
}