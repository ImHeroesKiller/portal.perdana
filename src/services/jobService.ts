import type { JobVacancy, NewJobVacancy } from '../../types';
import { invalidateDbQuery } from '../../lib/invalidate-queries';
import { JOBS_COLLECTION, normalizeJobFromFirestore } from '../../lib/job-record';
import { cleanDoc } from '../lib/doc-utils';
import { deleteDocument, fetchCollection, writeDocument } from './api-client';

export { JOBS_COLLECTION };

export type GetJobsOptions = {
  forceRefresh?: boolean;
};

export async function getJobs(options?: GetJobsOptions): Promise<JobVacancy[]> {
  console.log(`[jobService] getJobs → collection "${JOBS_COLLECTION}"`, options);
  const list = await fetchCollection<Record<string, unknown>>(JOBS_COLLECTION, {
    forceRefresh: options?.forceRefresh,
  });
  const normalized = list.map((doc) => normalizeJobFromFirestore(doc));
  const sorted = normalized.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  console.log(`[jobService] loaded ${sorted.length} jobs from "${JOBS_COLLECTION}"`, {
    active: sorted.filter((j) => j.isActive).length,
  });
  return sorted;
}

export async function createJob(data: NewJobVacancy): Promise<JobVacancy> {
  const id = Math.random().toString(36).substring(2, 11);
  const newJob: JobVacancy = {
    ...data,
    id,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await writeDocument(JOBS_COLLECTION, id, cleanDoc(newJob), 'POST');
    invalidateDbQuery('jobs');
    return normalizeJobFromFirestore(newJob);
  } catch (error) {
    console.warn('createJob failed:', error);
    invalidateDbQuery('jobs');
    throw error instanceof Error ? error : new Error('Gagal menyimpan lowongan');
  }
}

export async function updateJob(id: string, updates: Partial<JobVacancy>): Promise<JobVacancy> {
  const payload = cleanDoc({ ...updates, id });

  try {
    await writeDocument(JOBS_COLLECTION, id, payload, 'PUT');
    invalidateDbQuery('jobs');
  } catch (error) {
    console.warn('updateJob failed:', error);
    throw error instanceof Error ? error : new Error('Gagal memperbarui lowongan');
  }

  return normalizeJobFromFirestore({ ...(payload as Record<string, unknown>), id });
}

export async function deleteJob(id: string): Promise<void> {
  try {
    await deleteDocument(JOBS_COLLECTION, id);
    invalidateDbQuery('jobs');
  } catch (error) {
    console.warn('deleteJob failed:', error);
    throw error instanceof Error ? error : new Error('Gagal menghapus lowongan');
  }
}