import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, type QueryClient, type UseQueryResult } from '@tanstack/react-query';
import { getClients, getProjects } from '../services/db';
import {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
} from '../src/services/jobService';
import {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../src/services/candidateService';
import {
  getPermanentEmployees,
  getActivePermanentEmployees,
  updatePermanentEmployee,
} from '../src/services/employeeService';
import { queryKeys } from '../lib/queryKeys';
import {
  JOBS_QUERY_OPTIONS,
  LIST_QUERY_OPTIONS,
  STATIC_QUERY_OPTIONS,
} from '../lib/queryOptions';
import { applyPublicJobFilter, filterPublicJobs } from '../lib/job-filters';
import type { JobVacancy, Employee, Client, Project } from '../types';

type JobsQueryResult = UseQueryResult<JobVacancy[], Error> & {
  data: JobVacancy[];
  allJobs: JobVacancy[];
};

/**
 * Fetch jobs — filter di useMemo (bukan React Query `select`).
 * activeOnly: true → sembunyikan hanya job dengan isActive === false
 */
export function useJobs(options?: { activeOnly?: boolean }): JobsQueryResult {
  const activeOnly = Boolean(options?.activeOnly);
  const query = useQuery<JobVacancy[], Error>({
    queryKey: queryKeys.jobs,
    queryFn: () => getJobs(),
    ...JOBS_QUERY_OPTIONS,
  });

  const data = useMemo(() => {
    const all = query.data ?? [];
    if (!activeOnly) return all;
    return applyPublicJobFilter(all).jobs;
  }, [query.data, activeOnly]);

  const allJobs = query.data ?? [];

  useEffect(() => {
    if (query.data) {
      console.log('[useJobs]', {
        activeOnly,
        raw: query.data.length,
        returned: data.length,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
      });
    }
  }, [query.data, data.length, activeOnly, query.isLoading, query.isFetching, query.isError]);

  return {
    ...query,
    data,
    allJobs,
  };
}

/** Alias untuk halaman publik */
export function usePublicJobs(): JobsQueryResult {
  return useJobs({ activeOnly: true });
}

export function useCandidates() {
  return useQuery<Employee[], Error>({
    queryKey: queryKeys.candidates,
    queryFn: () => getCandidates(),
    ...LIST_QUERY_OPTIONS,
  });
}

export function usePermanentEmployees() {
  return useQuery<Employee[], Error>({
    queryKey: queryKeys.permanentEmployees,
    queryFn: getPermanentEmployees,
    ...LIST_QUERY_OPTIONS,
  });
}

export function useActivePermanentEmployees() {
  return useQuery<Employee[], Error>({
    queryKey: [...queryKeys.permanentEmployees, 'active'] as const,
    queryFn: getActivePermanentEmployees,
    ...LIST_QUERY_OPTIONS,
  });
}

export function useEmployees() {
  return useCandidates();
}

export function useClients() {
  return useQuery<Client[], Error>({
    queryKey: queryKeys.clients,
    queryFn: getClients,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useProjects() {
  return useQuery<Project[], Error>({
    queryKey: queryKeys.projects,
    queryFn: getProjects,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useHomePageData() {
  const jobsQuery = useJobs();
  const candidatesQuery = useCandidates();
  const clientsQuery = useClients();
  const projectsQuery = useProjects();

  const jobs = jobsQuery.data;
  const candidates = candidatesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];

  const loading =
    jobsQuery.isLoading ||
    candidatesQuery.isLoading ||
    clientsQuery.isLoading ||
    projectsQuery.isLoading;

  useEffect(() => {
    console.log('[useHomePageData]', {
      jobs: jobs.length,
      jobsRaw: jobsQuery.allJobs.length,
      jobsLoading: jobsQuery.isLoading,
      aggregateLoading: loading,
      candidates: candidates.length,
      clients: clients.length,
      projects: projects.length,
    });
  }, [
    jobs.length,
    jobsQuery.allJobs.length,
    jobsQuery.isLoading,
    loading,
    candidates.length,
    clients.length,
    projects.length,
  ]);

  return {
    jobs,
    allJobs: jobsQuery.allJobs,
    candidates,
    clients,
    projects,
    loading,
    jobsLoading: jobsQuery.isLoading || jobsQuery.isFetching,
    fetchError: jobsQuery.isError ? jobsQuery.error : null,
    refetchJobs: jobsQuery.refetch,
  };
}

export async function forceRefreshJobs(qc: QueryClient): Promise<JobVacancy[]> {
  console.log('[useDbQueries] forceRefreshJobs');
  const jobs = await qc.fetchQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => getJobs({ forceRefresh: true }),
    staleTime: 0,
  });
  console.log('[useDbQueries] forceRefreshJobs done', {
    total: jobs.length,
    visible: filterPublicJobs(jobs).length,
  });
  return jobs;
}

export async function forceRefreshCandidates(qc: QueryClient): Promise<Employee[]> {
  console.log('[useDbQueries] forceRefreshCandidates');
  return qc.fetchQuery({
    queryKey: queryKeys.candidates,
    queryFn: () => getCandidates({ forceRefresh: true }),
    staleTime: 0,
  });
}

export function useForceRefresh() {
  const qc = useQueryClient();
  return {
    jobs: () => forceRefreshJobs(qc),
    candidates: () => forceRefreshCandidates(qc),
    both: async () => {
      console.log('[useDbQueries] forceRefresh both jobs + candidates');
      const [jobs, candidates] = await Promise.all([
        forceRefreshJobs(qc),
        forceRefreshCandidates(qc),
      ]);
      return { jobs, candidates };
    },
  };
}

export function useRefreshDb() {
  const qc = useQueryClient();
  const force = useForceRefresh();

  return async (options?: { force?: boolean }) => {
    console.log('[useDbQueries] refreshDb', options);
    if (options?.force) {
      await force.both();
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.jobs }),
      qc.invalidateQueries({ queryKey: queryKeys.candidates }),
      qc.invalidateQueries({ queryKey: queryKeys.permanentEmployees }),
      qc.invalidateQueries({ queryKey: queryKeys.clients }),
      qc.invalidateQueries({ queryKey: queryKeys.projects }),
    ]);
    await Promise.all([
      qc.refetchQueries({ queryKey: queryKeys.jobs, type: 'active' }),
      qc.refetchQueries({ queryKey: queryKeys.candidates, type: 'active' }),
      qc.refetchQueries({ queryKey: queryKeys.permanentEmployees, type: 'active' }),
      qc.refetchQueries({ queryKey: queryKeys.clients, type: 'active' }),
      qc.refetchQueries({ queryKey: queryKeys.projects, type: 'active' }),
    ]);
  };
}

export {
  createCandidate,
  updateCandidate,
  deleteCandidate,
  createJob,
  updateJob,
  deleteJob,
  updatePermanentEmployee,
  getCandidates,
  getJobs,
  getPermanentEmployees,
};