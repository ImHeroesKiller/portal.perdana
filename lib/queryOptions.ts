/** Shared React Query tuning — reduces redundant Firestore/API round-trips */

export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 60_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: true,
  retry: 1,
} as const;

/** Jobs — fresher data, still avoids focus churn */
export const JOBS_QUERY_OPTIONS = {
  ...DEFAULT_QUERY_OPTIONS,
  staleTime: 45_000,
} as const;

/** Clients / projects — change infrequently */
export const STATIC_QUERY_OPTIONS = {
  ...DEFAULT_QUERY_OPTIONS,
  staleTime: 10 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnMount: false,
} as const;

/** Admin / portal lists */
export const LIST_QUERY_OPTIONS = {
  ...DEFAULT_QUERY_OPTIONS,
  staleTime: 30_000,
} as const;