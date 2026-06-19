export const queryKeys = {
  jobs: ['jobs'] as const,
  candidates: ['candidates'] as const,
  permanentEmployees: ['employees'] as const,
  clients: ['clients'] as const,
  projects: ['projects'] as const,
  candidate: (id: string) => ['candidates', id] as const,
};

export type DbCollectionKey =
  | 'jobs'
  | 'candidates'
  | 'permanentEmployees'
  | 'clients'
  | 'projects';