import type { JobVacancy } from '../types';

/** Lowongan publik: tampilkan kecuali secara eksplisit non-aktif (sama seperti clients/projects). */
export function filterPublicJobs(jobs: JobVacancy[]): JobVacancy[] {
  const filtered = jobs.filter((job) => job.isActive !== false);
  console.log('[filterPublicJobs]', {
    total: jobs.length,
    visible: filtered.length,
    hidden: jobs.length - filtered.length,
    sample: filtered.slice(0, 3).map((j) => ({ id: j.id, title: j.title, isActive: j.isActive })),
  });
  return filtered;
}

export function filterJobsBySearch(jobs: JobVacancy[], query: string): JobVacancy[] {
  const q = query.trim().toLowerCase();
  if (!q) return jobs;
  return jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q) ||
      job.department.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q)
  );
}

export type JobSectorFilter = 'Semua' | 'Operasional' | 'Administrasi' | 'Teknis' | 'Lainnya';

export function filterJobsBySector(jobs: JobVacancy[], sector: JobSectorFilter): JobVacancy[] {
  if (sector === 'Semua') return jobs;

  return jobs.filter((job) => {
    const dept = job.department.toLowerCase();
    if (sector === 'Operasional') {
      return (
        dept.includes('oper') ||
        dept.includes('pabrik') ||
        dept.includes('lapangan') ||
        dept.includes('crew')
      );
    }
    if (sector === 'Administrasi') {
      return (
        dept.includes('admin') ||
        dept.includes('kantor') ||
        dept.includes('finance') ||
        dept.includes('hr')
      );
    }
    if (sector === 'Teknis') {
      return (
        dept.includes('teknis') ||
        dept.includes('it') ||
        dept.includes('system') ||
        dept.includes('engineering') ||
        dept.includes('mekanik')
      );
    }
    if (sector === 'Lainnya') {
      const isOper =
        dept.includes('oper') ||
        dept.includes('pabrik') ||
        dept.includes('lapangan') ||
        dept.includes('crew');
      const isAdmin =
        dept.includes('admin') ||
        dept.includes('kantor') ||
        dept.includes('finance') ||
        dept.includes('hr');
      const isTeknis =
        dept.includes('teknis') ||
        dept.includes('it') ||
        dept.includes('system') ||
        dept.includes('engineering') ||
        dept.includes('mekanik');
      return !isOper && !isAdmin && !isTeknis;
    }
    return true;
  });
}