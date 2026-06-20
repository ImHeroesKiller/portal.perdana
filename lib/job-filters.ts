import type { JobVacancy } from '../types';
import { jobSearchHaystack } from './job-display';

/** Lowongan publik: hanya sembunyikan jika isActive secara eksplisit false */
export function filterPublicJobs(jobs: JobVacancy[]): JobVacancy[] {
  const filtered = jobs.filter((job) => job.isActive !== false);
  console.log('[filterPublicJobs]', {
    total: jobs.length,
    visible: filtered.length,
    hidden: jobs.length - filtered.length,
  });
  return filtered;
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