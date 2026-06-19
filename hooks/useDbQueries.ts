import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getClients, getProjects } from '../services/db';
import { getJobs } from '../src/services/jobService';
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
  retry: 2,
} as const;

export function useJobs(options?: { activeOnly?: boolean }) {
  return useQuery<JobVacancy[], Error>({
    queryKey: queryKeys.jobs,
    queryFn: getJobs,
    ...QUERY_OPTIONS,
    select: (jobs) => (options?.activeOnly ? jobs.filter((j) => j.isActive) : jobs),
  });
}

export function useCandidates() {
  return useQuery<Employee[], Error>({
    queryKey: queryKeys.candidates,
    queryFn: getCandidates,
    ...QUERY_OPTIONS,
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

export function useRefreshDb() {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.jobs }),
      qc.invalidateQueries({ queryKey: queryKeys.candidates }),
      qc.invalidateQueries({ queryKey: queryKeys.permanentEmployees }),
      qc.invalidateQueries({ queryKey: queryKeys.clients }),
      qc.invalidateQueries({ queryKey: queryKeys.projects }),
    ]);
  };
}

export {
  createCandidate,
  updateCandidate,
  deleteCandidate,
  updatePermanentEmployee,
  getCandidates,
  getPermanentEmployees,
};