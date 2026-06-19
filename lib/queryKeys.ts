export const queryKeys = {
  jobs: ['jobs'] as const,
  candidates: ['candidates'] as const,
  clients: ['clients'] as const,
  projects: ['projects'] as const,
  candidate: (id: string) => ['candidates', id] as const,
  /** @deprecated Use queryKeys.candidates */
  employees: ['candidates'] as const,
};

export type DbCollectionKey = keyof Pick<typeof queryKeys, 'jobs' | 'candidates' | 'clients' | 'projects'>;