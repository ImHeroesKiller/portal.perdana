import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getJobs,
  getEmployees,
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

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: queryKeys.employees,
    queryFn: getEmployees,
    ...ADMIN_QUERY_OPTIONS,
  });
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

/** Invalidate and refetch all recruitment collections (jobs + candidates). */
export function useRefreshDb() {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.jobs }),
      qc.invalidateQueries({ queryKey: queryKeys.employees }),
      qc.invalidateQueries({ queryKey: queryKeys.clients }),
      qc.invalidateQueries({ queryKey: queryKeys.projects }),
    ]);
  };
}