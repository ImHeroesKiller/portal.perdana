export const queryKeys = {
  jobs: ['jobs'] as const,
  employees: ['employees'] as const,
  clients: ['clients'] as const,
  projects: ['projects'] as const,
  employee: (id: string) => ['employees', id] as const,
};

export type DbCollectionKey = keyof Pick<typeof queryKeys, 'jobs' | 'employees' | 'clients' | 'projects'>;