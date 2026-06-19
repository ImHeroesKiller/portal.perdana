import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getJobs,
  getCandidates,
  getClients,
  getProjects,
} from '../services/db';
import { queryKeys } from '../lib/queryKeys';
import type { JobVacancy, Employee, Client, Project } from '../types';

const ADMIN_QUERY_OPTIONS = {
  staleTime: 30_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;

export function useJobs(options?: { activeOnly?: boolean }) {
  return useQuery<JobVacancy[]>({
    queryKey: queryKeys.jobs,
    queryFn: getJobs,
    ...ADMIN_QUERY_OPTIONS,
    select: (jobs) => (options?.activeOnly ? jobs.filter((j) => j.isActive) : jobs),
  });
}

export function useCandidates() {
  return useQuery<Employee[]>({
    queryKey: queryKeys.candidates,
    queryFn: getCandidates,
    ...ADMIN_QUERY_OPTIONS,
  });
}

/** @deprecated Use useCandidates() */
export function useEmployees() {
  return useCandidates();
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: queryKeys.clients,
    queryFn: getClients,
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: queryKeys.projects,
    queryFn: getProjects,
    ...ADMIN_QUERY_OPTIONS,
  });
}

/** Invalidate and refetch recruitment collections (jobs + candidates). */
export function useRefreshDb() {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.jobs }),
      qc.invalidateQueries({ queryKey: queryKeys.candidates }),
      qc.invalidateQueries({ queryKey: queryKeys.clients }),
      qc.invalidateQueries({ queryKey: queryKeys.projects }),
    ]);
  };
}