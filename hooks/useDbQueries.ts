import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
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
import type { JobVacancy, Employee, Client, Project } from '../types';

const QUERY_OPTIONS = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: 'always' as const,
  retry: 2,
};

export function useJobs(options?: { activeOnly?: boolean }) {
  return useQuery<JobVacancy[], Error>({
    queryKey: queryKeys.jobs,
    queryFn: () => getJobs(),
    ...QUERY_OPTIONS,
    select: (jobs) => {
      const selected = options?.activeOnly ? jobs.filter((j) => j.isActive) : jobs;
      console.log('[useJobs] select', {
        total: jobs.length,
        returned: selected.length,
        activeOnly: Boolean(options?.activeOnly),
      });
      return selected;
    },
  });
}

export function useCandidates() {
  return useQuery<Employee[], Error>({
    queryKey: queryKeys.candidates,
    queryFn: () => getCandidates(),
    ...QUERY_OPTIONS,
    select: (candidates) => {
      console.log('[useCandidates] select', { total: candidates.length });
      return candidates;
    },
  });
}

/** Karyawan tetap — collection `employees` (ERP / payroll). */
export function usePermanentEmployees() {
  return useQuery<Employee[], Error>({
    queryKey: queryKeys.permanentEmployees,
    queryFn: getPermanentEmployees,
    ...QUERY_OPTIONS,
  });
}

export function useActivePermanentEmployees() {
  return useQuery<Employee[], Error>({
    queryKey: [...queryKeys.permanentEmployees, 'active'] as const,
    queryFn: getActivePermanentEmployees,
    ...QUERY_OPTIONS,
  });
}

/** @deprecated Use useCandidates() for pelamar, usePermanentEmployees() for karyawan tetap */
export function useEmployees() {
  return useCandidates();
}

export function useClients() {
  return useQuery<Client[], Error>({
    queryKey: queryKeys.clients,
    queryFn: getClients,
    ...QUERY_OPTIONS,
  });
}

export function useProjects() {
  return useQuery<Project[], Error>({
    queryKey: queryKeys.projects,
    queryFn: getProjects,
    ...QUERY_OPTIONS,
  });
}

export async function forceRefreshJobs(qc: QueryClient): Promise<JobVacancy[]> {
  console.log('[useDbQueries] forceRefreshJobs');
  return qc.fetchQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => getJobs({ forceRefresh: true }),
    staleTime: 0,
  });
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